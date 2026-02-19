package app

import (
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"runtime"
)

type InstallStatus struct {
	Spotify   bool `json:"spotify"`
	Spicetify bool `json:"spicetify"`
	Patched     bool `json:"patched"`
}

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
	binaryExists := fileExists(helpers.GetSpicetifyExec())
	configExists := fileExists(helpers.GetConfigFilePath())
	alreadyPatched := fileExists(alreadyPatchedPath)
	spicetifyInstalled := binaryExists && configExists

	return InstallStatus{
		Spotify:   spotifyInstalled,
		Spicetify: spicetifyInstalled,
		Patched:     alreadyPatched,
	}
}
