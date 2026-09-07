import { getSettingsListTheme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { resolveBundledExtensionToggles, resolveDefaults } from "../config/resolve.ts";
import { Container, SettingsList, Text, type SettingItem } from "@earendil-works/pi-tui";
import { BUNDLED_EXTENSION_GROUPS, BUNDLED_EXTENSION_IDS } from "../config/bundled-extensions.ts";
import {
  hotmilkConfigDisplayPath,
  isPersonaMode,
  PERSONA_MODES,
  type BundledExtensionId,
  type HotmilkConfig,
  type PersonaMode,
  loadHotmilkConfig,
  saveHotmilkConfig,
} from "../config/hotmilk.ts";

/** SettingsList id for `defaults.persona`. */
export const PERSONA_SETTING_ID = "defaults.persona";

function isBundledExtensionId(id: string): id is BundledExtensionId {
  return BUNDLED_EXTENSION_IDS.some((candidate) => candidate === id);
}

/**
 * Format toggle rows for notification display.
 *
 * @param toggles - extension toggle states
 * @returns formatted toggle rows
 */
function formatToggleRows(
  toggles: Record<BundledExtensionId, boolean>,
  persona: PersonaMode,
): string {
  const extensionRows = BUNDLED_EXTENSION_GROUPS.map((group) => {
    const rows = group.ids.map((id) => `  ${id}: ${toggles[id] ? "on" : "off"}`);
    return `${group.label}\n${rows.join("\n")}`;
  }).join("\n\n");
  return `Defaults\n  persona: ${persona}\n\n${extensionRows}`;
}

/** Build `/mode` rows: persona first, then bundled extension toggles. */
export function createModeSettingItems(
  toggles: Record<BundledExtensionId, boolean>,
  persona: PersonaMode,
): SettingItem[] {
  return [
    {
      id: "_group:Defaults",
      label: "Defaults",
      currentValue: "",
    },
    {
      id: PERSONA_SETTING_ID,
      label: "  persona",
      currentValue: persona,
      values: [...PERSONA_MODES],
    },
    ...BUNDLED_EXTENSION_GROUPS.flatMap((group) => [
      {
        id: `_group:${group.label}`,
        label: group.label,
        currentValue: "",
      },
      ...group.ids.map((id) => ({
        id,
        label: `  ${id}`,
        currentValue: toggles[id] ? "on" : "off",
        values: ["on", "off"],
      })),
    ]),
  ];
}

/**
 * Notify current config state.
 *
 * @param ctx - extension context
 * @param toggles - extension toggle states
 */
function notifyCurrentConfig(
  ctx: ExtensionContext,
  toggles: Record<BundledExtensionId, boolean>,
  persona: PersonaMode,
): void {
  ctx.ui.notify(`${hotmilkConfigDisplayPath()}\n${formatToggleRows(toggles, persona)}`, "info");
}

function saveConfigPatch(ctx: ExtensionContext, patch: HotmilkConfig): void {
  const saved = saveHotmilkConfig(patch);
  if (saved.error) {
    ctx.ui.notify(`Failed to write ${saved.path}: ${saved.error}`, "error");
  }
}
function updateConfig(
  ctx: ExtensionContext,
  update: (config: HotmilkConfig) => HotmilkConfig,
): void {
  const { config } = loadHotmilkConfig();
  saveConfigPatch(ctx, update(config));
}

/** Open the interactive TUI modal for toggling bundled extensions. */
export async function openModeSettingsModal(ctx: ExtensionContext): Promise<void> {
  const config = loadHotmilkConfig().config;
  const toggles = resolveBundledExtensionToggles(config);
  let persona = resolveDefaults(config).persona;
  const items = createModeSettingItems(toggles, persona);

  await ctx.ui.custom((_tui, theme, _kb, done) => {
    const container = new Container();
    container.addChild(new Text(theme.fg("accent", theme.bold("Mode settings")), 1, 1));

    const settingsList = new SettingsList(
      items,
      Math.min(items.length + 2, 15),
      getSettingsListTheme(),
      (id, newValue) => {
        if (id.startsWith("_group:")) {
          return;
        }
        if (id === PERSONA_SETTING_ID) {
          if (!isPersonaMode(newValue)) {
            return;
          }
          persona = newValue;
          updateConfig(ctx, (config) => ({
            ...config,
            defaults: { ...config.defaults, persona: newValue },
          }));
          return;
        }
        if (!isBundledExtensionId(id)) {
          return;
        }
        const enabled = newValue === "on";
        toggles[id] = enabled;
        updateConfig(ctx, (config) => ({
          ...config,
          extensions: { ...config.extensions, [id]: enabled },
        }));
      },
      () => done(undefined),
      { enableSearch: true },
    );
    container.addChild(settingsList);

    return {
      render: (width) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data) => settingsList.handleInput?.(data),
    };
  });

  notifyCurrentConfig(ctx, toggles, persona);
  ctx.ui.notify(`Updated ${hotmilkConfigDisplayPath()} from /mode. Run /reload to apply.`, "info");
}
