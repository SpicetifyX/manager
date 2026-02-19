package app

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// InstallSpicetifyBinary downloads and installs the Spicetify binary
func (a *App) InstallSpicetifyBinary() error {
	spicetifyxDir := getSpicetifyxDir()

	// Check if already installed
	if fileExists(spicetifyxDir) {
		binary := "spicetify"
		if runtime.GOOS == "windows" {
			binary = "spicetify.exe"
		}
		entries, err := os.ReadDir(spicetifyxDir)
		if err == nil {
			for _, e := range entries {
				if e.Name() == binary {
					fmt.Println("[install-spicetify-binary] Already installed, skipping")
					return nil
				}
			}
		}
	}

	archiveURL, err := getLatestSpicetifyReleaseArchive()
	if err != nil {
		return fmt.Errorf("could not find latest release: %w", err)
	}
	if archiveURL == "" {
		return fmt.Errorf("no suitable release archive found for this platform")
	}

	fmt.Printf("[install-spicetify-binary] Downloading from %s\n", archiveURL)

	resp, err := httpGet(archiveURL)
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	if err := os.MkdirAll(spicetifyxDir, 0755); err != nil {
		return err
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if strings.HasSuffix(archiveURL, ".zip") {
		return extractZipToDir(data, spicetifyxDir, false)
	}

	// tar.gz
	return extractTarGz(data, spicetifyxDir)
}

func extractTarGz(data []byte, destDir string) error {
	br := bytes.NewReader(data)
	gr, err := gzip.NewReader(br)
	if err != nil {
		return fmt.Errorf("gzip error: %w", err)
	}
	defer gr.Close()

	tr := tar.NewReader(gr)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		destPath := filepath.Join(destDir, hdr.Name)
		if hdr.Typeflag == tar.TypeDir {
			if err := os.MkdirAll(destPath, 0755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return err
		}
		out, err := os.Create(destPath)
		if err != nil {
			return err
		}
		if _, err := io.Copy(out, tr); err != nil {
			out.Close()
			return err
		}
		out.Close()

		// Make binary executable
		if hdr.Mode&0111 != 0 {
			_ = os.Chmod(destPath, 0755)
		}
	}
	return nil
}

// getLatestSpicetifyReleaseArchive finds the download URL for the latest spicetify release
func getLatestSpicetifyReleaseArchive() (string, error) {
	apiURL := "https://api.github.com/repos/spicetify/cli/releases/latest"
	resp, err := httpGet(apiURL)
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

	// Try amd64 fallback
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
