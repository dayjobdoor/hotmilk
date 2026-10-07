/**
 * Literal-specifier loaders for bundled rows under omp.
 *
 * omp rewrites Pi imports (`@earendil-works/*`, `typebox`) only inside an
 * extension's statically analyzed module graph; its compiled Bun cannot resolve
 * runtime `node_modules` elsewhere. The Pi loader imports computed `file://`
 * URLs, which omp's analyzer cannot follow, so under omp hotmilk imports each
 * bundle through a literal specifier listed here instead. Rows missing here
 * (their pi entry is not an exported subpath: context-mode, ponytail) fall back
 * to the Pi loader. Entries for rows without the `omp` flag exist so
 * `bun run audit:omp` can load them ungated and re-test them.
 *
 * Every specifier MUST resolve to the row's registry `module`:
 * `test/omp-loaders.test.ts` checks the table, and `bun run audit:omp` loads
 * each row through it and fails on a wrong path.
 *
 * Plain JS on purpose: TypeScript would type-check every bundled package
 * graph through these literals. Types live in `omp-loaders.d.ts`.
 */
export const OMP_BUNDLED_LOADERS = {
  "skill-registry": () => import("gentle-pi/extensions/skill-registry.ts"),
  "gentle-ai": () => import("gentle-pi/extensions/gentle-ai.ts"),
  "context-view": () => import("pi-context-view/src/index.ts"),
  vcc: () => import("@sting8k/pi-vcc/index.ts"),
  "ask-user": () => import("@juicesharp/rpiv-ask-user-question"),
  todo: () => import("@juicesharp/rpiv-todo/index.ts"),
  graphify: () => import("@runecraft/graphify-pi/extensions/index.ts"),
  shazam: () => import("pi-shazam/dist/index.js"),
  "prompt-template-model": () => import("pi-prompt-template-model/index.ts"),
  subagents: () => import("gentle-pi/extensions/gentle-agents.ts"),
  lens: () => import("pi-lens/dist/index.js"),
  goal: () => import("pi-goal-x/extensions/goal.ts"),
  docparser: () => import("pi-docparser/extensions/docparser/index.ts"),
  btw: () => import("pi-btw/extensions/btw.ts"),
  intercom: () => import("pi-intercom/index.ts"),
  simplify: () => import("pi-simplify/dist/index.js"),
  "rtk-optimizer": () => import("pi-rtk-optimizer"),
  "observational-memory": () => import("pi-observational-memory/src/index.ts"),
  engram: () => import("gentle-engram/index.ts"),
  "planning-with-files": () =>
    import("@tomxprime/planning-with-files/extensions/planning-with-files/index.ts"),
  plannotator: () => import("@plannotator/pi-extension/index.ts"),
  caveman: () => import("pi-caveman/extensions/caveman.ts"),
  autoresearch: () => import("pi-autoresearch/extensions/pi-autoresearch/index.ts"),
  "web-access": () => import("pi-web-access/index.ts"),
  fff: () => import("@ff-labs/pi-fff/src/index.ts"),
  kanagawa: () => import("../bundled/kanagawa.ts"),
};
