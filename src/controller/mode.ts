import { getSettingsListTheme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Container, SettingsList, Text, type SettingItem } from "@earendil-works/pi-tui";
import { BUNDLED_EXTENSION_GROUPS, BUNDLED_EXTENSION_IDS } from "../config/bundled-extensions.ts";
import {
  hotmilkConfigDisplayPath,
  type BundledExtensionId,
  loadBundledExtensionToggles,
  loadHotmilkConfig,
  saveHotmilkConfig,
} from "../config/hotmilk.ts";

function isBundledExtensionId(id: string): id is BundledExtensionId {
  return BUNDLED_EXTENSION_IDS.some((candidate) => candidate === id);
}

/**
 * Format toggle state as "on" or "off".
 *
 * @param enabled - toggle state
 * @returns formatted state
 */
function formatToggleState(enabled: boolean): "on" | "off" {
  return enabled ? "on" : "off";
}

/**
 * Format toggle rows for notification display.
 *
 * @param toggles - extension toggle states
 * @returns formatted toggle rows
 */
function formatToggleRows(toggles: Record<BundledExtensionId, boolean>): string {
  return BUNDLED_EXTENSION_GROUPS.map((group) => {
    const rows = group.ids.map((id) => `  ${id}: ${formatToggleState(toggles[id])}`);
    return `${group.label}\n${rows.join("\n")}`;
  }).join("\n\n");
}

/**
 * Create setting items for the mode settings modal.
 *
 * @param toggles - extension toggle states
 * @returns setting items
 */
function createModeSettingItems(toggles: Record<BundledExtensionId, boolean>): SettingItem[] {
  return BUNDLED_EXTENSION_GROUPS.flatMap((group) => [
    {
      id: `_group:${group.label}`,
      label: group.label,
      currentValue: "",
    },
    ...group.ids.map((id) => ({
      id,
      label: `  ${id}`,
      currentValue: formatToggleState(toggles[id]),
      values: ["on", "off"],
    })),
  ]);
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
): void {
  ctx.ui.notify(`${hotmilkConfigDisplayPath()}\n${formatToggleRows(toggles)}`, "info");
}

/**
 * Save extension toggle state to config.
 *
 * @param ctx - extension context
 * @param extensionId - extension ID
 * @param enabled - toggle state
 */
function saveExtensionToggle(
  ctx: ExtensionContext,
  extensionId: BundledExtensionId,
  enabled: boolean,
): void {
  const { config } = loadHotmilkConfig();
  const saved = saveHotmilkConfig({
    ...config,
    extensions: { ...config.extensions, [extensionId]: enabled },
  });
  if (saved.error) {
    ctx.ui.notify(`Failed to write ${saved.path}: ${saved.error}`, "error");
  }
}

/** Open the interactive TUI modal for toggling bundled extensions. */
export async function openModeSettingsModal(ctx: ExtensionContext): Promise<void> {
  const toggles = loadBundledExtensionToggles();
  const items = createModeSettingItems(toggles);

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
        if (!isBundledExtensionId(id)) {
          return;
        }
        const enabled = newValue === "on";
        toggles[id] = enabled;
        saveExtensionToggle(ctx, id, enabled);
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

  notifyCurrentConfig(ctx, toggles);
  ctx.ui.notify(`Updated ${hotmilkConfigDisplayPath()} from /mode. Run /reload to apply.`, "info");
}
