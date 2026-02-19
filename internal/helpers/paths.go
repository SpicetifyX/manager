package helpers

import (
	"os"
	"path/filepath"
	"runtime"
)

func GetSpicetifyxDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".spicetifyx")
}

func GetSpicetifyExec() string {
	dir := GetSpicetifyxDir()
	if runtime.GOOS == "windows" {
		return filepath.Join(dir, "spicetify.exe")
	}
	return filepath.Join(dir, "spicetify")
}

func GetSpicetifyConfigDir() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(os.Getenv("APPDATA"), "Spicetify")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "spicetify")
}

func GetConfigFilePath() string {
	return filepath.Join(GetSpicetifyConfigDir(), "config-xpui.ini")
}

func GetExtensionsDir() string {
	return filepath.Join(GetSpicetifyConfigDir(), "Extensions")
}

func GetCustomAppsDir() string {
	return filepath.Join(GetSpicetifyConfigDir(), "CustomApps")
}

func GetThemesDir() string {
	return filepath.Join(GetSpicetifyConfigDir(), "Themes")
}

func GetSettingsPath() string {
	return filepath.Join(GetSpicetifyxDir(), "settings.json")
}

func GetAppPath() string {
	return GetSpicetifyConfigDir()
}
