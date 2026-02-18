package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// AppSettings mirrors the frontend settings structure
type AppSettings struct {
	DiscordRpc           bool `json:"discordRpc"`
	CloseToTray          bool `json:"closeToTray"`
	CheckUpdatesOnLaunch bool `json:"checkUpdatesOnLaunch"`
}

var defaultSettings = AppSettings{
	DiscordRpc:           true,
	CloseToTray:          false,
	CheckUpdatesOnLaunch: true,
}

// ReadSettings reads settings from disk, falling back to defaults
func ReadSettings() (AppSettings, error) {
	data, err := os.ReadFile(getSettingsPath())
	if err != nil {
		return defaultSettings, nil
	}
	var s AppSettings
	if err := json.Unmarshal(data, &s); err != nil {
		return defaultSettings, nil
	}
	// merge with defaults for missing keys
	result := defaultSettings
	result.DiscordRpc = s.DiscordRpc
	result.CloseToTray = s.CloseToTray
	result.CheckUpdatesOnLaunch = s.CheckUpdatesOnLaunch
	return result, nil
}

// WriteSettings persists settings to disk
func WriteSettings(s AppSettings) error {
	dir := filepath.Dir(getSettingsPath())
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(getSettingsPath(), data, 0644)
}

// GetSettings returns the current settings
func (a *App) GetSettings() (AppSettings, error) {
	return ReadSettings()
}

// UpdateSettings merges partial settings and saves
func (a *App) UpdateSettings(partial map[string]interface{}) (AppSettings, error) {
	current, _ := ReadSettings()

	if v, ok := partial["discordRpc"]; ok {
		current.DiscordRpc = toBool(v)
	}
	if v, ok := partial["closeToTray"]; ok {
		current.CloseToTray = toBool(v)
		a.closeToTray = current.CloseToTray
	}
	if v, ok := partial["checkUpdatesOnLaunch"]; ok {
		current.CheckUpdatesOnLaunch = toBool(v)
	}

	return current, WriteSettings(current)
}

// OpenConfigFolder opens the Spicetify config directory in the file explorer
func (a *App) OpenConfigFolder() bool {
	dir := getSpicetifyConfigDir()
	return openPath(dir)
}

// GetAppVersion returns the app version from wails
func (a *App) GetAppVersion() string {
	return "1.0.0"
}

func toBool(v interface{}) bool {
	switch val := v.(type) {
	case bool:
		return val
	case float64:
		return val != 0
	}
	return false
}

// copyDirRecursive copies src directory to dest recursively
func copyDirRecursive(src, dest string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		destPath := filepath.Join(dest, rel)
		if info.IsDir() {
			return os.MkdirAll(destPath, 0755)
		}
		return copyFile(path, destPath)
	})
}

func copyFile(src, dest string) error {
	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return err
	}
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !errors.Is(err, os.ErrNotExist)
}

func downloadText(url string) (string, error) {
	resp, err := httpGet(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("HTTP %d for %s", resp.StatusCode, url)
	}
	data, err := io.ReadAll(resp.Body)
	return string(data), err
}
