package app

// GetAddonAssetPath converts a relative addon asset path to a URL
func (a *App) GetAddonAssetPath(assetPath string) string {
	if isHTTP(assetPath) {
		return assetPath
	}
	return "/addon-asset/" + toSlash(assetPath)
}

// GetThemeAssetPath converts a relative theme asset path to a URL
func (a *App) GetThemeAssetPath(assetPath string) string {
	if isHTTP(assetPath) {
		return assetPath
	}
	return "/theme-asset/" + toSlash(assetPath)
}

func isHTTP(url string) bool {
	return len(url) > 7 && (url[:7] == "http://" || url[:8] == "https://")
}

func toSlash(path string) string {
	result := ""
	for _, c := range path {
		if c == '\\' {
			result += "/"
		} else {
			result += string(c)
		}
	}
	return result
}
