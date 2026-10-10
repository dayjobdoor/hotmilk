import { getSettingsListTheme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Container, SettingsList, Text, type SettingItem } from "@earendil-works/pi-tui";
import {
  BUNDLED_EXTENSION_GROUPS,
  BUNDLED_EXTENSION_IDS,
  OMP_SUPPORTED_IDS,
  type BundledExtensionId,
} from "../config/bundled-extensions.ts";
import { detectHarness, type Harness } from "../config/runtime.ts";
import {
  hotmilkConfigDisplayPath,
  type HotmilkConfig,
  loadHotmilkConfig,
  resolveBundledExtensionToggles,
  saveHotmilkConfig,
} from "../config/hotmilk.ts";

function isBundledExtensionId(id: string): id is BundledExtensionId {
  return BUNDLED_EXTENSION_IDS.some((candidate) => candidate === id);
}

/**
 * Format mode config rows for notification display.
 *
 * @param toggles - extension toggle states
 * @returns formatted toggle rows
 */
function formatModeConfigRows(toggles: Record<BundledExtensionId, boolean>): string {
  return BUNDLED_EXTENSION_GROUPS.map((group) => {
    const rows = group.ids.map((id) => `  ${id}: ${toggles[id] ? "on" : "off"}`);
    return `${group.label}\n${rows.join("\n")}`;
  }).join("\n\n");
}

/** Build `/mode` rows: bundled extension toggles by group (omp marks pi-only rows). */
export function createModeSettingItems(
  toggles: Record<BundledExtensionId, boolean>,
  harness: Harness = "pi",
): SettingItem[] {
  return BUNDLED_EXTENSION_GROUPS.flatMap((group) => [
    {
      id: `_group:${group.label}`,
      label: group.label,
      currentValue: "",
    },
    ...group.ids.map((id) => ({
      id,
      label: harness === "omp" && !OMP_SUPPORTED_IDS.includes(id) ? `  ${id} (pi only)` : `  ${id}`,
      currentValue: toggles[id] ? "on" : "off",
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
  ctx.ui.notify(`${hotmilkConfigDisplayPath()}\n${formatModeConfigRows(toggles)}`, "info");
}

function saveConfigFile(ctx: ExtensionContext, nextConfig: HotmilkConfig): void {
  const saved = saveHotmilkConfig(nextConfig);
  if (saved.error) {
    ctx.ui.notify(`Failed to write ${saved.path}: ${saved.error}`, "error");
  }
}
function updateConfig(
  ctx: ExtensionContext,
  update: (config: HotmilkConfig) => HotmilkConfig,
): void {
  const { config } = loadHotmilkConfig();
  saveConfigFile(ctx, update(config));
}

/** Open the interactive TUI modal for toggling bundled extensions. */
export async function openModeSettingsModal(ctx: ExtensionContext): Promise<void> {
  const toggles = resolveBundledExtensionToggles(loadHotmilkConfig().config);
  const items = createModeSettingItems(toggles, detectHarness());

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

  notifyCurrentConfig(ctx, toggles);
  ctx.ui.notify(`Updated ${hotmilkConfigDisplayPath()} from /mode. Run /reload to apply.`, "info");
}
