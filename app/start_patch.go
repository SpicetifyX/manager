package app

import (
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"runtime"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) StartInstall() {
	go func() {
		sendOutput := func(data string) {
			wailsRuntime.EventsEmit(a.ctx, "spicetify-command-output", data)
		}

		exec := helpers.GetSpicetifyExec()

		if err := helpers.SpicetifyCommand(exec, []string{"config", "always_enable_devtools", "1"}, nil); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]any{"success": false, "error": err.Error()})
			return
		}

		if err := helpers.SpicetifyCommand(exec, []string{"config", "current_theme", "SpicetifyX"}, nil); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]any{"success": false, "error": err.Error()})
			return
		}
		if err := helpers.SpicetifyCommand(exec, []string{"config", "color_scheme", "main"}, nil); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]any{"success": false, "error": err.Error()})
			return
		}

		_ = helpers.SpicetifyCommand(exec, []string{"config", "extensions", "adblock.js"}, nil)
		_ = helpers.SpicetifyCommand(exec, []string{"config", "extensions", "spotifyGenres.js"}, nil)

		if err := helpers.SpicetifyCommand(exec, []string{"backup", "apply"}, sendOutput); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]any{"success": false, "error": err.Error()})
			return
		}

		var spotifyPath string
		home, _ := os.UserHomeDir()

		if runtime.GOOS == "windows" {
			spotifyPath = filepath.Join(os.Getenv("APPDATA"), "Spotify")
		} else {
			spotifyPath = filepath.Join(home, "Library", "Application Support", "Spotify")
		}
		_ = os.WriteFile(filepath.Join(spotifyPath, ".spicetify"), []byte(""), 0644)

		wailsRuntime.EventsEmit(a.ctx, "install-complete", map[string]any{"success": true})
	}()
}
