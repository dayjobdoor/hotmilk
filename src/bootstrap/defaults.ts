/**
 * Persona / language defaults bootstrap.
 *
 * Reconciles a project-level Gentle AI persona file with hotmilk config and
 * injects a language hint into the system prompt when `defaults.language` is set.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
 * Reconcile the project persona marker used by gentle-pi with hotmilk config.
 *
 * gentle-pi accepts only `gentleman` and `neutral`; custom hotmilk personas map
 * to the nearest upstream mode and are applied by `applyHotmilkPersonaPrompt`.
 * hotmilk.json stays the source of truth at session start: a stale `mode`
 * (e.g. from `/gentle:persona` or an older hotmilk version) is rewritten, and
 * runtime persona changes re-sync on the next session. A missing marker is
 * only written for `neutral`, because `gentleman` is already the gentle-pi
 * fallback when the file is absent.
 */
export function syncPersonaFileFromDefaults(cwd: string, defaults: ResolvedDefaults): void {
  const upstreamMode = defaults.persona === "gentleman" ? "gentleman" : "neutral";
  const path = join(cwd, ".pi", "gentle-ai", "persona.json");
  if (existsSync(path)) {
    try {
      // SAFETY: JSON.parse returns any; only `mode` is read and compared by equality.
      const parsed = JSON.parse(readFileSync(path, "utf8")) as { mode?: unknown };
      if (parsed.mode === upstreamMode) {
        return;
      }
    } catch {
      // Unreadable marker: fall through and rewrite it.
    }
  } else if (upstreamMode === "gentleman") {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify({ mode: upstreamMode, hotmilkMode: defaults.persona }, null, 2)}\n`,
    "utf8",
  );
}

const GYAL_PERSONA_PROMPT = `Persona:
- Speak as a bright, confident Japanese gyal: casual, warm, energetic, and candid.
- Keep the advice technically rigorous; friendliness never replaces correctness.
- Use light gyal-style phrasing sparingly. Do not overuse slang, emojis, or insults.
- Explain mistakes directly without humiliating the user, and keep code and technical artifacts professional.
- Use lots of emojis and casual Japanese style.
- Tsundere 8:2 (tsun only 0-1 times per response).
- Speak in Japanese, warm and energetic but slightly tsun.`;

const RAIDEN_PERSONA_PROMPT = `Persona:
- Speak in the spirit of Raiden from Sakigake!! Otokojuku: composed, forceful, erudite, and intensely focused.
- Explain difficult technical subjects like obscure techniques being revealed: state the name, mechanism, evidence, and limits.
- Use dramatic martial-arts framing sparingly, including an occasional "知っているのか雷電！？" only when it genuinely fits.
- Never invent lore or technical facts. Correct errors directly, while keeping code and technical artifacts professional.`;

/** Replace gentle-pi's built-in persona section without duplicating its harness rules. */
export function applyHotmilkPersonaPrompt(
  systemPrompt: string,
  persona: ResolvedDefaults["persona"],
): string {
  if (persona !== "gyal" && persona !== "raiden") {
    return systemPrompt;
  }

  const personaPrompt = persona === "gyal" ? GYAL_PERSONA_PROMPT : RAIDEN_PERSONA_PROMPT;
  const modeUpdated = systemPrompt.replace(
    /^Current persona mode: [^\n]+$/mu,
    `Current persona mode: ${persona}`,
  );
  const personaStart = modeUpdated.indexOf("\nPersona:\n");
  const harnessStart =
    personaStart < 0 ? -1 : modeUpdated.indexOf("\n\nHarness principles:", personaStart);
  if (personaStart >= 0 && harnessStart > personaStart) {
    return `${modeUpdated.slice(0, personaStart)}\n${personaPrompt}${modeUpdated.slice(harnessStart)}`;
  }

  return `${modeUpdated}\n\n## Hotmilk persona override (${persona})\n${personaPrompt}`;
}

/**
 * Register handlers that inject the configured persona and language into the
 * system prompt. Registered after bundled extensions, so custom personas
 * replace gentle-pi's built-in persona section rather than competing with it.
 */
export function registerDefaultsHandlers(pi: ExtensionAPI, defaults: ResolvedDefaults): void {
  if (!defaults.language && defaults.persona !== "gyal" && defaults.persona !== "raiden") {
    return;
  }

  const languageHint = defaults.language;
  pi.on("before_agent_start", async (event) => {
    let systemPrompt = applyHotmilkPersonaPrompt(event.systemPrompt, defaults.persona);
    if (languageHint) {
      systemPrompt = `${systemPrompt}\n\n## Project language default\nPrefer responding in ${languageHint} unless the user clearly uses another language.`;
    }
    return { systemPrompt };
  });
}
