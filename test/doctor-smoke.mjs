import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const jiti = require("jiti")(path.join(root, "test/doctor-smoke.mjs"));

const { buildDoctorReport } = jiti("../node_modules/pi-subagents/src/extension/doctor.ts");

const report = buildDoctorReport({
  cwd: root,
  config: { intercomBridge: { mode: "always" } },
  state: {
    baseCwd: root,
    currentSessionId: "test",
    asyncJobs: new Map(),
    foregroundRuns: new Map(),
    foregroundControls: new Map(),
    lastForegroundControlId: null,
    pendingForegroundControlNotices: new Map(),
    cleanupTimers: new Map(),
    lastUiContext: null,
    poller: null,
    completionSeen: new Map(),
    watcher: null,
    watcherRestartTimer: null,
    resultFileCoalescer: { schedule: () => false, clear: () => {} },
  },
});

console.log(report);
