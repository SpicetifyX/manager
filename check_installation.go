package main

import (
	"os"
	"path/filepath"
	"runtime"
)

// InstallStatus is returned by CheckInstallation
type InstallStatus struct {
	SpotifyInstalled   bool `json:"spotify_installed"`
	SpicetifyInstalled bool `json:"spicetify_installed"`
	AlreadyPatched     bool `json:"already_patched"`
}

// CheckInstallation checks whether Spotify and Spicetify are installed
func (a *App) CheckInstallation() InstallStatus {
	var spotifyPath string
	var alreadyPatchedPath string

	home, _ := os.UserHomeDir()

	if runtime.GOOS == "windows" {
		spotifyPath = filepath.Join(os.Getenv("APPDATA"), "Spotify")
	} else {
		spotifyPath = filepath.Join(home, "Library", "Application Support", "Spotify")
	}
	alreadyPatchedPath = filepath.Join(spotifyPath, ".spicetify")

	spotifyInstalled := fileExists(spotifyPath)
	binaryExists := fileExists(getSpicetifyExec())
	configExists := fileExists(getConfigFilePath())
	alreadyPatched := fileExists(alreadyPatchedPath)
	spicetifyInstalled := binaryExists && configExists

	return InstallStatus{
		SpotifyInstalled:   spotifyInstalled,
		SpicetifyInstalled: spicetifyInstalled,
		AlreadyPatched:     alreadyPatched,
	}
}
