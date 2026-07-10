/**
 * GitHub user / repo-owner resolution for the footer.
 *
 * Reads `$GITHUB_USER`, `gh api user`, git config, and the `origin` remote
 * to show `@handle` and highlight repo ownership in the status bar.
 */

import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const COMMAND_TIMEOUT_MS = 2_000;
const execFileAsync = promisify(execFile);

function normalizeCommandOutput(output: string): string | undefined {
  const trimmed = output.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function githubUserFromEnv(env: NodeJS.ProcessEnv): string | undefined {
  return env.GITHUB_USER?.trim() || env.GH_USER?.trim() || undefined;
}

function githubUsernameCommands(
  cwd: string,
): Array<{ file: string; args: string[]; cwd?: string }> {
  return [
    { file: "gh", args: ["api", "user", "-q", ".login"] },
    { file: "git", args: ["config", "--global", "github.user"] },
    { file: "git", args: ["config", "github.user"], cwd },
  ];
}

function runCommand(file: string, args: string[], cwd?: string): string | undefined {
  try {
    const output = execFileSync(file, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: COMMAND_TIMEOUT_MS,
    });
    return normalizeCommandOutput(output);
  } catch {
    return undefined;
  }
}

async function runCommandAsync(
  file: string,
  args: string[],
  cwd?: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(file, args, {
      cwd,
      encoding: "utf8",
      timeout: COMMAND_TIMEOUT_MS,
    });
    return normalizeCommandOutput(stdout);
  } catch {
    return undefined;
  }
}

const GITHUB_REMOTE_OWNER =
  /^(?:git@github\.com:|https?:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([^/]+)\//;

/**
 * Parse the owner/user from common github.com remote URL shapes.
 *
 * @param url - remote URL like `https://github.com/owner/repo.git`
 * @returns the owner string, or undefined if not a GitHub remote
 */
export function parseGithubUserFromRemote(url: string): string | undefined {
  return GITHUB_REMOTE_OWNER.exec(url.trim())?.[1];
}

/**
 * Append the GitHub handle to the prompt path segment.
 *
 * @param pwd - current working directory string
 * @param githubUser - resolved GitHub handle
 * @returns footer path text
 */
export function formatFooterPwdWithGithubUser(pwd: string, githubUser: string | undefined): string {
  if (!githubUser) {
    return pwd;
  }
  return `${pwd} · @${githubUser}`;
}

/**
 * Check whether the GitHub user owns the current repo.
 *
 * @param githubUser - resolved GitHub handle
 * @param repoOwner - owner parsed from `origin`
 */
export function isGithubRepoOwner(githubUser: string, repoOwner: string | undefined): boolean {
  return repoOwner !== undefined && githubUser.toLowerCase() === repoOwner.toLowerCase();
}

/** Options for {@link resolveRepoOwner}. */
export type ResolveRepoOwnerOptions = {
  cwd?: string;
  /** Override command executor for tests. */
  runCommand?: (file: string, args: string[], cwd?: string) => string | undefined;
};

/**
 * Resolve the GitHub repo owner from the `origin` remote.
 *
 * @param opts - options, including optional command executor for tests
 */
export function resolveRepoOwner(opts: ResolveRepoOwnerOptions = {}): string | undefined {
  const cwd = opts.cwd ?? process.cwd();
  const exec = opts.runCommand ?? runCommand;
  const remote = exec("git", ["remote", "get-url", "origin"], cwd);
  if (!remote) {
    return undefined;
  }
  return parseGithubUserFromRemote(remote);
}

/** Options for {@link resolveGithubUsername}. */
export type ResolveGithubUsernameOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Override command executor for tests. */
  runCommand?: (file: string, args: string[], cwd?: string) => string | undefined;
};

/**
 * Best-effort GitHub login for footer display.
 *
 * Resolution order: `$GITHUB_USER` → `gh api user` → git config → origin remote.
 *
 * @param opts - options, including optional command executor for tests
 */
export function resolveGithubUsername(opts: ResolveGithubUsernameOptions = {}): string | undefined {
  const cwd = opts.cwd ?? process.cwd();
  const env = opts.env ?? process.env;
  const exec = opts.runCommand ?? runCommand;

  const fromEnv = githubUserFromEnv(env);
  if (fromEnv) {
    return fromEnv;
  }

  for (const { file, args, cwd: commandCwd } of githubUsernameCommands(cwd)) {
    const value = exec(file, args, commandCwd);
    if (value) {
      return value;
    }
  }

  const remote = exec("git", ["remote", "get-url", "origin"], cwd);
  return remote ? parseGithubUserFromRemote(remote) : undefined;
}

/** Footer payload containing the GitHub handle and repo owner. */
export type GithubFooterContext = {
  githubUser?: string;
  repoOwner?: string;
};

/** Options for {@link resolveGithubFooterContextAsync}. */
export type ResolveGithubFooterContextOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Override async command executor for tests. */
  runCommandAsync?: (file: string, args: string[], cwd?: string) => Promise<string | undefined>;
};

/**
 * Resolve footer GitHub handle and repo owner asynchronously.
 *
 * Non-blocking so the footer can refresh after UI startup.
 *
 * @param opts - options, including optional async command executor for tests
 */
export async function resolveGithubFooterContextAsync(
  opts: ResolveGithubFooterContextOptions = {},
): Promise<GithubFooterContext> {
  const cwd = opts.cwd ?? process.cwd();
  const env = opts.env ?? process.env;
  const exec = opts.runCommandAsync ?? runCommandAsync;

  const remote = await exec("git", ["remote", "get-url", "origin"], cwd);
  const repoOwner = remote ? parseGithubUserFromRemote(remote) : undefined;

  const fromEnv = githubUserFromEnv(env);
  if (fromEnv) {
    return { githubUser: fromEnv, repoOwner };
  }

  for (const { file, args, cwd: commandCwd } of githubUsernameCommands(cwd)) {
    const value = await exec(file, args, commandCwd);
    if (value) {
      return { githubUser: value, repoOwner };
    }
  }

  return { githubUser: repoOwner, repoOwner };
}
