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
    console.log(`Updating ${repo}...`);
    try {
      execSync("git pull", { cwd: cached, stdio: "pipe" });
    } catch (e) {
      console.warn(`Failed to update cache, using existing version`);
    }
    return cached;
  }

  ensureCacheDir();
  const cachePath = getCachePath(normalized);
  console.log(`Cloning ${repo}...`);
  execSync(`git clone ${normalized} ${cachePath}`, { stdio: "pipe" });
  return cachePath;
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

module.exports = { cloneOrUpdate, normalizeRepo, getRepoRoot };
