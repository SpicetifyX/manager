package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// ThemeInfo represents an installed Spicetify theme
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

// GetSpicetifyThemes returns all installed Spicetify themes
func (a *App) GetSpicetifyThemes() []ThemeInfo {
	configPath := getConfigFilePath()
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

	themesDir := getThemesDir()
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
		})
	}

	return themes
}

// ApplySpicetifyTheme applies a theme by ID
func (a *App) ApplySpicetifyTheme(themeID string) bool {
	exec := getSpicetifyExec()
	themesDir := getThemesDir()

	if err := spicetifyCommand(exec, []string{"config", "current_theme", themeID}, nil); err != nil {
		return false
	}

	// Detect first color scheme
	firstScheme := ""
	colorIniPath := filepath.Join(themesDir, themeID, "color.ini")
	if data, err := os.ReadFile(colorIniPath); err == nil {
		re := regexp.MustCompile(`(?m)^\[(.+)\]`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			firstScheme = strings.TrimSpace(string(m[1]))
		}
	}

	if err := spicetifyCommand(exec, []string{"config", "color_scheme", firstScheme}, nil); err != nil {
		return false
	}
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// SetColorScheme sets a color scheme for the active theme
func (a *App) SetColorScheme(themeID, scheme string) bool {
	exec := getSpicetifyExec()
	if err := spicetifyCommand(exec, []string{"config", "color_scheme", scheme}, nil); err != nil {
		return false
	}
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// DeleteSpicetifyTheme removes a theme and applies changes
func (a *App) DeleteSpicetifyTheme(themeID string) bool {
	exec := getSpicetifyExec()
	themesDir := getThemesDir()

	// If it's the current theme, reset
	if data, err := os.ReadFile(getConfigFilePath()); err == nil {
		re := regexp.MustCompile(`(?m)^current_theme\s*=\s*(.*)$`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			if strings.TrimSpace(string(m[1])) == themeID {
				_ = spicetifyCommand(exec, []string{"config", "current_theme", ""}, nil)
			}
		}
	}

	// Remove directory
	_ = os.RemoveAll(filepath.Join(themesDir, themeID))

	// Apply
	_ = spicetifyCommand(exec, []string{"apply"}, nil)
	return true
}
