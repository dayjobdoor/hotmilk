/** npm package name(s) that provide a bundled extension when installed via Pi settings. */
export type BundledPackageSpec = {
  /** Primary npm package for `npm:<name>` entries and bundled loader resolution. */
  packageName: string;
  /** Extra package names that satisfy the same bundled id (e.g. dashboard bridge shim). */
  aliases?: readonly string[];
};

export type BundledExtensionLoadPhase = "context-stack" | "parallel";

export type BundledExtensionDefinition = {
  readonly id: string;
  readonly package: BundledPackageSpec;
  /** Path passed to `loadBundled()` / `bundledImportUrl()`. */
  readonly module: string;
  /** `/mode` section label — must appear in {@link BUNDLED_EXTENSION_GROUP_ORDER}. */
  readonly group: string;
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
 * Adding an extension: one row here + `hotmilk.json` default + `package.json` dep + README.
 */
export const BUNDLED_EXTENSION_DEFINITIONS = [
  {
    id: "skill-registry",
    package: { packageName: "gentle-pi" },
    module: "gentle-pi/extensions/skill-registry.ts",
    group: "Harness",
  },
  {
    id: "sdd-init",
    package: { packageName: "gentle-pi" },
    module: "gentle-pi/extensions/sdd-init.ts",
    group: "Harness",
  },
  {
    id: "gentle-ai",
    package: { packageName: "gentle-pi" },
    module: "gentle-pi/extensions/gentle-ai.ts",
    group: "Harness",
  },
  {
    id: "context-mode",
    package: { packageName: "context-mode" },
    module: "context-mode/build/adapters/pi/extension.js",
    group: "Context & performance",
    loadPhase: "context-stack",
  },
  {
    id: "ask-user",
    package: { packageName: "pi-ask-user" },
    module: "pi-ask-user/index.ts",
    group: "Agent tools",
  },
  {
    id: "graphify",
    package: { packageName: "graphify-pi" },
    module: "graphify-pi/extensions/graphify.ts",
    group: "Agent tools",
  },
  {
    id: "subagents",
    package: { packageName: "pi-subagents" },
    module: "pi-subagents/src/extension/index.ts",
    group: "Agent tools",
  },
  {
    id: "goal",
    package: { packageName: "pi-goal" },
    module: "pi-goal/.pi/extensions/pi-goal/index.ts",
    group: "Integrations",
  },
  {
    id: "docparser",
    package: { packageName: "pi-docparser" },
    module: "pi-docparser/extensions/docparser/index.ts",
    group: "Integrations",
  },
  {
    id: "obsidian",
    package: { packageName: "@haispeed/pi-obsidian" },
    module: "@haispeed/pi-obsidian/extensions/obsidian-cli.ts",
    group: "Integrations",
  },
  {
    id: "btw",
    package: { packageName: "pi-btw" },
    module: "hotmilk/src/extensions/btw.ts",
    group: "Integrations",
  },
  {
    id: "simplify",
    package: { packageName: "pi-simplify" },
    module: "pi-simplify/dist/index.js",
    group: "Context & performance",
  },
  {
    id: "rtk-optimizer",
    package: { packageName: "pi-rtk-optimizer" },
    module: "pi-rtk-optimizer/index.ts",
    group: "Context & performance",
    loadPhase: "context-stack",
  },
  {
    id: "mcp-adapter",
    package: { packageName: "pi-mcp-adapter" },
    module: "pi-mcp-adapter/index.ts",
    group: "Integrations",
  },
  {
    id: "planning-with-files",
    package: { packageName: "@tomxprime/planning-with-files" },
    module: "@tomxprime/planning-with-files/extensions/planning-with-files/index.ts",
    group: "Workflow",
  },
  {
    id: "caveman",
    package: { packageName: "pi-caveman" },
    module: "pi-caveman/extensions/caveman.ts",
    group: "Output",
  },
  {
    id: "red-green",
    package: { packageName: "pi-red-green" },
    module: "pi-red-green/dist/index.js",
    group: "Workflow",
  },
  {
    id: "agent-dashboard",
    package: {
      packageName: "@blackbelt-technology/pi-agent-dashboard",
      aliases: ["@blackbelt-technology/pi-dashboard-extension"],
    },
    module: "@blackbelt-technology/pi-agent-dashboard/packages/extension/src/bridge.ts",
    group: "Agent tools",
  },
  {
    id: "web-access",
    package: { packageName: "pi-web-access" },
    module: "pi-web-access/index.ts",
    group: "Agent tools",
  },
  {
    id: "pi-flows",
    package: { packageName: "@blackbelt-technology/pi-flows" },
    module: "@blackbelt-technology/pi-flows/extensions/index.ts",
    group: "Agent tools",
  },
  {
    id: "kanagawa",
    package: { packageName: "pi-kanagawa" },
    module: "pi-kanagawa/index.ts",
    group: "Output",
  },
  {
    id: "tetris",
    package: { packageName: "pi-tetris" },
    module: "pi-tetris/extensions/pi-tetris.ts",
    group: "Experiments",
  },
] as const satisfies readonly BundledExtensionDefinition[];

export type BundledExtensionId = (typeof BUNDLED_EXTENSION_DEFINITIONS)[number]["id"];

export const BUNDLED_EXTENSION_IDS: BundledExtensionId[] = BUNDLED_EXTENSION_DEFINITIONS.map(
  (definition) => definition.id,
);

export const BUNDLED_EXTENSION_PACKAGES: Record<BundledExtensionId, BundledPackageSpec> =
  Object.fromEntries(
    BUNDLED_EXTENSION_DEFINITIONS.map((definition) => [definition.id, definition.package]),
  ) as Record<BundledExtensionId, BundledPackageSpec>;

export const CONTEXT_STACK_EXTENSION_IDS = BUNDLED_EXTENSION_DEFINITIONS.filter(
  (definition) => "loadPhase" in definition && definition.loadPhase === "context-stack",
).map((definition) => definition.id);

export type BundledExtensionGroup = {
  label: BundledExtensionGroupLabel;
  ids: BundledExtensionId[];
};

export function buildBundledExtensionGroups(): BundledExtensionGroup[] {
  const idsByGroup = new Map<BundledExtensionGroupLabel, BundledExtensionId[]>();
  for (const label of BUNDLED_EXTENSION_GROUP_ORDER) {
    idsByGroup.set(label, []);
  }

  for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
    const group = definition.group as BundledExtensionGroupLabel;
    if (!idsByGroup.has(group)) {
      throw new Error(
        `Bundled extension ${definition.id} uses unknown group "${definition.group}" — add it to BUNDLED_EXTENSION_GROUP_ORDER`,
      );
    }
    idsByGroup.get(group)!.push(definition.id);
  }

  return BUNDLED_EXTENSION_GROUP_ORDER.map((label) => ({
    label,
    ids: idsByGroup.get(label)!,
  }));
}

export const BUNDLED_EXTENSION_GROUPS = buildBundledExtensionGroups();

const groupedIds = new Set(BUNDLED_EXTENSION_GROUPS.flatMap((group) => group.ids));
for (const id of BUNDLED_EXTENSION_IDS) {
  if (!groupedIds.has(id)) {
    throw new Error(`BUNDLED_EXTENSION_GROUPS is missing extension id: ${id}`);
  }
}

const seenIds = new Set<string>();
for (const definition of BUNDLED_EXTENSION_DEFINITIONS) {
  if (seenIds.has(definition.id)) {
    throw new Error(`Duplicate bundled extension id: ${definition.id}`);
  }
  seenIds.add(definition.id);
}
