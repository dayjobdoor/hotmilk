/**
 * Graphify stale-graph warnings.
 *
 * Warns the user at session start when `graphify-out/needs_update` exists.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedGraphSettings } from "../config/hotmilk.ts";

/**
 * Register the session_start handler that warns about stale graphify output.
 *
 * @param pi - Pi extension API
 * @param settings - resolved graph settings
 */
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
