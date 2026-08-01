/**
 * Persona / language defaults bootstrap.
 *
 * Seeds a project-level Gentle AI persona file from hotmilk config and injects
 * a language hint into the system prompt when `defaults.language` is set.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedDefaults } from "../config/hotmilk.ts";

/** Warning shown when caveman terse-mode clashes with Japanese language default. */
export const CAVEMAN_JA_CONFLICT_MESSAGE =
  "caveman is on while defaults.language is ja — caveman adds English terse rules that fight the Japanese language hint. Turn off caveman (/mode), clear defaults.language, or use /caveman off.";

/**
 * Detect the caveman + Japanese language conflict.
 *
 * @param cavemanEnabled - whether caveman toggle is on
 * @param language - configured language hint
 */
export function shouldWarnCavemanJaConflict(
  cavemanEnabled: boolean,
  language: string | undefined,
): boolean {
  return cavemanEnabled && language?.trim().toLowerCase() === "ja";
}

/** Warning when kanagawa theme replaces the hotmilk footer. */
export const KANAGAWA_FOOTER_WARNING =
  "kanagawa is on — it replaces the hotmilk footer. Turn off kanagawa (/mode) if you want the hotmilk status footer back.";

/**
 * Detect when kanagawa will replace the hotmilk footer.
 *
 * @param kanagawaEnabled - whether kanagawa toggle is on
 */
export function shouldWarnKanagawaFooter(kanagawaEnabled: boolean): boolean {
  return kanagawaEnabled;
}

/**
 * Write `.pi/gentle-ai/persona.json` from resolved defaults when absent.
 *
 * @param cwd - project root
 * @param defaults - resolved defaults containing persona mode
 */
export function seedPersonaFromDefaults(cwd: string, defaults: ResolvedDefaults): void {
  const path = join(cwd, ".pi", "gentle-ai", "persona.json");
  if (existsSync(path)) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ mode: defaults.persona }, null, 2)}\n`, "utf8");
}

/**
 * Register handlers that inject the configured language into system prompts.
 *
 * @param pi - Pi extension API
 * @param defaults - resolved defaults
 */
export function registerDefaultsHandlers(pi: ExtensionAPI, defaults: ResolvedDefaults): void {
  if (!defaults.language) {
    return;
  }

  const languageHint = defaults.language;
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: `${event.systemPrompt}\n\n## Project language default\nPrefer responding in ${languageHint} unless the user clearly uses another language.`,
  }));
}
