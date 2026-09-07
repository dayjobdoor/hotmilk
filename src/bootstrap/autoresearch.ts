import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

/** Avoids Pi's built-in `tui.altScreen.search` binding on `ctrl+shift+f`. */
export const HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT = "ctrl+shift+y";

const CONFIG_FILE_NAME = "pi-autoresearch.json";

export type SeedAutoresearchShortcutsResult = {
  seeded: boolean;
  path: string;
};

/** Agent config path for pi-autoresearch shortcut overrides. */
export function autoresearchShortcutsConfigPath(agentDir: string = getAgentDir()): string {
  return join(agentDir, "extensions", CONFIG_FILE_NAME);
}

/**
 * Seed a non-conflicting autoresearch fullscreen shortcut when absent.
 *
 * Must run before `pi-autoresearch` loads so `resolveAutoresearchShortcuts` picks
 * up the hotmilk default instead of `ctrl+shift+f`.
 *
 * @param agentDir - Pi agent directory root
 */
export function seedAutoresearchShortcutsIfMissing(
  agentDir: string = getAgentDir(),
): SeedAutoresearchShortcutsResult {
  const configPath = autoresearchShortcutsConfigPath(agentDir);
  if (existsSync(configPath)) {
    return { seeded: false, path: configPath };
  }

  mkdirSync(join(agentDir, "extensions"), { recursive: true });
  writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        shortcuts: {
          fullscreenDashboard: HOTMILK_AUTORESEARCH_FULLSCREEN_SHORTCUT,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return { seeded: true, path: configPath };
}

/**
 * Eagerly seed autoresearch shortcut config before bundled extensions register.
 *
 * @param autoresearchEnabled - resolved `extensions.autoresearch` toggle
 */
export function prepareAutoresearchShortcuts(autoresearchEnabled: boolean): void {
  if (!autoresearchEnabled) {
    return;
  }
  seedAutoresearchShortcutsIfMissing();
}
