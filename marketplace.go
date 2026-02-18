package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// MarketplaceMeta contains metadata for marketplace items
type MarketplaceMeta struct {
	Name        string       `json:"name"`
	Description string       `json:"description,omitempty"`
	ImageURL    string       `json:"imageURL,omitempty"`
	Authors     []AuthorInfo `json:"authors,omitempty"`
	Tags        []string     `json:"tags,omitempty"`
	Stars       int          `json:"stars,omitempty"`
}

// InstallMarketplaceExtension downloads and installs a marketplace extension
func (a *App) InstallMarketplaceExtension(extensionURL, filename string, meta *MarketplaceMeta) bool {
	extDir := getExtensionsDir()
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

	exec := getSpicetifyExec()
	if err := spicetifyCommand(exec, []string{"config", "extensions", filename}, nil); err != nil {
		return false
	}
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// InstallMarketplaceTheme downloads and installs a marketplace theme
func (a *App) InstallMarketplaceTheme(themeID, cssURL string, schemesURL *string, include []string, meta *MarketplaceMeta) bool {
	themesDir := getThemesDir()
	destThemeDir := filepath.Join(themesDir, themeID)
	if err := os.MkdirAll(destThemeDir, 0755); err != nil {
		return false
	}

	// Download user.css
	cssContent, err := downloadText(cssURL)
	if err != nil {
		fmt.Printf("[install-marketplace-theme] Failed to download CSS: %v\n", err)
		return false
	}
	if err := os.WriteFile(filepath.Join(destThemeDir, "user.css"), []byte(cssContent), 0644); err != nil {
		return false
	}

	// Download color.ini if present
	if schemesURL != nil && *schemesURL != "" {
		schemesContent, err := downloadText(*schemesURL)
		if err == nil {
			_ = os.WriteFile(filepath.Join(destThemeDir, "color.ini"), []byte(schemesContent), 0644)
		}
	}

	// Download includes
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

	// Save meta
	if meta != nil {
		metaData, _ := json.MarshalIndent(meta, "", "  ")
		_ = os.WriteFile(filepath.Join(destThemeDir, "theme.meta.json"), metaData, 0644)
	}

	exec := getSpicetifyExec()
	if err := spicetifyCommand(exec, []string{"config", "current_theme", themeID}, nil); err != nil {
		return false
	}

	// Detect first color scheme
	firstScheme := ""
	colorIniPath := filepath.Join(destThemeDir, "color.ini")
	if data, err := os.ReadFile(colorIniPath); err == nil {
		re := regexp.MustCompile(`(?m)^\[(.+)\]`)
		if m := re.FindSubmatch(data); len(m) > 1 {
			firstScheme = strings.TrimSpace(string(m[1]))
		}
	}
	_ = spicetifyCommand(exec, []string{"config", "color_scheme", firstScheme}, nil)
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// InstallMarketplaceApp downloads and installs a marketplace app from GitHub
func (a *App) InstallMarketplaceApp(user, repo, appName string, branch *string, meta *MarketplaceMeta) bool {
	ghHeaders := map[string]string{"User-Agent": "SpicetifyX"}

	// Try to find latest release first
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", user, repo)
	archiveURL := ""

	if resp, err := httpGetWithHeaders(apiURL, ghHeaders); err == nil && resp.StatusCode == 200 {
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
		// Fall back to main/master branch
		b := "main"
		if branch != nil && *branch != "" {
			b = *branch
		}
		archiveURL = fmt.Sprintf("https://api.github.com/repos/%s/%s/zipball/%s", user, repo, b)
	}

	// Download archive
	resp, err := httpGetWithHeaders(archiveURL, ghHeaders)
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

	// Extract zip
	customAppsDir := getCustomAppsDir()
	destDir := filepath.Join(customAppsDir, appName)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return false
	}

	if err := extractZipToDir(data, destDir, true); err != nil {
		fmt.Printf("[install-marketplace-app] Failed to extract: %v\n", err)
		return false
	}

	// Save meta
	if meta != nil {
		metaData, _ := json.MarshalIndent(meta, "", "  ")
		_ = os.WriteFile(filepath.Join(destDir, "app.meta.json"), metaData, 0644)
	}

	exec := getSpicetifyExec()
	if err := spicetifyCommand(exec, []string{"config", "custom_apps", appName}, nil); err != nil {
		return false
	}
	if err := spicetifyCommand(exec, []string{"apply"}, nil); err != nil {
		return false
	}
	return true
}

// OpenExternalLink opens a URL in the system browser
func (a *App) OpenExternalLink(url string) bool {
	return openURL(url)
}
