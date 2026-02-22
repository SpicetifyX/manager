package app

import (
	"encoding/json"
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
)

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

func (a *App) GetSpicetifyApps() []AppInfo {
	configPath := helpers.GetConfigFilePath()
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

	customAppsDir := helpers.GetCustomAppsDir()
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
		isEnabled := slices.Contains(enabledApps, appID)

		info := AppInfo{
			Name:              appID,
			Icon:              "",
			ActiveIcon:        "",
			Subfiles:          []string{},
			SubfilesExtension: []string{},
			ID:                appID,
			IsEnabled:         isEnabled,
		}

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

func (a *App) ToggleSpicetifyApp(appID string, enable bool) bool {
	exec := helpers.GetSpicetifyExec()

	var args []string
	if enable {
		args = []string{"config", "custom_apps", appID}
	} else {
		args = []string{"config", "custom_apps", appID + "-"}
	}

	if err := helpers.SpicetifyCommand(exec, args, nil); err != nil {
		return false
	}
	return true
}

func (a *App) DeleteSpicetifyApp(appID string) bool {
	exec := helpers.GetSpicetifyExec()

	_ = helpers.SpicetifyCommand(exec, []string{"config", "custom_apps", appID + "-"}, nil)
	_ = os.RemoveAll(filepath.Join(helpers.GetCustomAppsDir(), appID))
	return true
}
