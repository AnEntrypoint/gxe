const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");
const { cloneOrUpdate, getRepoRoot } = require("./git");

function findScript(repoPath, scriptName) {
  const pkgPath = path.join(repoPath, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`No package.json found in ${repoPath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const scripts = pkg.scripts || {};

  if (scripts[scriptName]) {
    return { script: scripts[scriptName], cwd: repoPath };
  }

  const bin = pkg.bin;
  if (bin) {
    if (typeof bin === "string") {
      const binPath = path.join(repoPath, bin);
      if (fs.existsSync(binPath)) {
        return { bin: binPath, cwd: repoPath };
      }
    } else if (typeof bin === "object" && bin[scriptName]) {
      const binPath = path.join(repoPath, bin[scriptName]);
      if (fs.existsSync(binPath)) {
        return { bin: binPath, cwd: repoPath };
      }
    }
  }

  const binPath = path.join(repoPath, scriptName);
  if (fs.existsSync(binPath) && fs.statSync(binPath).isFile()) {
    return { bin: binPath, cwd: repoPath };
  }

  throw new Error(`Script or bin "${scriptName}" not found in ${pkg.name}`);
}

async function runScript(repo, scriptName, args = [], options = {}) {
  const repoPath = cloneOrUpdate(repo);
  const root = getRepoRoot(repoPath);

  // Ensure dependencies are installed
  const pkgPath = path.join(root, "package.json");
  const nodeModulesPath = path.join(root, "node_modules");
  if (fs.existsSync(pkgPath)) {
    const isWindows = process.platform === 'win32';
    const hasLockFile = fs.existsSync(path.join(root, "package-lock.json"));

    // Try npm ci first (more reliable), fall back to npm install
    // On Windows, include --legacy-peer-deps for compatibility
    let installCmd;
    if (hasLockFile) {
      installCmd = isWindows
        ? "npm ci --legacy-peer-deps --no-audit 2>&1"
        : "npm ci --no-audit 2>&1";
    } else {
      installCmd = isWindows
        ? "npm install --legacy-peer-deps --no-save --no-audit 2>&1"
        : "npm install --no-save --no-audit 2>&1";
    }

    try {
      execSync(installCmd, { cwd: root, stdio: ["pipe", "pipe", "pipe"], shell: true });
    } catch (e) {
      // If npm ci fails and we have a lock file, try npm install as fallback
      if (hasLockFile) {
        const fallbackCmd = isWindows
          ? "npm install --legacy-peer-deps --no-audit 2>&1"
          : "npm install --no-audit 2>&1";
        try {
          execSync(fallbackCmd, { cwd: root, stdio: ["pipe", "pipe", "pipe"], shell: true });
        } catch (e2) {
          throw new Error(`Failed to install dependencies in ${root}: ${e2.message}`);
        }
      } else {
        throw new Error(`Failed to install dependencies in ${root}: ${e.message}`);
      }
    }

    // Verify dependencies installed
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error(`node_modules not found after install in ${root}`);
    }
  }

  const { script, bin } = findScript(root, scriptName);

  // Merge process.env with any custom env vars passed in options
  const env = { ...process.env, ...(options.env || {}) };

  if (script) {
    return new Promise((resolve, reject) => {
      const proc = spawn(`${script} ${args.join(" ")}`, [], {
        cwd: root,
        stdio: options.captureOutput ? "pipe" : "inherit",
        env,
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      if (options.captureOutput) {
        proc.stdout?.on("data", (data) => {
          stdout += data.toString();
        });
        proc.stderr?.on("data", (data) => {
          stderr += data.toString();
        });
      }

      proc.on("exit", (code) => {
        if (options.captureOutput) {
          resolve({ code, stdout, stderr });
        } else {
          resolve(code);
        }
      });
      proc.on("error", reject);
    });
  }

  if (bin) {
    return new Promise((resolve, reject) => {
      const proc = spawn("node", [bin, ...args], {
        cwd: root,
        stdio: options.captureOutput ? "pipe" : "inherit",
        env,
      });

      let stdout = "";
      let stderr = "";

      if (options.captureOutput) {
        proc.stdout?.on("data", (data) => {
          stdout += data.toString();
        });
        proc.stderr?.on("data", (data) => {
          stderr += data.toString();
        });
      }

      proc.on("exit", (code) => {
        if (options.captureOutput) {
          resolve({ code, stdout, stderr });
        } else {
          resolve(code);
        }
      });
      proc.on("error", reject);
    });
  }
}

module.exports = { runScript };
