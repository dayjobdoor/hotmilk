/**
 * Language default bootstrap: injects a language hint into the system prompt
 * when `defaults.language` is set.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedDefaults } from "../config/hotmilk.ts";

/** Register the `before_agent_start` handler that appends the project language hint. */
export function registerDefaultsHandlers(pi: ExtensionAPI, defaults: ResolvedDefaults): void {
  const languageHint = defaults.language;
  if (!languageHint) return;

  pi.on("before_agent_start", async (event) => ({
    systemPrompt: `${event.systemPrompt}\n\n## Project language default\nPrefer responding in ${languageHint} unless the user clearly uses another language.`,
  }));
}
