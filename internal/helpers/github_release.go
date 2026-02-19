package helpers

import (
	"encoding/json"
	"fmt"
	"runtime"
	"strings"
)

func GetLatestSpicetifyReleaseArchive() (string, error) {
	apiURL := "https://api.github.com/repos/spicetify/cli/releases/latest"
	resp, err := HttpGet(apiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var release struct {
		Assets []struct {
			Name               string `json:"name"`
			BrowserDownloadURL string `json:"browser_download_url"`
		} `json:"assets"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", err
	}

	var osName string
	switch runtime.GOOS {
	case "windows":
		osName = "windows"
	case "darwin":
		osName = "darwin"
	default:
		osName = "linux"
	}

	arch := runtime.GOARCH
	archStr := arch
	if arch == "amd64" {
		archStr = "x86_64"
	} else if arch == "arm64" {
		archStr = "arm64"
	} else if arch == "386" {
		archStr = "x86"
	}

	for _, asset := range release.Assets {
		name := strings.ToLower(asset.Name)
		if strings.Contains(name, osName) && strings.Contains(name, strings.ToLower(archStr)) {
			return asset.BrowserDownloadURL, nil
		}
	}

	if arch == "amd64" {
		for _, asset := range release.Assets {
			name := strings.ToLower(asset.Name)
			if strings.Contains(name, osName) && strings.Contains(name, "amd64") {
				return asset.BrowserDownloadURL, nil
			}
		}
	}

	return "", fmt.Errorf("no matching release found for %s/%s", osName, archStr)
}