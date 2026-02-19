package app

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// AppInfo represents an installed Spicetify custom app
type AppInfo struct {
	Name              string   `json:"name"`
	Icon              string   `json:"icon"`
	ActiveIcon        string   `json:"activeIcon"`
	Subfiles          []string `json:"subfiles"`
	SubfilesExtension []string `json:"subfiles_extension"`
	ID                string   `json:"id"`
	IsEnabled         bool     `json:"isEnabled"`
	ImageURL          string   `json:"imageURL,omitempty"`
}

type appMeta struct {
	Name     string `json:"name"`
	ImageURL string `json:"imageURL"`
}

// GetSpicetifyApps returns all installed Spicetify custom apps
func (a *App) GetSpicetifyApps() []AppInfo {
	configPath := getConfigFilePath()
	var enabledApps []string

	if data, err := os.ReadFile(configPath); err == nil {
		re := regexp.MustCompile(`(?m)^custom_apps\s*=\s*(.*)$`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			for _, app := range strings.Split(strings.TrimSpace(string(m[1])), "|") {
				app = strings.TrimSpace(app)
				if app != "" {
					enabledApps = append(enabledApps, app)
				}
			}
		}
	}

	customAppsDir := getCustomAppsDir()
	apps := []AppInfo{}

	entries, err := os.ReadDir(customAppsDir)
	if err != nil {
		return apps
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		appID := entry.Name()
		isEnabled := contains(enabledApps, appID)

		info := AppInfo{
			Name:              appID,
			Icon:              "",
			ActiveIcon:        "",
			Subfiles:          []string{},
			SubfilesExtension: []string{},
			ID:                appID,
			IsEnabled:         isEnabled,
		}

		// Read meta
		metaPath := filepath.Join(customAppsDir, appID, "app.meta.json")
		if data, err := os.ReadFile(metaPath); err == nil {
			var meta appMeta
			if err := json.Unmarshal(data, &meta); err == nil {
				if meta.Name != "" {
					info.Name = meta.Name
				}
				if meta.ImageURL != "" {
					info.ImageURL = meta.ImageURL
				}
			}
		}

		apps = append(apps, info)
	}

	return apps
}

// ToggleSpicetifyApp enables or disables a custom app
func (a *App) ToggleSpicetifyApp(appID string, enable bool) bool {
	exec := getSpicetifyExec()

	var args []string
	if enable {
		args = []string{"config", "custom_apps", appID}
	} else {
		args = []string{"config", "custom_apps", appID + "-"}
	}

	if err := spicetifyCommand(exec, args, nil); err != nil {
		return false
	}
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// DeleteSpicetifyApp removes a custom app and applies changes
func (a *App) DeleteSpicetifyApp(appID string) bool {
	exec := getSpicetifyExec()

	_ = spicetifyCommand(exec, []string{"config", "custom_apps", appID + "-"}, nil)
	_ = os.RemoveAll(filepath.Join(getCustomAppsDir(), appID))
	_ = spicetifyCommand(exec, []string{"apply"}, nil)
	return true
}
