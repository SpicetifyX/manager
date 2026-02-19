# Technical Details

## Stack

SpicetifyX Manager is built with [Wails v2](https://wails.io), which embeds a Go backend and a React frontend into a single native desktop binary. There is no Electron or Node.js runtime dependency.

**Backend:** Go 1.23  
**Frontend:** React 18, TypeScript, Tailwind CSS, Vite  
**Desktop framework:** Wails v2  
**IPC:** Wails Go bindings (auto-generated, type-safe)

## Project Structure

```
manager/
  main.go                  # Wails app entry point
  app/                     # All Go application logic
    app.go                 # App struct, startup/shutdown, window controls
    check_installation.go  # Detects Spotify and Spicetify install state
    extensions.go          # Extension read, toggle, delete
    themes.go              # Theme read, apply, color scheme, delete
    apps.go                # Custom app read, toggle, delete
    versions.go            # Spotify and Spicetify version detection, reload
    marketplace.go         # Marketplace install for extensions, themes, apps
    install_binary.go      # Downloads the Spicetify CLI from GitHub releases
    setup_assets.go        # Installs bundled theme and extension assets
    start_patch.go         # Runs spicetify backup apply with streamed output
    start_restore.go       # Runs spicetify restore backup and cleans up files
    settings.go            # Read/write app settings, app version
    asset_paths.go         # Resolves local asset URLs for the frontend
  internal/
    helpers/               # HTTP client, path helpers, spicetify command runner,
                           # asset HTTP handler, zip/tar extraction, GitHub release resolver
    discord/               # Discord Rich Presence over IPC named pipe
  assets/
    preinstall.json        # Bundled extension and theme asset manifest
    frontend/              # React frontend source
      src/
        pages/             # Dashboard, Extensions, Themes, Apps, Settings, Install
        components/        # Titlebar, Sidebar, Header, Footer, Spinner
      wailsjs/             # Auto-generated Wails Go bindings
```

## IPC

All communication between the frontend and backend uses Wails bindings. The frontend imports Go methods directly from `wailsjs/go/app/App` as typed async functions. There is no custom IPC layer.

Long-running operations (install, restore) run in a goroutine and stream progress back to the frontend using Wails events:

- `spicetify-command-output` - streamed stdout/stderr from the Spicetify CLI
- `install-complete` - emitted when the patch process finishes
- `restore-complete` - emitted when the restore process finishes

## Asset Serving

Local extension and theme preview images are served over HTTP by a custom Wails `AssetServer` handler. The frontend requests these at `/addon-asset/<path>` and `/theme-asset/<path>`, which the handler maps to the Spicetify Extensions and Themes directories on disk.

## Settings

Settings are stored as JSON at `~/.spicetifyx/settings.json`.

```json
{
  "discordRpc": true,
  "closeToTray": false,
  "checkUpdatesOnLaunch": true
}
```

## Spicetify CLI

The manager downloads the Spicetify CLI binary from the [spicetify/cli GitHub releases](https://github.com/spicetify/cli/releases) on first install and stores it at `~/.spicetifyx/spicetify` (or `spicetify.exe` on Windows). All spicetify operations call this binary directly.

## Discord Rich Presence

Discord RPC is implemented over the Discord IPC socket. On Windows this is a named pipe (`\\.\pipe\discord-ipc-N`), on macOS and Linux it is a Unix domain socket. The connection is established at startup if Rich Presence is enabled in settings.

## Building

See [contributing.md](contributing.md) for build instructions.
