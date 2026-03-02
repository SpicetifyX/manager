package app

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
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
	Subdir string `json:"subdir,omitempty"`
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
	branchVal := ""
	if branch != nil {
		branchVal = *branch
	}
	log.Printf("[install-marketplace-app] START: user=%s repo=%s appName=%s branch=%s\n", user, repo, appName, branchVal)

	ghHeaders := map[string]string{"User-Agent": "SpicetifyX"}

	archiveURL := ""
	subdir := ""
	if meta != nil {
		subdir = meta.Subdir
		log.Printf("[install-marketplace-app] Subdir from meta: %s\n", subdir)
	}

	// Try branch if provided and NOT a default branch
	isDefaultBranch := branchVal == "" || branchVal == "main" || branchVal == "master"
	if !isDefaultBranch {
		candidateURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/zipball/%s", user, repo, branchVal)
		log.Printf("[install-marketplace-app] Trying specific branch zipball: %s\n", candidateURL)
		resp, err := helpers.HttpGetWithHeaders(candidateURL, ghHeaders)
		if err == nil {
			if resp.StatusCode == 200 {
				archiveURL = candidateURL
				log.Printf("[install-marketplace-app] Found branch archive: %s\n", archiveURL)
			} else {
				log.Printf("[install-marketplace-app] Branch request HTTP %d\n", resp.StatusCode)
			}
			resp.Body.Close()
		} else {
			log.Printf("[install-marketplace-app] Branch request error: %v\n", err)
		}
	} else {
		log.Printf("[install-marketplace-app] Skipping branch try because it is default: %s\n", branchVal)
	}

	// If branch didn't work or is a default branch, try releases
	if archiveURL == "" {
		releasesURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases?per_page=30", user, repo)
		log.Printf("[install-marketplace-app] Fetching releases: %s\n", releasesURL)
		if resp, err := helpers.HttpGetWithHeaders(releasesURL, ghHeaders); err == nil {
			if resp.StatusCode == 200 {
				var releases []struct {
					Assets []struct {
						Name               string `json:"name"`
						BrowserDownloadURL string `json:"browser_download_url"`
					} `json:"assets"`
					ZipballURL string `json:"zipball_url"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&releases); err == nil {
					log.Printf("[install-marketplace-app] Found %d releases\n", len(releases))
					needle := strings.ToLower(subdir)
					for _, release := range releases {
						for _, asset := range release.Assets {
							if !strings.HasSuffix(asset.Name, ".zip") {
								continue
							}
							assetLow := strings.ToLower(asset.Name)
							if needle == "" || strings.Contains(assetLow, needle) {
								archiveURL = asset.BrowserDownloadURL
								subdir = ""
								log.Printf("[install-marketplace-app] Found release asset match: %s\n", archiveURL)
								break
							}
						}
						if archiveURL != "" {
							break
						}
					}

					if archiveURL == "" && len(releases) > 0 {
						archiveURL = releases[0].ZipballURL
						log.Printf("[install-marketplace-app] Falling back to first release zipball: %s\n", archiveURL)
					}
				} else {
					log.Printf("[install-marketplace-app] Failed to decode releases JSON: %v\n", err)
				}
			} else {
				log.Printf("[install-marketplace-app] Releases request HTTP %d\n", resp.StatusCode)
			}
			resp.Body.Close()
		} else {
			log.Printf("[install-marketplace-app] Releases request error: %v\n", err)
		}
	}

	if archiveURL == "" {
		b := "main"
		if branchVal != "" && branchVal != "master" {
			b = branchVal
		}
		archiveURL = fmt.Sprintf("https://api.github.com/repos/%s/%s/zipball/%s", user, repo, b)
		log.Printf("[install-marketplace-app] Final fallback to branch %s zipball: %s\n", b, archiveURL)
	}

	log.Printf("[install-marketplace-app] FINAL archiveURL: %s\n", archiveURL)
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

	if subdir != "" {
		subPath := filepath.Join(destDir, subdir)
		if info, err := os.Stat(subPath); err == nil && info.IsDir() {
			entries, _ := os.ReadDir(subPath)
			movedNames := make(map[string]struct{})
			for _, e := range entries {
				movedNames[e.Name()] = struct{}{}
				_ = os.Rename(filepath.Join(subPath, e.Name()), filepath.Join(destDir, e.Name()))
			}

			topEntries, _ := os.ReadDir(destDir)
			for _, te := range topEntries {
				if _, keep := movedNames[te.Name()]; !keep {
					_ = os.RemoveAll(filepath.Join(destDir, te.Name()))
				}
			}
		}
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
