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
