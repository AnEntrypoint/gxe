# gxe - Git Execution

Run GitHub repositories directly like `npx` - but for git repos.

## Installation

```bash
npm install -g gxe
```

## Usage

```bash
gxe <repo> [script] [args...]
```

### Examples

Run a repo with its default `start` script:
```bash
gxe user/repo
```

Run a specific script from package.json:
```bash
gxe user/repo build
```

Pass arguments to the script:
```bash
gxe user/repo build --prod
```

Use a full GitHub URL:
```bash
gxe https://github.com/user/repo dev
```

## How It Works

1. **Clone or Update**: Clones the repository to `~/.gxe/` cache or updates if it exists
2. **Find Script**: Looks for the script in package.json `scripts` or `bin` fields
3. **Execute**: Runs the script with any provided arguments
4. **Cache**: Future runs use the cached version for speed

## Script Resolution

The tool looks for scripts in this order:
1. `package.json` `scripts` field
2. `package.json` `bin` field
3. Executable file in the repo root

## Default Script

If no script name is provided, `start` is used by default.

## Environment

Runs with full stdio inheritance, so all output appears directly in your terminal.
