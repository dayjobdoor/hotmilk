import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { initTheme } from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vite-plus/test";
import { BUNDLED_EXTENSION_IDS, OMP_SUPPORTED_IDS } from "../src/config/bundled-extensions.ts";
import { DEFAULT_HOTMILK_CONFIG } from "../src/config/hotmilk.ts";
import { createModeSettingItems, openModeSettingsModal } from "../src/controller/mode.ts";
import { withConfigEnv } from "./fixtures/runtime.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("createModeSettingItems", () => {
  it("marks rows without the omp flag as pi only under omp", () => {
    const label = (harness: "pi" | "omp", id: string) =>
      createModeSettingItems(DEFAULT_HOTMILK_CONFIG.extensions, harness).find(
        (item) => item.id === id,
      )?.label;
    const unsupported = BUNDLED_EXTENSION_IDS.find((id) => !OMP_SUPPORTED_IDS.includes(id))!;
    const supported = OMP_SUPPORTED_IDS[0]!;
    expect(label("omp", unsupported)).toBe(`  ${unsupported} (pi only)`);
    expect(label("omp", supported)).toBe(`  ${supported}`);
    expect(label("pi", unsupported)).toBe(`  ${unsupported}`);
  });
});

describe("openModeSettingsModal", () => {
  it("opens the settings UI and tells the user to /reload", async () => {
    const configRoot = makeTempDir("hotmilk-mode-modal-");
    writeFileSync(join(configRoot, "hotmilk.json"), "{}", "utf8");

    const custom = vi.fn(async (factory) => {
      const theme = {
        fg: (_color: string, text: string) => text,
        bold: (text: string) => text,
      };
      // SAFETY: modal factory only needs fg/bold from the theme stub.
      await factory({} as never, theme as never, {} as never, () => {});
    });
    const notify = vi.fn();

    await withConfigEnv(configRoot, undefined, async () => {
      initTheme(undefined, false);
      // SAFETY: test double implements only modal UI methods.
      await openModeSettingsModal({ ui: { custom, notify } } as never);

      expect(custom).toHaveBeenCalledOnce();
      expect(notify).toHaveBeenCalledWith(expect.stringContaining("/reload"), "info");
    });
  });

  it("persists a toggled row to hotmilk.json", async () => {
    const configRoot = makeTempDir("hotmilk-mode-save-");
    const configPath = join(configRoot, "hotmilk.json");
    writeFileSync(configPath, "{}", "utf8");

    const custom = vi.fn(async (factory) => {
      const theme = { fg: (_color: string, text: string) => text, bold: (text: string) => text };
      // SAFETY: modal factory only needs fg/bold from the theme stub.
      const modal = await factory({} as never, theme as never, {} as never, () => {});
      for (const char of "skill-registry") modal.handleInput(char); // search filters to one row
      modal.handleInput("\r"); // toggle it on
    });

    await withConfigEnv(configRoot, undefined, async () => {
      initTheme(undefined, false);
      // SAFETY: test double implements only modal UI methods.
      await openModeSettingsModal({ ui: { custom, notify: vi.fn() } } as never);
    });

    const saved = JSON.parse(readFileSync(configPath, "utf8"));
    expect(saved.extensions["skill-registry"]).toBe(true);
  });
});
