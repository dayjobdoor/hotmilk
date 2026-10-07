type BundledExtensionLoadPhase = "context-stack" | "parallel";

type BundledExtensionDefinition = {
  readonly id: string;
  /** npm package name that provides a bundled extension when installed via Pi settings. */
  readonly packageName: string;
  /** Path passed to `loadBundled()` / `bundledImportUrl()`. */
  readonly module: string;
  /** `/mode` section label — must appear in {@link BUNDLED_EXTENSION_GROUP_ORDER}. */
  readonly group: BundledExtensionGroupLabel;
  readonly defaultEnabled?: boolean;
  /** Loads under omp (verified by `bun run audit:omp`); unflagged rows are pi only. */
  readonly omp?: boolean;
  readonly loadPhase?: BundledExtensionLoadPhase;
};

/** Stable `/mode` section order (independent of manifest row order). */
const BUNDLED_EXTENSION_GROUP_ORDER = [
  "Harness",
  "Agent tools",
  "Context & performance",
  "Integrations",
  "Workflow",
  "Output",
  "Experiments",
] as const;

type BundledExtensionGroupLabel = (typeof BUNDLED_EXTENSION_GROUP_ORDER)[number];

/**
 * Single registry for bundled Pi extensions.
 * Adding an extension: one row here, `package.json` dep, and README; the full
 * checklist is docs/bundles.md#adding-a-row.
 * Every row defaults off (0.2.0 minimal core); set `defaultEnabled: true` only
 * for a row that belongs to the default-on core.
 */
export const BUNDLED_EXTENSION_DEFINITIONS = [
  {
    id: "skill-registry",
    packageName: "gentle-pi",
    module: "gentle-pi/extensions/skill-registry.ts",
    group: "Harness",
    omp: true,
  },
  {
    id: "gentle-ai",
    packageName: "gentle-pi",
    module: "gentle-pi/extensions/gentle-ai.ts",
    group: "Harness",
  },
  {
    id: "context-mode",
    packageName: "context-mode",
    module: "context-mode/build/adapters/pi/extension.js",
    group: "Context & performance",
    omp: true,
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
    omp: true,
  },
  {
    id: "ask-user",
    packageName: "@juicesharp/rpiv-ask-user-question",
    module: "@juicesharp/rpiv-ask-user-question/index.ts",
    group: "Agent tools",
    omp: true,
  },
  {
    id: "todo",
    packageName: "@juicesharp/rpiv-todo",
    module: "@juicesharp/rpiv-todo/index.ts",
    group: "Agent tools",
    omp: true,
  },
  {
    id: "graphify",
    packageName: "@runecraft/graphify-pi",
    module: "@runecraft/graphify-pi/extensions/index.ts",
    group: "Agent tools",
    omp: true,
  },
  {
    id: "shazam",
    packageName: "pi-shazam",
    module: "pi-shazam/dist/index.js",
    group: "Agent tools",
    omp: true,
  },
  {
    id: "prompt-template-model",
    packageName: "pi-prompt-template-model",
    module: "pi-prompt-template-model/index.ts",
    group: "Agent tools",
    omp: true,
  },
  {
    id: "subagents",
    packageName: "gentle-pi",
    module: "gentle-pi/extensions/gentle-agents.ts",
    group: "Agent tools",
  },
  {
    id: "lens",
    packageName: "pi-lens",
    module: "pi-lens/dist/index.js",
    group: "Agent tools",
    omp: true,
  },
  {
    id: "goal",
    packageName: "pi-goal-x",
    module: "pi-goal-x/extensions/goal.ts",
    group: "Integrations",
    omp: true,
  },
  {
    id: "docparser",
    packageName: "pi-docparser",
    module: "pi-docparser/extensions/docparser/index.ts",
    group: "Integrations",
    omp: true,
  },
  {
    id: "btw",
    packageName: "pi-btw",
    module: "pi-btw/extensions/btw.ts",
    group: "Integrations",
  },
  {
    id: "intercom",
    packageName: "pi-intercom",
    module: "pi-intercom/index.ts",
    group: "Integrations",
    omp: true,
  },
  {
    id: "simplify",
    packageName: "pi-simplify",
    module: "pi-simplify/dist/index.js",
    group: "Context & performance",
    omp: true,
  },
  {
    id: "rtk-optimizer",
    packageName: "pi-rtk-optimizer",
    module: "pi-rtk-optimizer/index.ts",
    group: "Context & performance",
    omp: true,
    loadPhase: "context-stack",
  },
  {
    id: "observational-memory",
    packageName: "pi-observational-memory",
    module: "pi-observational-memory/src/index.ts",
    group: "Context & performance",
    omp: true,
  },
  {
    id: "engram",
    packageName: "gentle-engram",
    module: "gentle-engram/index.ts",
    group: "Context & performance",
    omp: true,
  },
  {
    id: "planning-with-files",
    packageName: "@tomxprime/planning-with-files",
    module: "@tomxprime/planning-with-files/extensions/planning-with-files/index.ts",
    group: "Workflow",
    omp: true,
  },
  {
    id: "plannotator",
    packageName: "@plannotator/pi-extension",
    module: "@plannotator/pi-extension/index.ts",
    group: "Workflow",
    omp: true,
  },
  {
    id: "caveman",
    packageName: "pi-caveman",
    module: "pi-caveman/extensions/caveman.ts",
    group: "Output",
    omp: true,
  },
  {
    id: "ponytail",
    packageName: "@dietrichgebert/ponytail",
    module: "@dietrichgebert/ponytail/pi-extension/index.js",
    group: "Output",
    omp: true,
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
    omp: true,
  },
  {
    id: "fff",
    packageName: "@ff-labs/pi-fff",
    module: "@ff-labs/pi-fff/src/index.ts",
    group: "Agent tools",
    omp: true,
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

/**
 * Rows that were on by default before 0.2.0 flipped every row off. A saved `hotmilk.json`
 * with no explicit value for one of these silently lost it; session start tells the user once.
 */
export const PRE_0_2_DEFAULT_ON_IDS: readonly BundledExtensionId[] = [
  "skill-registry",
  "gentle-ai",
  "context-mode",
  "ask-user",
  "todo",
  "graphify",
  "subagents",
  "lens",
  "docparser",
  "btw",
  "intercom",
  "simplify",
  "engram",
  "caveman",
  "ponytail",
  "web-access",
];

/** Complete on/off map for every bundled extension id. */
export type ExtensionToggleMap = { [K in BundledExtensionId]: boolean };

export const CONTEXT_STACK_EXTENSION_IDS = BUNDLED_EXTENSION_DEFINITIONS.filter(
  (definition) => "loadPhase" in definition && definition.loadPhase === "context-stack",
).map((definition) => definition.id);

type BundledExtensionGroup = {
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

/** Ids flagged `omp: true`: the only rows hotmilk loads under omp. */
export const OMP_SUPPORTED_IDS: readonly BundledExtensionId[] = BUNDLED_EXTENSION_DEFINITIONS.filter(
  (definition) => "omp" in definition && definition.omp === true,
).map((definition) => definition.id);

/**
 * omp release the `omp` flags were verified against (`bun run audit:omp`).
 * CI installs exactly this release; other omp versions get a session warning.
 */
export const OMP_AUDITED_VERSION = "18.4.10";

/**
 * sha256 of that release's `omp-linux-x64` asset, committed here so CI checks the binary against
 * a reviewed value instead of a checksum file served by the same release it would vouch for.
 */
export const OMP_AUDITED_SHA256 = "e3f24c475d90b83acec05a26fd4499d2e6dffbf4ca3b0ee9e3e1bc1ab1a4e289";
