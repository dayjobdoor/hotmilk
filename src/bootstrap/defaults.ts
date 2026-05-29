import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedDefaults } from "../config/hotmilk.ts";

export function seedPersonaFromDefaults(cwd: string, defaults: ResolvedDefaults): void {
  const path = join(cwd, ".pi", "gentle-ai", "persona.json");
  if (existsSync(path)) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ mode: defaults.persona }, null, 2)}\n`, "utf8");
}

export function registerDefaultsHandlers(pi: ExtensionAPI, defaults: ResolvedDefaults): void {
  if (!defaults.language) {
    return;
  }

  const languageHint = defaults.language;
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: `${event.systemPrompt}\n\n## Project language default\nPrefer responding in ${languageHint} unless the user clearly uses another language.`,
  }));
}
