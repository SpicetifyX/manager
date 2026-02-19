package app

import (
	"encoding/json"
	"fmt"
	"io"
	"manager/assets"
	"os"
	"path/filepath"
	"strings"
)

type assetExtension struct {
	Name           string                 `json:"name"`
	RawFiles       []string               `json:"raw_files"`
	RawMetaURL     *string                `json:"raw_meta_url"`
	RawMetaContent map[string]interface{} `json:"raw_meta_content"`
	FileName       string                 `json:"file_name"`
}

type assetTheme struct {
	Name           string                 `json:"name"`
	RawFiles       []string               `json:"raw_files"`
	RawMetaURL     *string                `json:"raw_meta_url"`
	RawMetaContent map[string]interface{} `json:"raw_meta_content"`
}

type assetApp struct {
	Name           string                 `json:"name"`
	RawArchiveURL  string                 `json:"raw_archive_url"`
	RawMetaURL     *string                `json:"raw_meta_url"`
	RawMetaContent map[string]interface{} `json:"raw_meta_content"`
}

type assetsFile struct {
	Extensions []assetExtension `json:"extensions"`
	Themes     []assetTheme     `json:"themes"`
	Apps       []assetApp       `json:"apps"`
}

// SetupSpicetifyAssets downloads and installs the bundled default assets
func (a *App) SetupSpicetifyAssets() error {
	// Read assets.json from the binary's embedded data
	// We use the assets.json from the frontend directory (copied at build time)
	assetsData, err := assets.PreinstallAssetsJSON.ReadFile("preinstall.json")
	if err != nil {
		return fmt.Errorf("could not read assets.json: %w", err)
	}

	var assets assetsFile
	if err := json.Unmarshal(assetsData, &assets); err != nil {
		return fmt.Errorf("could not parse assets.json: %w", err)
	}

	spicetifyPath := getSpicetifyConfigDir()

	// Install themes
	for _, theme := range assets.Themes {
		themeDir := filepath.Join(spicetifyPath, "Themes", theme.Name)
		if err := os.MkdirAll(themeDir, 0755); err != nil {
			return err
		}

		for _, fileURL := range theme.RawFiles {
			parts := strings.Split(fileURL, "/")
			fileName := strings.Split(parts[len(parts)-1], "?")[0]
			fmt.Printf("[setup-assets] Downloading theme asset: %s\n", fileName)

			content, err := downloadText(fileURL)
			if err != nil {
				fmt.Printf("[setup-assets] Warning: failed to download %s: %v\n", fileName, err)
				continue
			}
			if err := os.WriteFile(filepath.Join(themeDir, fileName), []byte(content), 0644); err != nil {
				return err
			}
		}

		metaPath := filepath.Join(themeDir, "theme.meta.json")
		if theme.RawMetaContent != nil {
			metaData, _ := json.MarshalIndent(theme.RawMetaContent, "", "  ")
			_ = os.WriteFile(metaPath, metaData, 0644)
		} else if theme.RawMetaURL != nil && *theme.RawMetaURL != "" {
			content, err := downloadText(*theme.RawMetaURL)
			if err == nil {
				_ = os.WriteFile(metaPath, []byte(content), 0644)
			}
		}
	}

	// Install extensions
	extDir := filepath.Join(spicetifyPath, "Extensions")
	if err := os.MkdirAll(extDir, 0755); err != nil {
		return err
	}

	for _, ext := range assets.Extensions {
		for _, fileURL := range ext.RawFiles {
			parts := strings.Split(fileURL, "/")
			fileName := strings.Split(parts[len(parts)-1], "?")[0]
			fmt.Printf("[setup-assets] Downloading extension: %s\n", fileName)

			content, err := downloadText(fileURL)
			if err != nil {
				fmt.Printf("[setup-assets] Warning: failed to download %s: %v\n", fileName, err)
				continue
			}
			if err := os.WriteFile(filepath.Join(extDir, fileName), []byte(content), 0644); err != nil {
				return err
			}
		}

		metaPath := filepath.Join(extDir, ext.FileName+".meta.json")
		if ext.RawMetaContent != nil {
			metaData, _ := json.MarshalIndent(ext.RawMetaContent, "", "  ")
			_ = os.WriteFile(metaPath, metaData, 0644)
		} else if ext.RawMetaURL != nil && *ext.RawMetaURL != "" {
			content, err := downloadText(*ext.RawMetaURL)
			if err == nil {
				_ = os.WriteFile(metaPath, []byte(content), 0644)
			}
		}
	}

	// Install apps
	for _, app := range assets.Apps {
		if app.RawArchiveURL == "" {
			continue
		}
		fmt.Printf("[setup-assets] Downloading app: %s from %s\n", app.Name, app.RawArchiveURL)

		resp, err := httpGet(app.RawArchiveURL)
		if err != nil {
			fmt.Printf("[setup-assets] Warning: failed to download app %s: %v\n", app.Name, err)
			continue
		}
		data, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		destDir := filepath.Join(spicetifyPath, "CustomApps", app.Name)
		if err := os.MkdirAll(destDir, 0755); err != nil {
			return err
		}

		if err := extractZipToDir(data, destDir, true); err != nil {
			fmt.Printf("[setup-assets] Warning: failed to extract app %s: %v\n", app.Name, err)
			continue
		}

		metaPath := filepath.Join(destDir, "app.meta.json")
		if app.RawMetaContent != nil {
			metaData, _ := json.MarshalIndent(app.RawMetaContent, "", "  ")
			_ = os.WriteFile(metaPath, metaData, 0644)
		} else if app.RawMetaURL != nil && *app.RawMetaURL != "" {
			content, err := downloadText(*app.RawMetaURL)
			if err == nil {
				_ = os.WriteFile(metaPath, []byte(content), 0644)
			}
		}
	}

	return nil
}
