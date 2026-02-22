package app

import (
	"fmt"
	"io"
	"manager/internal/helpers"
	"os"
	"runtime"
	"strings"
)

func (a *App) InstallSpicetifyBinary() error {
	spicetifyxDir := helpers.GetSpicetifyxDir()

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

	archiveURL, err := helpers.GetLatestSpicetifyReleaseArchive()
	if err != nil {
		return fmt.Errorf("could not find latest release: %w", err)
	}
	if archiveURL == "" {
		return fmt.Errorf("no suitable release archive found for this platform")
	}

	fmt.Printf("[install-spicetify-binary] Downloading from %s\n", archiveURL)

	resp, err := helpers.HttpGet(archiveURL)
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
		return helpers.ExtractZipToDir(data, spicetifyxDir, false)
	}

	return helpers.ExtractTarGz(data, spicetifyxDir)
}

