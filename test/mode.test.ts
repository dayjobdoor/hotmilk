import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_HOTMILK_CONFIG,
  PERSONA_MODES,
  BUNDLED_EXTENSION_IDS,
} from "../src/config/hotmilk.ts";
import { createModeSettingItems, PERSONA_SETTING_ID } from "../src/controller/mode.ts";

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
