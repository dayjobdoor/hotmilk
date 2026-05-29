import { BUNDLED_EXTENSION_IDS, type BundledExtensionId } from "./hotmilk.ts";

export type BundledExtensionGroup = {
  label: string;
  ids: BundledExtensionId[];
};

/** UI grouping for /mode — must cover every {@link BUNDLED_EXTENSION_IDS} entry. */
export const BUNDLED_EXTENSION_GROUPS: BundledExtensionGroup[] = [
  { label: "Harness", ids: ["skill-registry", "sdd-init", "gentle-ai"] },
  {
    label: "Agent tools",
    ids: [
      "context-mode",
      "ask-user",
      "graphify",
      "subagents",
      "agent-dashboard",
      "web-access",
      "pi-flows",
    ],
  },
  {
    label: "Integrations",
    ids: ["goal", "docparser", "obsidian", "cursor-provider", "btw", "mcp-adapter"],
  },
  { label: "Performance", ids: ["simplify", "rtk-optimizer"] },
  { label: "Workflow", ids: ["planning-with-files", "red-green"] },
  { label: "Output", ids: ["caveman"] },
];

const groupedIds = new Set(BUNDLED_EXTENSION_GROUPS.flatMap((group) => group.ids));
for (const id of BUNDLED_EXTENSION_IDS) {
  if (!groupedIds.has(id)) {
    throw new Error(`BUNDLED_EXTENSION_GROUPS is missing extension id: ${id}`);
  }
}
