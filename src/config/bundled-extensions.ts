/** npm package name that provides a bundled extension when installed via Pi settings. */

export type BundledExtensionLoadPhase = "context-stack" | "parallel";

export type BundledExtensionDefinition = {
  readonly id: string;
  readonly packageName: string;
  /** Path passed to `loadBundled()` / `bundledImportUrl()`. */
  readonly module: string;
  /** `/mode` section label — must appear in {@link BUNDLED_EXTENSION_GROUP_ORDER}. */
  readonly group: BundledExtensionGroupLabel;
  readonly defaultEnabled?: boolean;
  readonly loadPhase?: BundledExtensionLoadPhase;
};

/** Stable `/mode` section order (independent of manifest row order). */
export const BUNDLED_EXTENSION_GROUP_ORDER = [
  "Harness",
  "Agent tools",
  "Context & performance",
  "Integrations",
  "Workflow",
  "Output",
  "Experiments",
] as const;

export type BundledExtensionGroupLabel = (typeof BUNDLED_EXTENSION_GROUP_ORDER)[number];

/**
 * Single registry for bundled Pi extensions.
 * Adding an extension: one row here with its default, `package.json` dep, and README.
 */
export const BUNDLED_EXTENSION_DEFINITIONS = [
  {
    id: "skill-registry",
    packageName: "gentle-pi",
    module: "gentle-pi/extensions/skill-registry.ts",
    group: "Harness",
    defaultEnabled: true,
  },
  {
    id: "sdd-init",
    packageName: "gentle-pi",
    module: "gentle-pi/extensions/sdd-init.ts",
    group: "Harness",
    defaultEnabled: true,
  },
  {
    id: "gentle-ai",
    packageName: "gentle-pi",
    module: "gentle-pi/extensions/gentle-ai.ts",
    group: "Harness",
    defaultEnabled: true,
  },
  {
    id: "context-mode",
    packageName: "context-mode",
    module: "context-mode/build/adapters/pi/extension.js",
    group: "Context & performance",
    defaultEnabled: true,
    loadPhase: "context-stack",
  },
  {
    id: "context-view",
    packageName: "pi-context-view",
    module: "pi-context-view/src/index.ts",
    group: "Context & performance",
  },
  {
    id: "vcc",
    packageName: "@sting8k/pi-vcc",
    module: "@sting8k/pi-vcc/index.ts",
    group: "Context & performance",
  },
  {
    id: "ask-user",
    packageName: "@juicesharp/rpiv-ask-user-question",
    module: "@juicesharp/rpiv-ask-user-question/index.ts",
    group: "Agent tools",
    defaultEnabled: true,
  },
  {
    id: "todo",
    packageName: "@juicesharp/rpiv-todo",
    module: "@juicesharp/rpiv-todo/index.ts",
    group: "Agent tools",
    defaultEnabled: true,
  },
  {
    id: "graphify",
    packageName: "graphify-pi",
    module: "graphify-pi/extensions/graphify.ts",
    group: "Agent tools",
    defaultEnabled: true,
  },
  {
    id: "shazam",
    packageName: "pi-shazam",
    module: "pi-shazam/dist/index.js",
    group: "Agent tools",
  },
  {
    id: "prompt-template-model",
    packageName: "pi-prompt-template-model",
    module: "pi-prompt-template-model/index.ts",
    group: "Agent tools",
  },
  {
    id: "subagents",
    packageName: "pi-subagents-j0k3r",
    module: "pi-subagents-j0k3r/index.ts",
    group: "Agent tools",
    defaultEnabled: true,
  },
  {
    id: "herdr-squad",
    packageName: "pi-herdr-squad",
    module: "pi-herdr-squad/index.ts",
    group: "Agent tools",
  },
  {
    id: "lens",
    packageName: "pi-lens",
    module: "pi-lens/dist/index.js",
    group: "Agent tools",
    defaultEnabled: true,
  },
  {
    id: "goal",
    packageName: "pi-goal",
    module: "pi-goal/.pi/extensions/pi-goal/index.ts",
    group: "Integrations",
  },
  {
    id: "docparser",
    packageName: "pi-docparser",
    module: "pi-docparser/extensions/docparser/index.ts",
    group: "Integrations",
    defaultEnabled: true,
  },
  {
    id: "obsidian",
    packageName: "@haispeed/pi-obsidian",
    module: "@haispeed/pi-obsidian/extensions/obsidian-cli.ts",
    group: "Integrations",
    defaultEnabled: true,
  },
  {
    id: "btw",
    packageName: "pi-btw",
    module: "pi-btw/extensions/btw.ts",
    group: "Integrations",
    defaultEnabled: true,
  },
  {
    id: "intercom",
    packageName: "pi-intercom",
    module: "pi-intercom/index.ts",
    group: "Integrations",
    defaultEnabled: true,
  },
  {
    id: "simplify",
    packageName: "pi-simplify",
    module: "pi-simplify/dist/index.js",
    group: "Context & performance",
    defaultEnabled: true,
  },
  {
    id: "rtk-optimizer",
    packageName: "pi-rtk-optimizer",
    module: "pi-rtk-optimizer/index.ts",
    group: "Context & performance",
    loadPhase: "context-stack",
  },
  {
    id: "observational-memory",
    packageName: "pi-observational-memory",
    module: "pi-observational-memory/src/index.ts",
    group: "Context & performance",
  },
  {
    id: "engram",
    packageName: "gentle-engram",
    module: "gentle-engram/index.ts",
    group: "Context & performance",
    defaultEnabled: true,
  },
  {
    id: "mcp-adapter",
    packageName: "pi-mcp-adapter",
    module: "pi-mcp-adapter/index.ts",
    group: "Integrations",
    defaultEnabled: true,
  },
  {
    id: "planning-with-files",
    packageName: "@tomxprime/planning-with-files",
    module: "@tomxprime/planning-with-files/extensions/planning-with-files/index.ts",
    group: "Workflow",
  },
  {
    id: "plannotator",
    packageName: "@plannotator/pi-extension",
    module: "@plannotator/pi-extension/index.ts",
    group: "Workflow",
  },
  {
    id: "caveman",
    packageName: "pi-caveman",
    module: "pi-caveman/extensions/caveman.ts",
    group: "Output",
    defaultEnabled: true,
  },
  {
    id: "ponytail",
    packageName: "@dietrichgebert/ponytail",
    module: "@dietrichgebert/ponytail/pi-extension/index.js",
    group: "Output",
    defaultEnabled: true,
  },
  {
    id: "red-green",
    packageName: "pi-red-green",
    module: "pi-red-green/dist/index.js",
    group: "Workflow",
  },
  {
    id: "autoresearch",
    packageName: "pi-autoresearch",
    module: "pi-autoresearch/extensions/pi-autoresearch/index.ts",
    group: "Experiments",
  },
  {
    id: "web-access",
    packageName: "pi-web-access",
    module: "pi-web-access/index.ts",
    group: "Agent tools",
    defaultEnabled: true,
  },
  {
    id: "fff",
    packageName: "@ff-labs/pi-fff",
    module: "@ff-labs/pi-fff/src/index.ts",
    group: "Agent tools",
  },
  {
    id: "kanagawa",
    packageName: "pi-kanagawa",
    module: "hotmilk/src/bundled/kanagawa.ts",
    group: "Output",
  },
] as const satisfies readonly BundledExtensionDefinition[];

export type BundledExtensionId = (typeof BUNDLED_EXTENSION_DEFINITIONS)[number]["id"];

export const BUNDLED_EXTENSION_IDS: BundledExtensionId[] = BUNDLED_EXTENSION_DEFINITIONS.map(
  (definition) => definition.id,
);

/** Complete on/off map for every bundled extension id. */
export type ExtensionToggleMap = { [K in BundledExtensionId]: boolean };

export const CONTEXT_STACK_EXTENSION_IDS = BUNDLED_EXTENSION_DEFINITIONS.filter(
  (definition) => "loadPhase" in definition && definition.loadPhase === "context-stack",
).map((definition) => definition.id);

export type BundledExtensionGroup = {
  label: BundledExtensionGroupLabel;
  ids: BundledExtensionId[];
};

function buildBundledExtensionGroups(): BundledExtensionGroup[] {
  return BUNDLED_EXTENSION_GROUP_ORDER.map((label) => ({
    label,
    ids: BUNDLED_EXTENSION_DEFINITIONS.filter((definition) => definition.group === label).map(
      (definition) => definition.id,
    ),
  }));
}

export const BUNDLED_EXTENSION_GROUPS = buildBundledExtensionGroups();
