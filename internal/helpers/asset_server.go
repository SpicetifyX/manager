package helpers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func NewAssetHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.URL.Path

		if strings.HasPrefix(urlPath, "/addon-asset/") {
			rel := strings.TrimPrefix(urlPath, "/addon-asset/")
			rel = strings.TrimPrefix(rel, "/")
			// Serve from spicetify Extensions dir
			fullPath := filepath.Join(GetExtensionsDir(), filepath.FromSlash(rel))
			ServeFile(w, r, fullPath)
			return
		}

		if strings.HasPrefix(urlPath, "/theme-asset/") {
			rel := strings.TrimPrefix(urlPath, "/theme-asset/")
			rel = strings.TrimPrefix(rel, "/")
			// Serve from spicetify Themes dir
			fullPath := filepath.Join(GetThemesDir(), filepath.FromSlash(rel))
			ServeFile(w, r, fullPath)
			return
		}

		http.NotFound(w, r)
	})
}

func ServeFile(w http.ResponseWriter, r *http.Request, fullPath string) {
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
