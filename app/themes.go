package app

import (
	"encoding/json"
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type ThemeInfo struct {
	Name              string       `json:"name"`
	Description       string       `json:"description"`
	Usercss           string       `json:"usercss,omitempty"`
	Schemes           []string     `json:"schemes,omitempty"`
	Preview           string       `json:"preview,omitempty"`
	Authors           []AuthorInfo `json:"authors,omitempty"`
	Tags              []string     `json:"tags,omitempty"`
	ID                string       `json:"id"`
	IsActive          bool         `json:"isActive"`
	IsBundled         bool         `json:"isBundled"`
	ColorSchemes      []string     `json:"colorSchemes,omitempty"`
	ActiveColorScheme string       `json:"activeColorScheme,omitempty"`
	ImageURL          string       `json:"imageURL,omitempty"`
}

type themeMeta struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	ImageURL    string       `json:"imageURL"`
	Authors     []AuthorInfo `json:"authors"`
	Tags        []string     `json:"tags"`
}

func (a *App) GetSpicetifyThemes() []ThemeInfo {
	configPath := helpers.GetConfigFilePath()
	var currentTheme, currentColorScheme string

	if data, err := os.ReadFile(configPath); err == nil {
		reTheme := regexp.MustCompile(`(?m)^current_theme\s*=\s*(.*)$`)
		reScheme := regexp.MustCompile(`(?m)^color_scheme\s*=\s*(.*)$`)
		if m := reTheme.FindSubmatch(data); len(m) > 1 {
			currentTheme = strings.TrimSpace(string(m[1]))
		}
		if m := reScheme.FindSubmatch(data); len(m) > 1 {
			currentColorScheme = strings.TrimSpace(string(m[1]))
		}
	}

	themesDir := helpers.GetThemesDir()
	themes := []ThemeInfo{}

	entries, err := os.ReadDir(themesDir)
	if err != nil {
		return themes
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		themeID := entry.Name()
		themeDir := filepath.Join(themesDir, themeID)

		hasUserCss := fileExists(filepath.Join(themeDir, "user.css"))
		hasColorIni := fileExists(filepath.Join(themeDir, "color.ini"))

		if !hasUserCss && !hasColorIni {
			continue
		}

		var colorSchemes []string
		if hasColorIni {
			if data, err := os.ReadFile(filepath.Join(themeDir, "color.ini")); err == nil {
				re := regexp.MustCompile(`(?m)^\[(.+)\]`)
				for _, m := range re.FindAllSubmatch(data, -1) {
					if len(m) > 1 {
						colorSchemes = append(colorSchemes, strings.TrimSpace(string(m[1])))
					}
				}
			}
		}

		var meta themeMeta
		if data, err := os.ReadFile(filepath.Join(themeDir, "theme.meta.json")); err == nil {
			_ = json.Unmarshal(data, &meta)
		}

		name := meta.Name
		if name == "" {
			name = themeID
		}
		desc := meta.Description
		if desc == "" {
			desc = "User-installed theme"
		}

		var usercss string
		if hasUserCss {
			usercss = filepath.Join(themeID, "user.css")
		}
		var schemes []string
		if hasColorIni {
			schemes = []string{filepath.Join(themeID, "color.ini")}
		}

		activeScheme := ""
		if themeID == currentTheme && currentColorScheme != "" {
			activeScheme = currentColorScheme
		}

		themes = append(themes, ThemeInfo{
			Name:              name,
			Description:       desc,
			Usercss:           usercss,
			Schemes:           schemes,
			Preview:           meta.ImageURL,
			Authors:           meta.Authors,
			Tags:              meta.Tags,
			ID:                themeID,
			IsActive:          themeID == currentTheme,
			IsBundled:         false,
			ColorSchemes:      colorSchemes,
			ActiveColorScheme: activeScheme,
			ImageURL:          meta.ImageURL,
		})
	}

	return themes
}

func (a *App) ApplySpicetifyTheme(themeID string) bool {
	exec := helpers.GetSpicetifyExec()
	themesDir := helpers.GetThemesDir()

	if err := helpers.SpicetifyCommand(exec, []string{"config", "current_theme", themeID}, nil); err != nil {
		return false
	}

	firstScheme := ""
	colorIniPath := filepath.Join(themesDir, themeID, "color.ini")
	if data, err := os.ReadFile(colorIniPath); err == nil {
		re := regexp.MustCompile(`(?m)^\[(.+)\]`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			firstScheme = strings.TrimSpace(string(m[1]))
		}
	}

	if err := helpers.SpicetifyCommand(exec, []string{"config", "color_scheme", firstScheme}, nil); err != nil {
		return false
	}
	return true
}

func (a *App) SetColorScheme(themeID, scheme string) bool {
	exec := helpers.GetSpicetifyExec()
	if err := helpers.SpicetifyCommand(exec, []string{"config", "color_scheme", scheme}, nil); err != nil {
		return false
	}
	return true
}

func (a *App) DeleteSpicetifyTheme(themeID string) bool {
	exec := helpers.GetSpicetifyExec()
	themesDir := helpers.GetThemesDir()

	if data, err := os.ReadFile(helpers.GetConfigFilePath()); err == nil {
		re := regexp.MustCompile(`(?m)^current_theme\s*=\s*(.*)$`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			if strings.TrimSpace(string(m[1])) == themeID {
				// Fall back to the bundled SpicetifyX theme instead of leaving blank
				_ = helpers.SpicetifyCommand(exec, []string{"config", "current_theme", "SpicetifyX"}, nil)
				_ = helpers.SpicetifyCommand(exec, []string{"config", "color_scheme", "main"}, nil)
			}
		}
	}

	_ = os.RemoveAll(filepath.Join(themesDir, themeID))

	return true
}
