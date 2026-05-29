import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedGraphSettings } from "../config/hotmilk.ts";

export function registerGraphHandlers(pi: ExtensionAPI, settings: ResolvedGraphSettings): void {
  if (!settings.warnOnStale) {
    return;
  }

  pi.on("session_start", (_event, ctx) => {
    const needsUpdatePath = join(ctx.cwd, "graphify-out", "needs_update");
    if (!existsSync(needsUpdatePath)) {
      return;
    }

    let message = "Graph may be stale (graphify-out/needs_update).";
    if (settings.autoSuggestUpdate) {
      message += " Run `graphify update .` before relying on modified areas.";
    }
    ctx.ui.notify(message, "warning");
  });
}
