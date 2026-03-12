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

func (a *App) GetThemePresets(themeID string) map[string]map[string]string {
	themesDir := helpers.GetThemesDir()
	colorIniPath := filepath.Join(themesDir, themeID, "color.ini")

	data, err := os.ReadFile(colorIniPath)
	if err != nil {
		return nil
	}

	presets := make(map[string]map[string]string)
	var currentSection string

	content := string(data)
	content = strings.TrimPrefix(content, "\ufeff") // Remove UTF-8 BOM if present
	lines := strings.Split(strings.NewReplacer("\r\n", "\n", "\r", "\n").Replace(content), "\n")

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, ";") || strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Section check: [section]
		if strings.HasPrefix(trimmed, "[") && strings.HasSuffix(trimmed, "]") {
			currentSection = strings.TrimSpace(trimmed[1 : len(trimmed)-1])
			if _, ok := presets[currentSection]; !ok {
				presets[currentSection] = make(map[string]string)
			}
			continue
		}

		// Key-Value check: key = value
		if currentSection != "" && strings.Contains(trimmed, "=") {
			parts := strings.SplitN(trimmed, "=", 2)
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])

			// Remove inline comments from value
			if idx := strings.Index(value, ";"); idx != -1 {
				value = strings.TrimSpace(value[:idx])
			} else if idx := strings.Index(value, "#"); idx != -1 {
				value = strings.TrimSpace(value[:idx])
			}

			presets[currentSection][key] = value
		}
	}

	return presets
}

func (a *App) UpdateThemePreset(themeID, preset, key, value string) bool {
	themesDir := helpers.GetThemesDir()
	colorIniPath := filepath.Join(themesDir, themeID, "color.ini")

	data, err := os.ReadFile(colorIniPath)
	if err != nil {
		return false
	}

	content := string(data)
	lines := strings.Split(strings.NewReplacer("\r\n", "\n", "\r", "\n").Replace(content), "\n")
	var newLines []string
	var currentSection string
	found := false

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Parse for section tracking, even if line has comments
		parseLine := trimmed
		if idx := strings.Index(parseLine, ";"); idx != -1 {
			parseLine = strings.TrimSpace(parseLine[:idx])
		} else if idx := strings.Index(parseLine, "#"); idx != -1 {
			parseLine = strings.TrimSpace(parseLine[:idx])
		}

		if strings.HasPrefix(parseLine, "[") && strings.HasSuffix(parseLine, "]") {
			currentSection = strings.TrimSpace(parseLine[1 : len(parseLine)-1])
		} else if currentSection == preset && strings.Contains(trimmed, "=") {
			parts := strings.SplitN(trimmed, "=", 2)
			currentKey := strings.TrimSpace(parts[0])
			if currentKey == key {
				// preserve comments if any after the value
				comment := ""
				valPart := parts[1]
				if idx := strings.Index(valPart, ";"); idx != -1 {
					comment = " " + valPart[idx:]
				} else if idx := strings.Index(valPart, "#"); idx != -1 {
					comment = " " + valPart[idx:]
				}

				line = key + " = " + value + comment
				found = true
			}
		}
		newLines = append(newLines, line)
	}

	if !found {
		return false
	}

	err = os.WriteFile(colorIniPath, []byte(strings.Join(newLines, "\n")), 0644)
	return err == nil
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
