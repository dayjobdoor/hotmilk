/**
 * hotmilk — Pi meta-package entry: one extension, bundled deps load on toggle.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHotmilkRuntime } from "./config/runtime.ts";
import { registerDefaultsHandlers } from "./bootstrap/defaults.ts";
import { registerBundledExtensions } from "./bootstrap/extensions.ts";
import { prepareContextStack } from "./bootstrap/context-stack.ts";
import { registerGraphHandlers } from "./bootstrap/graph.ts";
import { registerSessionHandlers } from "./bootstrap/session.ts";
import { registerInputCommands } from "./controller/input.ts";
import { installHotmilkCtxSearchCapture } from "./bootstrap/btw.ts";
import { registerProjectTrustHandlers } from "./bootstrap/project-trust.ts";
import { prepareAutoresearchShortcuts } from "./bootstrap/autoresearch.ts";
import { registerSubagentsDoctorCommand } from "./bootstrap/subagents-doctor.ts";

/** Main Pi extension entry point: register all hotmilk handlers and bundled extensions. */
export default async function registerHotmilk(pi: ExtensionAPI): Promise<void> {
  const runtime = createHotmilkRuntime();

  registerProjectTrustHandlers(pi, runtime.projectTrust);

  if (runtime.extensionToggles.btw && runtime.extensionToggles["context-mode"]) {
    installHotmilkCtxSearchCapture(pi);
  }

  prepareContextStack(runtime.extensionToggles);
  prepareAutoresearchShortcuts(runtime.extensionToggles.autoresearch);

  const bundled = await registerBundledExtensions(pi, runtime.extensionToggles, {
    cwd: process.cwd(),
    includeProjectSettings: false,
  });
  if (runtime.extensionToggles.subagents === true) {
    await registerSubagentsDoctorCommand(pi);
  }
  runtime.globalExtensionSkips = bundled.globalSkips;
  registerGraphHandlers(pi, runtime.graph);
  registerDefaultsHandlers(pi, runtime.defaults);
  registerSessionHandlers(pi, runtime);
  registerInputCommands(pi);
}
