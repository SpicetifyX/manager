package app

import (
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"runtime"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) StartRestore() {
	go func() {
		sendOutput := func(data string) {
			wailsRuntime.EventsEmit(a.ctx, "spicetify-command-output", data)
		}

		exec := helpers.GetSpicetifyExec()
		spicetifyxPath := helpers.GetSpicetifyxDir()

		if err := helpers.SpicetifyCommand(exec, []string{"restore", "backup"}, sendOutput); err != nil {
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