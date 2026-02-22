package app

import (
	"encoding/json"
	"fmt"
	"io"
	"manager/internal/helpers"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type MarketplaceMeta struct {
	Name        string       `json:"name"`
	Description string       `json:"description,omitempty"`
	ImageURL    string       `json:"imageURL,omitempty"`
	Authors     []AuthorInfo `json:"authors,omitempty"`
	Tags        []string     `json:"tags,omitempty"`
	Stars       int          `json:"stars,omitempty"`
}

func (a *App) InstallMarketplaceExtension(extensionURL, filename string, meta *MarketplaceMeta) bool {
	extDir := helpers.GetExtensionsDir()
	if err := os.MkdirAll(extDir, 0755); err != nil {
		return false
	}

	content, err := downloadText(extensionURL)
	if err != nil {
		fmt.Printf("[install-marketplace-extension] Failed to download: %v\n", err)
		return false
	}

	destPath := filepath.Join(extDir, filename)
	if err := os.WriteFile(destPath, []byte(content), 0644); err != nil {
		return false
	}

	if meta != nil {
		metaData, _ := json.MarshalIndent(meta, "", "  ")
		_ = os.WriteFile(destPath+".meta.json", metaData, 0644)
	}

	exec := helpers.GetSpicetifyExec()
	if err := helpers.SpicetifyCommand(exec, []string{"config", "extensions", filename}, nil); err != nil {
		return false
	}
	return true
}

func (a *App) InstallMarketplaceTheme(themeID, cssURL string, schemesURL *string, include []string, meta *MarketplaceMeta) bool {
	themesDir := helpers.GetThemesDir()
	destThemeDir := filepath.Join(themesDir, themeID)
	if err := os.MkdirAll(destThemeDir, 0755); err != nil {
		return false
	}

	cssContent, err := downloadText(cssURL)
	if err != nil {
		fmt.Printf("[install-marketplace-theme] Failed to download CSS: %v\n", err)
		return false
	}
	if err := os.WriteFile(filepath.Join(destThemeDir, "user.css"), []byte(cssContent), 0644); err != nil {
		return false
	}

	if schemesURL != nil && *schemesURL != "" {
		schemesContent, err := downloadText(*schemesURL)
		if err == nil {
			_ = os.WriteFile(filepath.Join(destThemeDir, "color.ini"), []byte(schemesContent), 0644)
		}
	}

	for _, incURL := range include {
		if !strings.HasPrefix(incURL, "http") {
			continue
		}
		parts := strings.Split(incURL, "/")
		filename := parts[len(parts)-1]
		content, err := downloadText(incURL)
		if err == nil {
			_ = os.WriteFile(filepath.Join(destThemeDir, filename), []byte(content), 0644)
		}
	}

	if meta != nil {
		metaData, _ := json.MarshalIndent(meta, "", "  ")
		_ = os.WriteFile(filepath.Join(destThemeDir, "theme.meta.json"), metaData, 0644)
	}

	exec := helpers.GetSpicetifyExec()
	if err := helpers.SpicetifyCommand(exec, []string{"config", "current_theme", themeID}, nil); err != nil {
		return false
	}

	firstScheme := ""
	colorIniPath := filepath.Join(destThemeDir, "color.ini")
	if data, err := os.ReadFile(colorIniPath); err == nil {
		re := regexp.MustCompile(`(?m)^\[(.+)\]`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			firstScheme = strings.TrimSpace(string(m[1]))
		}
	}
	_ = helpers.SpicetifyCommand(exec, []string{"config", "color_scheme", firstScheme}, nil)

	return true
}

func (a *App) InstallMarketplaceApp(user, repo, appName string, branch *string, meta *MarketplaceMeta) bool {
	ghHeaders := map[string]string{"User-Agent": "SpicetifyX"}

	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", user, repo)
	archiveURL := ""

	if resp, err := helpers.HttpGetWithHeaders(apiURL, ghHeaders); err == nil && resp.StatusCode == 200 {
		defer resp.Body.Close()
		var release struct {
			Assets []struct {
				Name               string `json:"name"`
				BrowserDownloadURL string `json:"browser_download_url"`
			} `json:"assets"`
			ZipballURL string `json:"zipball_url"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&release); err == nil {
			archiveURL = release.ZipballURL
			for _, asset := range release.Assets {
				if strings.HasSuffix(asset.Name, ".zip") {
					archiveURL = asset.BrowserDownloadURL
					break
				}
			}
		}
	}

	if archiveURL == "" {
		b := "main"
		if branch != nil && *branch != "" {
			b = *branch
		}
		archiveURL = fmt.Sprintf("https://api.github.com/repos/%s/%s/zipball/%s", user, repo, b)
	}

	resp, err := helpers.HttpGetWithHeaders(archiveURL, ghHeaders)
	if err != nil {
		fmt.Printf("[install-marketplace-app] Failed to download archive: %v\n", err)
		return false
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		fmt.Printf("[install-marketplace-app] HTTP %d downloading archive\n", resp.StatusCode)
		return false
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return false
	}

	customAppsDir := helpers.GetCustomAppsDir()
	destDir := filepath.Join(customAppsDir, appName)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return false
	}

	if err := helpers.ExtractZipToDir(data, destDir, true); err != nil {
		fmt.Printf("[install-marketplace-app] Failed to extract: %v\n", err)
		return false
	}

	if meta != nil {
		metaData, _ := json.MarshalIndent(meta, "", "  ")
		_ = os.WriteFile(filepath.Join(destDir, "app.meta.json"), metaData, 0644)
	}

	exec := helpers.GetSpicetifyExec()
	if err := helpers.SpicetifyCommand(exec, []string{"config", "custom_apps", appName}, nil); err != nil {
		return false
	}

	return true
}

func (a *App) OpenExternalLink(url string) bool {
	return helpers.OpenURL(url)
}
