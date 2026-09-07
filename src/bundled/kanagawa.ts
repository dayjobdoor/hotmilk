import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { bundledImportUrl } from "../bootstrap/resolve-bundled.ts";

type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;
type ExtensionModule = { default: ExtensionFactory };

function loadKanagawaFactory(): Promise<ExtensionModule> {
  return import(bundledImportUrl("pi-kanagawa/index.ts"));
}

function registerCommandWithoutThinking(
  registerCommand: ExtensionAPI["registerCommand"],
): ExtensionAPI["registerCommand"] {
  return (name, spec) => {
    if (name === "thinking") {
      return;
    }
    return registerCommand(name, spec);
  };
}

/**
 * Run a bundled extension while skipping duplicate `/thinking` command registration.
 *
 * Pi ships a built-in interactive `/thinking` command; pi-kanagawa still registers
 * its own legacy handler, which triggers extension startup warnings.
 */
export async function registerBundledExtensionWithoutThinkingCommand(
  pi: ExtensionAPI,
  register: ExtensionFactory,
): Promise<void> {
  const originalRegisterCommand = pi.registerCommand.bind(pi);
  pi.registerCommand = registerCommandWithoutThinking(originalRegisterCommand);

  try {
    await register(pi);
  } finally {
    pi.registerCommand = originalRegisterCommand;
  }
}

/** hotmilk wrapper around pi-kanagawa that keeps theme/footer widgets without `/thinking`. */
export default async function registerHotmilkKanagawa(pi: ExtensionAPI): Promise<void> {
  const kanagawaModule = await loadKanagawaFactory();
  await registerBundledExtensionWithoutThinkingCommand(pi, kanagawaModule.default);
}
