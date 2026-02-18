package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// newAssetHandler returns an http.Handler that serves addon-asset:// and theme-asset:// URLs
// In Wails, these are served via the AssetServer Handler for URLs starting with /addon-asset/ and /theme-asset/
func newAssetHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.URL.Path

		if strings.HasPrefix(urlPath, "/addon-asset/") {
			rel := strings.TrimPrefix(urlPath, "/addon-asset/")
			rel = strings.TrimPrefix(rel, "/")
			// Serve from spicetify Extensions dir
			fullPath := filepath.Join(getExtensionsDir(), filepath.FromSlash(rel))
			serveFile(w, r, fullPath)
			return
		}

		if strings.HasPrefix(urlPath, "/theme-asset/") {
			rel := strings.TrimPrefix(urlPath, "/theme-asset/")
			rel = strings.TrimPrefix(rel, "/")
			// Serve from spicetify Themes dir
			fullPath := filepath.Join(getThemesDir(), filepath.FromSlash(rel))
			serveFile(w, r, fullPath)
			return
		}

		http.NotFound(w, r)
	})
}

func serveFile(w http.ResponseWriter, r *http.Request, fullPath string) {
	data, err := os.ReadFile(fullPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	// Set appropriate content type
	ext := strings.ToLower(filepath.Ext(fullPath))
	switch ext {
	case ".png":
		w.Header().Set("Content-Type", "image/png")
	case ".jpg", ".jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
	case ".gif":
		w.Header().Set("Content-Type", "image/gif")
	case ".webp":
		w.Header().Set("Content-Type", "image/webp")
	case ".svg":
		w.Header().Set("Content-Type", "image/svg+xml")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	default:
		w.Header().Set("Content-Type", "application/octet-stream")
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
