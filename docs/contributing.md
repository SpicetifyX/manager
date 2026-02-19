# Contributing

Contributions are welcome. Please read this document before opening a pull request.

## Prerequisites

- [Go 1.23+](https://go.dev/dl/)
- [Wails v2 CLI](https://wails.io/docs/gettingstarted/installation) (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- [Node.js 18+](https://nodejs.org) and npm
- [Git](https://git-scm.com)

On Windows, Wails also requires the [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/), which is included on Windows 11 and available as a download for Windows 10.

## Getting Started

```bash
git clone https://github.com/SpicetifyX/manager.git
cd manager
wails dev
```

`wails dev` starts the app with hot reload. Changes to the Go backend restart the process. Changes to the frontend are reflected instantly via Vite's dev server.

## Project Layout

The Go backend lives in `app/` and `internal/`. The frontend lives in `assets/frontend/src/`. See [technical-details.md](technical-details.md) for the full structure.

## Making Changes

**Backend (Go)**

- All exported methods on the `App` struct in `app/` are automatically available to the frontend via Wails bindings
- After adding or removing exported methods, run `wails generate module` from the project root to regenerate `assets/frontend/wailsjs/`
- Format all Go code with `go fmt ./...` before committing

**Frontend (TypeScript / React)**

- Pages live in `assets/frontend/src/pages/`, shared components in `assets/frontend/src/components/`
- The frontend imports Go methods directly from `wailsjs/go/app/App` as typed async functions
- Run `npm run build` inside `assets/frontend/` to verify the frontend compiles cleanly before opening a PR

## Code Style

- Go: standard `go fmt` formatting, no external linter required
- TypeScript/React: the project uses ESLint and Prettier. Run `npm run lint` to check and `npx prettier --write .` to format
- Keep components focused. If a page is getting large, split logic into smaller components
- Avoid committing commented-out code

## Submitting a Pull Request

1. Fork the repository and create a branch from `main`
2. Make your changes with clear, descriptive commits
3. Ensure `wails build` completes without errors before opening a PR
4. Open a pull request with a description of what changed and why

## Reporting Bugs

Open an issue on [GitHub](https://github.com/SpicetifyX/manager/issues) with:

- A description of the problem
- Steps to reproduce it
- Your operating system and app version

For questions or general discussion, join the [Discord server](https://discord.gg/W8FQtPUEeT).
