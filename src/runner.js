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
  if (fs.existsSync(pkgPath) && !fs.existsSync(nodeModulesPath)) {
    try {
      execSync("npm install", { cwd: root, stdio: "pipe" });
    } catch (e) {
      // npm install failed, continuing anyway
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
