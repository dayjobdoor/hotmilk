import {
  FooterComponent,
  type AgentSession,
  type ReadonlyFooterDataProvider,
} from "@earendil-works/pi-coding-agent";
import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { truncateToWidth } from "@earendil-works/pi-tui";
import type { ExtensionContext } from "../controller/context.ts";
import { formatFooterTime } from "./footer-time.ts";

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
        const lines = base.render(width);
        const meta = theme.fg("dim", `${formatFooterTime(new Date())}  ${termProgram}`);
        return [...lines, "", truncateToWidth(meta, width, theme.fg("dim", "..."))];
      },
    };
  });
}
