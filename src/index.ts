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
import { registerInputCommands, routeInputCommand } from "./controller/input.ts";
import { registerHotmilkSessionLogo } from "./ui/session-logo.ts";
import { installHotmilkCtxSearchCapture } from "./bootstrap/btw.ts";
import { registerProjectTrustHandlers } from "./bootstrap/project-trust.ts";
import { registerSubagentsDoctorCommand } from "./bootstrap/subagents-doctor.ts";

/** Main Pi extension entry point: register all hotmilk handlers and bundled extensions. */
export default async function registerHotmilk(pi: ExtensionAPI): Promise<void> {
  const runtime = createHotmilkRuntime();

  registerProjectTrustHandlers(pi, runtime.projectTrust);

  // Register before bundled imports so session_start handlers exist when bindExtensions emits.
  registerHotmilkSessionLogo(pi);
  installHotmilkCtxSearchCapture(pi);

  prepareContextStack(runtime.extensionToggles);

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
  pi.on("input", (event, ctx) => routeInputCommand(event.text, pi, ctx));
}
