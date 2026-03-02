package app

import (
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

type InstallStatus struct {
	Spotify   bool `json:"spotify"`
	Spicetify bool `json:"spicetify"`
	Patched   bool `json:"patched"`
}

// isActuallyPatched checks whether spicetify's injection is present in Spotify's
// xpui index.html. This is the ground-truth check — the .spicetify marker file
// persists across Spotify auto-updates, but the xpui injection does not.
func isActuallyPatched(spotifyPath string) bool {
	xpuiIndex := filepath.Join(spotifyPath, "Apps", "xpui", "index.html")
	data, err := os.ReadFile(xpuiIndex)
	if err != nil {
		return false
	}
	return strings.Contains(string(data), "spicetifyWrapper.js")
}

func (a *App) CheckInstallation() InstallStatus {
	var spotifyPath string

	home, _ := os.UserHomeDir()

	if runtime.GOOS == "windows" {
		spotifyPath = filepath.Join(os.Getenv("APPDATA"), "Spotify")
	} else if runtime.GOOS == "darwin" {
		spotifyPath = "/Applications/Spotify.app/Contents/Resources"
	} else {
		spotifyPath = filepath.Join(home, ".var", "app", "com.spotify.Client", "config", "spotify")
	}

	spotifyInstalled := fileExists(spotifyPath)
	binaryExists := fileExists(helpers.GetSpicetifyExec())
	configExists := fileExists(helpers.GetConfigFilePath())
	spicetifyInstalled := binaryExists && configExists

	// Only report as patched if the xpui injection is actually present.
	// A Spotify auto-update restores the original xpui files, making the
	// .spicetify marker stale. Checking the real file is the reliable signal.
	alreadyPatched := isActuallyPatched(spotifyPath)

	return InstallStatus{
		Spotify:   spotifyInstalled,
		Spicetify: spicetifyInstalled,
		Patched:   alreadyPatched,
	}
}
