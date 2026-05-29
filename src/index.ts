/**
 * hotmilk — Pi meta-package entry: one extension, bundled deps load on toggle.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHotmilkRuntime } from "./config/runtime.ts";
import { registerDefaultsHandlers } from "./bootstrap/defaults.ts";
import { registerBundledExtensions } from "./bootstrap/extensions.ts";
import { registerGraphHandlers } from "./bootstrap/graph.ts";
import { registerSessionHandlers } from "./bootstrap/session.ts";
import { registerInputCommands, routeInputCommand } from "./controller/input.ts";

export default async function registerHotmilk(pi: ExtensionAPI): Promise<void> {
  const runtime = createHotmilkRuntime();

  if (runtime.extensionToggles["agent-dashboard"]) {
    const { scheduleDashboardWarmStart } = await import("./bootstrap/dashboard.ts");
    scheduleDashboardWarmStart();
  }

  await registerBundledExtensions(pi, runtime.extensionToggles);
  registerGraphHandlers(pi, runtime.graph);
  registerDefaultsHandlers(pi, runtime.defaults);
  registerSessionHandlers(pi, runtime);
  registerInputCommands(pi);
  pi.on("input", (event, ctx) => routeInputCommand(event.text, pi, ctx));
}
