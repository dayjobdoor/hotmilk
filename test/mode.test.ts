import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { initTheme } from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vite-plus/test";
import { BUNDLED_EXTENSION_IDS } from "../src/config/bundled-extensions.ts";
import { DEFAULT_HOTMILK_CONFIG, PERSONA_MODES } from "../src/config/hotmilk.ts";
import { createModeSettingItems, openModeSettingsModal, PERSONA_SETTING_ID } from "../src/controller/mode.ts";
import { withConfigEnv } from "./fixtures/runtime.ts";
import { makeTempDir } from "./fixtures/tmp.ts";

describe("createModeSettingItems", () => {
  it("exposes persona before extension toggles", () => {
    const items = createModeSettingItems(DEFAULT_HOTMILK_CONFIG.extensions, "gyal");
    const persona = items.find((item) => item.id === PERSONA_SETTING_ID);

    expect(items[0]?.id).toBe("_group:Defaults");
    expect(persona).toEqual({
      id: PERSONA_SETTING_ID,
      label: "  persona",
      currentValue: "gyal",
      values: [...PERSONA_MODES],
    });
    const personaIndex = items.findIndex((item) => item.id === PERSONA_SETTING_ID);
    const firstExtensionIndex = items.findIndex((item) => item.id === BUNDLED_EXTENSION_IDS[0]);
    expect(personaIndex).toBeLessThan(firstExtensionIndex);
  });
});

describe("openModeSettingsModal", () => {
  it("opens the custom settings UI and notifies after save", async () => {
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
      expect(notify).toHaveBeenCalledWith(expect.stringContaining("Updated"), "info");
    });
  });
});
