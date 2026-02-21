package app

import (
	"encoding/json"
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"sync"
)

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

type AuthorInfo struct {
	Name string `json:"name"`
	URL  string `json:"url,omitempty"`
}

type addonMeta struct {
	Name        string       `json:"name"`
	Description string       `json:"description"`
	ImageURL    string       `json:"imageURL"`
	Authors     []AuthorInfo `json:"authors"`
	Tags        []string     `json:"tags"`
}

func (a *App) GetInstalledExtensions() []AddonInfo {
	configPath := helpers.GetConfigFilePath()
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

	extensionsDir := helpers.GetExtensionsDir()
	addons := []AddonInfo{}

	entries, err := os.ReadDir(extensionsDir)
	if err != nil {
		return addons
	}

	var mut sync.Mutex
	var wg sync.WaitGroup

	for _, entry := range entries {
		wg.Add(1)
		go func() {
			if entry.IsDir() {
				wg.Done()
				return
			}
			file := entry.Name()
			if !strings.HasSuffix(file, ".js") {
				wg.Done()
				return
			}
			nameWithoutExt := strings.TrimSuffix(file, ".js")
			isEnabled := slices.Contains(enabledExtensions, file) || slices.Contains(enabledExtensions, nameWithoutExt)

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

			base64Preview := a.GetExternalImageBase64(meta.ImageURL)

			mut.Lock()
			addons = append(addons, AddonInfo{
				Name:          name,
				Description:   desc,
				Preview:       base64Preview,
				Main:          file,
				ID:            nameWithoutExt,
				AddonFileName: file,
				IsEnabled:     isEnabled,
				Authors:       meta.Authors,
				Tags:          meta.Tags,
			})

			mut.Unlock()
			wg.Done()
		}()
	}

	wg.Wait()

	return addons
}

func (a *App) ToggleSpicetifyExtension(addonFileName string, enable bool) bool {
	exec := helpers.GetSpicetifyExec()

	if enable {
		extDir := helpers.GetExtensionsDir()
		_ = os.MkdirAll(extDir, 0755)
	}

	var args []string
	if enable {
		args = []string{"config", "extensions", addonFileName}
	} else {
		args = []string{"config", "extensions", addonFileName + "-"}
	}

	if err := helpers.SpicetifyCommand(exec, args, nil); err != nil {
		return false
	}
	// if err := helpers.SpicetifyCommand(exec, []string{"apply"}, nil); err != nil {
	// return false
	// }
	return true
}

func (a *App) DeleteSpicetifyExtension(addonFileName string) bool {
	exec := helpers.GetSpicetifyExec()

	_ = helpers.SpicetifyCommand(exec, []string{"config", "extensions", addonFileName + "-"}, nil)

	extPath := filepath.Join(helpers.GetExtensionsDir(), addonFileName)
	_ = os.Remove(extPath)

	_ = os.Remove(extPath + ".meta.json")

	// _ = helpers.SpicetifyCommand(exec, []string{"apply"}, nil)
	return true
}
