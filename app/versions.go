package app

import (
	"manager/internal/helpers"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
)

func (a *App) GetSpicetifyVersion() string {
	if !fileExists(helpers.GetSpicetifyConfigDir()) {
		return "Unknown"
	}
	execPath := helpers.GetSpicetifyExec()
	cmd := exec.Command(execPath, "-v")
	helpers.HideWindowIfNeeded(cmd)
	out, err := cmd.Output()
	if err != nil {
		return "Unknown"
	}
	return strings.TrimSpace(string(out))
}

func (a *App) GetSpotifyVersion() string {
	var prefsPath string
	home, _ := os.UserHomeDir()
	if runtime.GOOS == "windows" {
		prefsPath = filepath.Join(os.Getenv("APPDATA"), "Spotify", "prefs")
	} else {
		prefsPath = filepath.Join(home, "Library", "Application Support", "Spotify", "prefs")
	}
	data, err := os.ReadFile(prefsPath)
	if err != nil {
		return "Unknown"
	}
	re := regexp.MustCompile(`app\.last-launched-version="([^"]+)"`)
	if m := re.FindSubmatch(data); len(m) > 1 {
		return string(m[1])
	}
	return "Unknown"
}

func (a *App) ReloadSpicetify() bool {
	spicetifyPath := helpers.GetSpicetifyExec()

	if err := helpers.SpicetifyCommand(spicetifyPath, []string{"apply"}, nil); err != nil {
		return false
	}

	return true
}
