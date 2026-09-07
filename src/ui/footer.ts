import {
  FooterComponent,
  type ExtensionContext,
  type ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

/**
 * Pure footer clock formatting (no pi-coding-agent imports — safe for unit tests).
 *
 * @param date - Date to format
 * @returns formatted time string in HH:mm:ss format
 */
export function formatFooterTime(date: Date): string {
  const twoDigits = (value: number): string => String(value).padStart(2, "0");
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`;
}

/**
 * Sanitize footer status text by removing newlines, tabs, and extra spaces.
 *
 * @param text - raw status text
 * @returns sanitized text
 */
function sanitizeStatusText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

/**
 * Format extension status lines for the footer.
 *
 * @param footerData - footer data provider
 * @param width - terminal width
 * @param dim - dimming function
 * @param ellipsis - ellipsis string
 * @returns formatted status lines
 */
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

/**
 * Check if a footer line has visible content.
 *
 * @param line - line to check
 * @returns true if line has visible content
 */
function isVisibleFooterLine(line: string): boolean {
  return visibleWidth(line) > 0;
}

/**
 * Append metadata (time, term program) to the last footer line if it fits.
 *
 * @param lines - existing footer lines
 * @param meta - metadata to append
 * @param width - terminal width
 * @returns updated lines
 */
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

function isThinkingLevel(value: string): value is ThinkingLevel {
  return (
    value === "off" ||
    value === "minimal" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "xhigh" ||
    value === "max"
  );
}

/**
 * Get the latest thinking level from session manager entries.
 *
 * @param sessionManager - Pi session manager
 * @returns latest thinking level
 */
function latestThinkingLevel(sessionManager: ExtensionContext["sessionManager"]): ThinkingLevel {
  const entries = sessionManager.getEntries();
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.type === "thinking_level_change" && isThinkingLevel(entry.thinkingLevel)) {
      return entry.thinkingLevel;
    }
  }
  return "off";
}

/**
 * Minimal ModelRuntime facade for FooterComponent.
 * ExtensionContext exposes ModelRegistry, while FooterComponent calls
 * `session.modelRuntime.isUsingOAuth(providerId)` and
 * `session.modelRuntime.isUsingSubscription(providerId)`.
 *
 * @param ctx - model + modelRegistry from extension context
 * @returns OAuth and subscription status methods by provider ID
 */
export type FooterModelRuntime = {
  isUsingOAuth(providerId: string): boolean;
  isUsingSubscription(providerId: string): boolean;
};

export function footerModelRuntimeFromContext(
  ctx: Pick<ExtensionContext, "model" | "modelRegistry">,
): FooterModelRuntime {
  return {
    isUsingOAuth(providerId: string): boolean {
      const { model, modelRegistry } = ctx;
      if (model?.provider === providerId) {
        return modelRegistry.isUsingOAuth(model);
      }
      const match = modelRegistry.getAll().find((candidate) => candidate.provider === providerId);
      return match ? modelRegistry.isUsingOAuth(match) : false;
    },
    isUsingSubscription(providerId: string): boolean {
      if (!this.isUsingOAuth(providerId)) {
        return false;
      }
      return ctx.modelRegistry.getProvider(providerId)?.auth.oauth?.isSubscription === true;
    },
  };
}

/**
 * Create a footer-compatible session object from extension context.
 *
 * @param ctx - extension context
 * @returns agent session fields FooterComponent reads
 */
function footerSessionFromContext(ctx: ExtensionContext): FooterSession {
  return {
    get state() {
      return {
        model: ctx.model,
        thinkingLevel: ctx.thinkingLevel ?? latestThinkingLevel(ctx.sessionManager),
      };
    },
    sessionManager: ctx.sessionManager,
    getContextUsage: () => ctx.getContextUsage(),
    modelRuntime: footerModelRuntimeFromContext(ctx),
  };
}

type FooterSession = {
  readonly state: {
    model: ExtensionContext["model"];
    thinkingLevel: ThinkingLevel;
  };
  sessionManager: ExtensionContext["sessionManager"];
  getContextUsage: ExtensionContext["getContextUsage"];
  modelRuntime: FooterModelRuntime;
};

function createHotmilkFooterComponent(
  ctx: ExtensionContext,
  footerData: ReadonlyFooterDataProvider,
): FooterComponent {
  // SAFETY: FooterComponent.render only reads state.{model, thinkingLevel},
  // sessionManager.{getEntries, getCwd, getSessionName}, getContextUsage(),
  // and modelRuntime.isUsingSubscription(). AgentSession private members are unused.
  return new FooterComponent(footerSessionFromContext(ctx) as never, footerData);
}

/** Install the hotmilk footer with clock and extension status lines. */
export function setupHotmilkFooter(ctx: ExtensionContext, termProgram: string): void {
  if (!ctx.hasUI) {
    return;
  }

  ctx.ui.setFooter((tui, theme, footerData: ReadonlyFooterDataProvider) => {
    let disposed = false;
    const base = createHotmilkFooterComponent(ctx, footerData);
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
        const baseLines = base.render(width);
        const [pwdLine, statsLine] = baseLines;
        const dim = (text: string) => theme.fg("dim", text);
        const ellipsis = theme.fg("dim", "...");
        const coreLines = pwdLine
          ? [pwdLine, ...(statsLine === undefined ? [] : [statsLine])]
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
