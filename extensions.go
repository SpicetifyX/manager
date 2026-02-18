package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// AddonInfo represents an installed Spicetify extension
type AddonInfo struct {
	Name          string       `json:"name"`
	Description   string       `json:"description"`
	Preview       string       `json:"preview,omitempty"`
	Main          string       `json:"main"`
	ID            string       `json:"id"`
	AddonFileName string       `json:"addonFileName"`
	IsEnabled     bool         `json:"isEnabled"`
	Authors       []AuthorInfo `json:"authors,omitempty"`
	Tags          []string     `json:"tags,omitempty"`
	ImageURL      string       `json:"imageURL,omitempty"`
}

// AuthorInfo represents an addon author
type AuthorInfo struct {
	Name string `json:"name"`
	URL  string `json:"url,omitempty"`
}

// addonMeta is the structure stored in .meta.json files
type addonMeta struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	ImageURL    string       `json:"imageURL"`
	Authors     []AuthorInfo `json:"authors"`
	Tags        []string     `json:"tags"`
}

// GetSpicetifyExtensions returns all installed Spicetify extensions
func (a *App) GetSpicetifyExtensions() []AddonInfo {
	configPath := getConfigFilePath()
	var enabledExtensions []string

	if data, err := os.ReadFile(configPath); err == nil {
		re := regexp.MustCompile(`(?m)^extensions\s*=\s*(.*)$`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			for _, ext := range strings.Split(strings.TrimSpace(string(m[1])), "|") {
				ext = strings.TrimSpace(ext)
				if ext != "" {
					enabledExtensions = append(enabledExtensions, ext)
				}
			}
		}
	}

	extensionsDir := getExtensionsDir()
	addons := []AddonInfo{}

	entries, err := os.ReadDir(extensionsDir)
	if err != nil {
		return addons
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		file := entry.Name()
		if !strings.HasSuffix(file, ".js") {
			continue
		}
		nameWithoutExt := strings.TrimSuffix(file, ".js")
		isEnabled := contains(enabledExtensions, file) || contains(enabledExtensions, nameWithoutExt)

		var meta addonMeta
		metaPath := filepath.Join(extensionsDir, file+".meta.json")
		if data, err := os.ReadFile(metaPath); err == nil {
			_ = json.Unmarshal(data, &meta)
		}

		name := meta.Name
		if name == "" {
			name = nameWithoutExt
		}
		desc := meta.Description
		if desc == "" {
			desc = "User-installed extension"
		}

		addons = append(addons, AddonInfo{
			Name:          name,
			Description:   desc,
			Preview:       meta.ImageURL,
			Main:          file,
			ID:            nameWithoutExt,
			AddonFileName: file,
			IsEnabled:     isEnabled,
			Authors:       meta.Authors,
			Tags:          meta.Tags,
		})
	}

	return addons
}

// ToggleSpicetifyExtension enables or disables a Spicetify extension
func (a *App) ToggleSpicetifyExtension(addonFileName string, enable bool) bool {
	exec := getSpicetifyExec()

	// If enabling, try to copy from bundled assets
	if enable {
		extDir := getExtensionsDir()
		_ = os.MkdirAll(extDir, 0755)
	}

	var args []string
	if enable {
		args = []string{"config", "extensions", addonFileName}
	} else {
		args = []string{"config", "extensions", addonFileName + "-"}
	}

	if err := spicetifyCommand(exec, args, nil); err != nil {
		return false
	}
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// DeleteSpicetifyExtension removes an extension and applies changes
func (a *App) DeleteSpicetifyExtension(addonFileName string) bool {
	exec := getSpicetifyExec()

	// Disable in config first
	_ = spicetifyCommand(exec, []string{"config", "extensions", addonFileName + "-"}, nil)

	// Delete the file
	extPath := filepath.Join(getExtensionsDir(), addonFileName)
	_ = os.Remove(extPath)

	// Delete meta
	_ = os.Remove(extPath + ".meta.json")

	// Apply
	_ = spicetifyCommand(exec, []string{"apply"}, nil)
	return true
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
