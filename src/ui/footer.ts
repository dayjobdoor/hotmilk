import {
  FooterComponent,
  type AgentSession,
  type ExtensionContext,
  type ReadonlyFooterDataProvider,
  type Theme,
} from "@earendil-works/pi-coding-agent";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import {
  type GithubFooterContext,
  isGithubRepoOwner,
  resolveGithubFooterContextAsync,
} from "./github-user.ts";

/** Pure footer clock formatting (no pi-coding-agent imports — safe for unit tests). */
export function formatFooterTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function sanitizeStatusText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

function extensionStatusLines(
  footerData: ReadonlyFooterDataProvider,
  width: number,
  dim: (text: string) => string,
  ellipsis: string,
): string[] {
  const extensionStatuses = footerData.getExtensionStatuses();
  if (extensionStatuses.size === 0) {
    return [];
  }

  return [...extensionStatuses.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, text]) => sanitizeStatusText(text))
    .filter((text) => text.length > 0)
    .map((text) => truncateToWidth(dim(text), width, ellipsis));
}

function isVisibleFooterLine(line: string): boolean {
  return visibleWidth(line) > 0;
}

function appendMetaToLastLine(lines: string[], meta: string, width: number): string[] {
  const visibleLines = lines.filter(isVisibleFooterLine);
  if (visibleLines.length === 0) {
    return isVisibleFooterLine(meta) ? [meta] : [];
  }

  const lastIndex = visibleLines.length - 1;
  const lastLine = visibleLines[lastIndex] ?? "";
  const gap = 2;
  if (visibleWidth(lastLine) + gap + visibleWidth(meta) <= width) {
    const padding = " ".repeat(width - visibleWidth(lastLine) - visibleWidth(meta));
    return [...visibleLines.slice(0, lastIndex), lastLine + padding + meta];
  }

  if (!isVisibleFooterLine(meta)) {
    return visibleLines;
  }

  return [...visibleLines, meta];
}

const FOOTER_TIME_REFRESH_MS = 30_000;

function latestThinkingLevel(sessionManager: ExtensionContext["sessionManager"]): ThinkingLevel {
  const entries = sessionManager.getEntries();
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.type === "thinking_level_change") {
      return entry.thinkingLevel as ThinkingLevel;
    }
  }
  return "off";
}

function footerSessionFromContext(ctx: ExtensionContext): AgentSession {
  return {
    get state() {
      return {
        model: ctx.model,
        thinkingLevel: latestThinkingLevel(ctx.sessionManager),
      };
    },
    sessionManager: ctx.sessionManager,
    getContextUsage: () => ctx.getContextUsage(),
    modelRegistry: ctx.modelRegistry,
  } as AgentSession;
}

function decoratePwdLine(
  pwdLine: string,
  githubUser: string | undefined,
  repoOwner: string | undefined,
  width: number,
  theme: Theme,
): string {
  if (!githubUser) {
    return pwdLine;
  }

  const handle = `@${githubUser}`;
  const handleColor = isGithubRepoOwner(githubUser, repoOwner) ? "success" : "accent";
  const handleStyled = theme.fg(handleColor, handle);
  const decorated = pwdLine + theme.fg("dim", " · ") + handleStyled;
  return truncateToWidth(decorated, width, theme.fg("dim", "..."));
}

export function setupHotmilkFooter(ctx: ExtensionContext, termProgram: string): void {
  if (!ctx.hasUI) {
    return;
  }

  ctx.ui.setFooter((tui, theme, footerData: ReadonlyFooterDataProvider) => {
    let githubContext: GithubFooterContext | null = null;
    let resolveStarted = false;
    let disposed = false;

    const base = new FooterComponent(footerSessionFromContext(ctx), footerData);
    const unsubBranch = footerData.onBranchChange(() => {
      if (disposed) return;
      tui.requestRender();
    });
    const refreshTimer = setInterval(() => {
      if (disposed) return;
      tui.requestRender();
    }, FOOTER_TIME_REFRESH_MS);

    return {
      dispose() {
        disposed = true;
        unsubBranch();
        clearInterval(refreshTimer);
        base.dispose();
      },
      invalidate() {
        base.invalidate();
      },
      render(width: number): string[] {
        if (!resolveStarted) {
          resolveStarted = true;
          void resolveGithubFooterContextAsync({ cwd: ctx.cwd }).then((resolved) => {
            if (disposed) return;
            githubContext = resolved;
            tui.requestRender();
          });
        }

        const githubUser = githubContext?.githubUser;
        const repoOwner = githubContext?.repoOwner;
        const baseLines = base.render(width);
        const [pwdLine, statsLine] = baseLines;
        const dim = (text: string) => theme.fg("dim", text);
        const ellipsis = theme.fg("dim", "...");
        const coreLines = pwdLine
          ? [
              decoratePwdLine(pwdLine, githubUser, repoOwner, width, theme),
              ...(statsLine === undefined ? [] : [statsLine]),
            ]
          : baseLines.slice(0, 2);
        const statusLines = extensionStatusLines(footerData, width, dim, ellipsis);
        const meta = truncateToWidth(
          dim(`${formatFooterTime(new Date())}  ${termProgram}`),
          width,
          ellipsis,
        );
        const lines = [...coreLines, ...statusLines].filter(isVisibleFooterLine);
        return appendMetaToLastLine(lines, meta, width).filter(isVisibleFooterLine);
      },
    };
  });
}
