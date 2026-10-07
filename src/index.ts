/**
 * hotmilk — Pi meta-package entry: one extension, bundled deps load on toggle.
 */

import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { shouldYieldToProjectEntry } from "./bootstrap/global-extension-sources.ts";
import { createHotmilkRuntime } from "./config/runtime.ts";
import { registerDefaultsHandlers } from "./bootstrap/defaults.ts";
import { registerBundledExtensions } from "./bootstrap/extensions.ts";
import { prepareContextStack } from "./bootstrap/context-stack.ts";
import { registerGraphHandlers } from "./bootstrap/graph.ts";
import { registerSessionHandlers } from "./bootstrap/session.ts";
import { registerInputCommands } from "./controller/input.ts";
import { registerProjectTrustHandlers } from "./bootstrap/project-trust.ts";
import { prepareAutoresearchShortcuts } from "./bootstrap/autoresearch.ts";

/** Options for the entry; tests inject selfPath/cwd, Pi calls with defaults. */
type RegisterHotmilkOptions = {
  /** Absolute path of this entry module (defaults to this module's location). */
  selfPath?: string;
  /** Session cwd (defaults to process.cwd()). */
  cwd?: string;
};

/** Main Pi extension entry point: register all hotmilk handlers and bundled extensions. */
export default async function registerHotmilk(
  pi: ExtensionAPI,
  options: RegisterHotmilkOptions = {},
): Promise<void> {
  // Pi runs global-package extensions in the pre-trust pass and project
  // packages after trust. When cwd is hotmilk itself (in-repo dev), the
  // npm-installed copy yields so the project copy owns registration
  // (project → user precedence, same as Pi's package resolution).
  const selfPath = options.selfPath ?? fileURLToPath(import.meta.url);
  if (shouldYieldToProjectEntry(selfPath, options.cwd ?? process.cwd())) {
    return;
  }

  const runtime = createHotmilkRuntime();

  registerProjectTrustHandlers(pi, runtime.projectTrust);

  runtime.rtkSync = prepareContextStack(runtime.extensionToggles);
  prepareAutoresearchShortcuts(runtime.extensionToggles.autoresearch);

  const registration = await registerBundledExtensions(pi, runtime.extensionToggles, {
    harness: runtime.harness,
  });
  runtime.globalExtensionSkips = registration.globalSkips;
  runtime.extensionFailures = registration.failures;
  registerGraphHandlers(pi, runtime.graph);
  registerDefaultsHandlers(pi, runtime.defaults);
  registerSessionHandlers(pi, runtime);
  registerInputCommands(pi);
}