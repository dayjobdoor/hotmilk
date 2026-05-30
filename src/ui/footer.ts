import {
  FooterComponent,
  type AgentSession,
  type ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { ExtensionContext } from "../controller/context.ts";
import { formatFooterTime } from "./footer-time.ts";

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

function appendMetaToLastLine(lines: string[], meta: string, width: number): string[] {
  if (lines.length === 0) {
    return [meta];
  }

  const lastIndex = lines.length - 1;
  const lastLine = lines[lastIndex] ?? "";
  const gap = 2;
  if (visibleWidth(lastLine) + gap + visibleWidth(meta) <= width) {
    const padding = " ".repeat(width - visibleWidth(lastLine) - visibleWidth(meta));
    return [...lines.slice(0, lastIndex), lastLine + padding + meta];
  }

  return [...lines, meta];
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

export function setupHotmilkFooter(ctx: ExtensionContext, termProgram: string): void {
  if (!ctx.hasUI) {
    return;
  }

  ctx.ui.setFooter((tui, theme, footerData: ReadonlyFooterDataProvider) => {
    const base = new FooterComponent(footerSessionFromContext(ctx), footerData);
    const unsubBranch = footerData.onBranchChange(() => tui.requestRender());
    const refreshTimer = setInterval(() => tui.requestRender(), FOOTER_TIME_REFRESH_MS);

    return {
      dispose() {
        unsubBranch();
        clearInterval(refreshTimer);
        base.dispose();
      },
      invalidate() {
        base.invalidate();
      },
      render(width: number): string[] {
        const baseLines = base.render(width);
        const coreLines = baseLines.slice(0, 2);
        const dim = (text: string) => theme.fg("dim", text);
        const ellipsis = theme.fg("dim", "...");
        const statusLines = extensionStatusLines(footerData, width, dim, ellipsis);
        const meta = truncateToWidth(
          dim(`${formatFooterTime(new Date())}  ${termProgram}`),
          width,
          ellipsis,
        );
        return appendMetaToLastLine([...coreLines, ...statusLines], meta, width);
      },
    };
  });
}
