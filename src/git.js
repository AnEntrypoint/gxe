const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { getCachePath, getCachedRepo, ensureCacheDir } = require("./cache");

function normalizeRepo(repo) {
  if (!repo.includes("://")) {
    if (!repo.startsWith("http")) {
      if (repo.includes("/")) {
        return `https://github.com/${repo}.git`;
      }
      return `https://github.com/${repo}.git`;
    }
    if (!repo.endsWith(".git")) {
      return repo + ".git";
    }
  }
  if (!repo.endsWith(".git")) {
    return repo + ".git";
  }
  return repo;
}

function cloneOrUpdate(repo) {
  // Support local paths for development
  if (fs.existsSync(repo)) {
    return path.resolve(repo);
  }

  const normalized = normalizeRepo(repo);
  const cached = getCachedRepo(normalized);

  if (cached) {
    updateToLatest(cached, normalized);
    return cached;
  }

  ensureCacheDir();
  const cachePath = getCachePath(normalized);
  execSync(`git clone ${normalized} ${cachePath}`, { stdio: "pipe" });
  return cachePath;
}

function updateToLatest(repoPath, remoteUrl) {
  try {
    execSync("git fetch origin", { cwd: repoPath, stdio: "pipe" });
  } catch (e) {
    throw new Error(`Failed to fetch latest from remote at ${repoPath}: ${e.message}`);
  }

  let defaultBranch = "main";
  try {
    defaultBranch = execSync("git rev-parse --abbrev-ref origin/HEAD", {
      cwd: repoPath,
      stdio: "pipe",
    })
      .toString()
      .trim()
      .split("/")[1];
  } catch (e) {
    // Fallback to main if unable to detect
    defaultBranch = "main";
  }

  try {
    execSync(`git reset --hard origin/${defaultBranch}`, {
      cwd: repoPath,
      stdio: "pipe",
    });
  } catch (e) {
    throw new Error(
      `Failed to reset to origin/${defaultBranch} at ${repoPath}: ${e.message}`
    );
  }

  try {
    execSync(`git checkout ${defaultBranch}`, { cwd: repoPath, stdio: "pipe" });
  } catch (e) {
    throw new Error(
      `Failed to checkout ${defaultBranch} at ${repoPath}: ${e.message}`
    );
  }
}

function getRepoRoot(repoPath) {
  const pkgPath = path.join(repoPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    return repoPath;
  }
  const srcPath = path.join(repoPath, "src");
  if (fs.existsSync(srcPath)) {
    return srcPath;
  }
  return repoPath;
}

module.exports = { cloneOrUpdate, updateToLatest, normalizeRepo, getRepoRoot };
