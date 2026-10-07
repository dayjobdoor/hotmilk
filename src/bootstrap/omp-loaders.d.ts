import type { BundledExtensionId } from "../config/bundled-extensions.ts";
import type { ExtensionModule } from "./extension-module.ts";

/** Literal-specifier loaders used under omp; see `omp-loaders.js` (same entry modules as the Pi loader). */
export declare const OMP_BUNDLED_LOADERS: Partial<
  Record<BundledExtensionId, () => Promise<ExtensionModule>>
>;
