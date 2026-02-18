package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
)

// GetSpicetifyVersion returns the installed Spicetify version
func (a *App) GetSpicetifyVersion() string {
	if !fileExists(getSpicetifyConfigDir()) {
		return "Unknown"
	}
	execPath := getSpicetifyExec()
	out, err := exec.Command(execPath, "-v").Output()
	if err != nil {
		return "Unknown"
	}
	return strings.TrimSpace(string(out))
}

// GetSpotifyVersion reads the Spotify version from prefs
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

// ReloadSpicetify runs `spicetify apply` using the system spicetify on PATH
func (a *App) ReloadSpicetify() bool {
	spicetifyPath, err := exec.LookPath("spicetify")
	if err != nil {
		// fall back to our bundled binary
		spicetifyPath = getSpicetifyExec()
	}
	if err := spicetifyCommand(spicetifyPath, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}
