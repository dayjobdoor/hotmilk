import { getSettingsListTheme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Container, SettingsList, Text, type SettingItem } from "@earendil-works/pi-tui";
import { BUNDLED_EXTENSION_GROUPS } from "../config/bundled-extensions.ts";
import {
  AGENT_HOTMILK_CONFIG_LABEL,
  type BundledExtensionId,
  loadBundledExtensionToggles,
  loadHotmilkConfig,
  saveHotmilkConfig,
} from "../config/hotmilk.ts";

function formatToggleState(enabled: boolean): "on" | "off" {
  return enabled ? "on" : "off";
}

function formatToggleRows(toggles: Record<BundledExtensionId, boolean>): string {
  return BUNDLED_EXTENSION_GROUPS.map((group) => {
    const rows = group.ids.map((id) => `  ${id}: ${formatToggleState(toggles[id])}`);
    return `${group.label}\n${rows.join("\n")}`;
  }).join("\n\n");
}

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

function notifyCurrentConfig(
  ctx: ExtensionContext,
  toggles: Record<BundledExtensionId, boolean>,
): void {
  ctx.ui.notify(`${AGENT_HOTMILK_CONFIG_LABEL}\n${formatToggleRows(toggles)}`, "info");
}

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
        const extensionId = id as BundledExtensionId;
        const enabled = newValue === "on";
        toggles[extensionId] = enabled;
        saveExtensionToggle(ctx, extensionId, enabled);
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
  ctx.ui.notify(`Updated ${AGENT_HOTMILK_CONFIG_LABEL} from /mode. Run /reload to apply.`, "info");
}
