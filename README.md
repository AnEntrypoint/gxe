# gxe - Git Execution

Run GitHub repositories directly like `npx` - but for git repos. Every execution automatically fetches the latest version.

## Installation

```bash
npm install -g gxe
# or use with npx
npx gxe user/repo [script] [args...]
```

## Usage

```bash
# Run default "start" script
gxe user/repo

# Run a specific npm script
gxe user/repo build

# Run a specific npm script with arguments
gxe user/repo test --coverage

# Use with npx (no installation needed)
npx gxe user/repo start

# Local development (use local path)
gxe ./local-path start
```

## How It Works

1. Clones or updates the repository from GitHub to `~/.gxe` cache
2. Always fetches the latest version before execution (via `git fetch` + `git reset --hard`)
3. Installs dependencies if `package.json` exists
4. Executes the specified npm script or binary
5. Passes through all output from the script

## Technical Details

- **Latest always**: Each run executes `git fetch origin` and resets to latest default branch
- **Silent**: gxe produces no output; only script output is shown
- **Tolerant**: Projects without `package.json` or dependencies work fine (install failures are silently ignored)
- **Cross-platform**: Uses `shell: true` for Windows/Unix compatibility

## Caveats & Gotchas

- **No stdout from gxe itself**: Dependency installation progress is hidden
- **Silent install failures**: If npm install fails but dependencies aren't needed, script continues
- **Repo deletion**: If GitHub repo is deleted but cached, `git fetch` will fail explicitly
- **Default script**: If no script specified, runs "start" - fails if it doesn't exist
- **No proxy support**: Uses system git configuration; no built-in proxy handling
- **Windows transformers.js**: Special handling with `--legacy-peer-deps --ignore-scripts` required

## Cache

```bash
# Clear cache if issues persist
rm -rf ~/.gxe
```
