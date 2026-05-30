import { defineConfig } from "vite-plus";

const ignorePatterns = ["node_modules", "dist", "graphify-out"];

export default defineConfig({
  lint: {
    ignorePatterns,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: { ignorePatterns },
  test: {
    include: ["test/**/*.test.ts"],
    includeSource: ["src/**/*.ts"],
  },
});
