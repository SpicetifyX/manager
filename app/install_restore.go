package app

import (
	"os"
	"path/filepath"
	"runtime"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// StartInstall performs the spicetify backup+apply installation
func (a *App) StartInstall() {
	go func() {
		sendOutput := func(data string) {
			wailsRuntime.EventsEmit(a.ctx, "spicetify-command-output", data)
		}

		exec := getSpicetifyExec()

		// Configure spicetify
		if err := spicetifyCommand(exec, []string{"config", "always_enable_devtools", "1"}, nil); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		// Auto enable theme
		if err := spicetifyCommand(exec, []string{"config", "current_theme", "SpicetifyX"}, nil); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]interface{}{"success": false, "error": err.Error()})
			return
		}
		if err := spicetifyCommand(exec, []string{"config", "color_scheme", "main"}, nil); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		// Auto enable extensions
		_ = spicetifyCommand(exec, []string{"config", "extensions", "adblock.js"}, nil)
		_ = spicetifyCommand(exec, []string{"config", "extensions", "spotifyGenres.js"}, nil)

		// Run backup + apply
		if err := spicetifyCommand(exec, []string{"backup", "apply"}, sendOutput); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]interface{}{"success": false, "error": err.Error()})
			return
		}

		// Write .spicetify marker
		var spotifyPath string
		home, _ := os.UserHomeDir()
		if runtime.GOOS == "windows" {
			spotifyPath = filepath.Join(os.Getenv("APPDATA"), "Spotify")
		} else {
			spotifyPath = filepath.Join(home, "Library", "Application Support", "Spotify")
		}
		_ = os.WriteFile(filepath.Join(spotifyPath, ".spicetify"), []byte(""), 0644)

		wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]interface{}{"success": true})
	}()
}

// StartRestore performs a full Spicetify restore/cleanup
func (a *App) StartRestore() {
	go func() {
		sendOutput := func(data string) {
			wailsRuntime.EventsEmit(a.ctx, "spicetify-command-output", data)
		}

		exec := getSpicetifyExec()
		spicetifyxPath := getSpicetifyxDir()

		// Try restore backup
		if err := spicetifyCommand(exec, []string{"restore", "backup"}, sendOutput); err != nil {
			sendOutput("Warning: restore backup failed, cleaning up files...\n")
		}

		tryRm := func(p string) {
			if err := os.RemoveAll(p); err == nil {
				sendOutput("Removed: " + p + "\n")
			}
		}

		home, _ := os.UserHomeDir()

		if runtime.GOOS == "windows" {
			appdata := os.Getenv("APPDATA")
			localAppdata := os.Getenv("LOCALAPPDATA")
			if localAppdata == "" {
				localAppdata = filepath.Join(home, "AppData", "Local")
			}
			tryRm(filepath.Join(appdata, "Spicetify"))
			tryRm(filepath.Join(appdata, "spicetify"))
			tryRm(filepath.Join(localAppdata, "Spicetify"))
			tryRm(filepath.Join(localAppdata, "spicetify"))
			tryRm(filepath.Join(appdata, "Spotify", ".spicetify"))
		} else {
			tryRm(filepath.Join(home, ".config", "spicetify"))
			tryRm(filepath.Join(home, "Library", "Application Support", "Spotify", ".spicetify"))
			tryRm(filepath.Join(home, ".local", "state", "spicetify"))
			tryRm(filepath.Join(home, ".local", "share", "spicetify"))
		}

		tryRm(spicetifyxPath)

		wailsRuntime.EventsEmit(a.ctx, "restore-complete", map[string]interface{}{"success": true})
	}()
}
