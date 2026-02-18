package main

import (
	"os"
	"path/filepath"
	"runtime"
)

func getSpicetifyxDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".spicetifyx")
}

func getSpicetifyExec() string {
	dir := getSpicetifyxDir()
	if runtime.GOOS == "windows" {
		return filepath.Join(dir, "spicetify.exe")
	}
	return filepath.Join(dir, "spicetify")
}

func getSpicetifyConfigDir() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(os.Getenv("APPDATA"), "Spicetify")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "spicetify")
}

func getConfigFilePath() string {
	return filepath.Join(getSpicetifyConfigDir(), "config-xpui.ini")
}

func getExtensionsDir() string {
	return filepath.Join(getSpicetifyConfigDir(), "Extensions")
}

func getCustomAppsDir() string {
	return filepath.Join(getSpicetifyConfigDir(), "CustomApps")
}

func getThemesDir() string {
	return filepath.Join(getSpicetifyConfigDir(), "Themes")
}

func getSettingsPath() string {
	return filepath.Join(getSpicetifyxDir(), "settings.json")
}

func getAppPath() string {
	// The bundled assets are embedded, but we need the spicetifyx dir for
	// themes/extensions that were set up via setupSpicetifyAssets
	return getSpicetifyConfigDir()
}
