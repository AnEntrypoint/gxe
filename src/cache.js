const fs = require("fs");
const path = require("path");
const os = require("os");

const CACHE_DIR = path.join(os.homedir(), ".gxe");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  return CACHE_DIR;
}

function getCachePath(repo) {
  const hash = Buffer.from(repo).toString("base64").replace(/[/+=]/g, "_");
  return path.join(ensureCacheDir(), hash);
}

function getCachedRepo(repo) {
  const cachePath = getCachePath(repo);
  return fs.existsSync(cachePath) ? cachePath : null;
}

function getCacheList() {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  return files.map((f) => {
    const cachePath = path.join(CACHE_DIR, f);
    const gitConfig = path.join(cachePath, ".git", "config");
    if (!fs.existsSync(gitConfig)) return null;
    const config = fs.readFileSync(gitConfig, "utf8");
    const match = config.match(/url = (.+)/);
    return match ? match[1] : null;
  });
}

module.exports = { getCachePath, getCachedRepo, ensureCacheDir, getCacheList };
