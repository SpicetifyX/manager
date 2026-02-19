package app

import (
	"net/http"
	"os/exec"
	"runtime"
	"time"
)

// httpGet performs a GET request with a User-Agent header
func httpGet(url string) (*http.Response, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "SpicetifyX")
	return client.Do(req)
}

// openPath opens a file/folder in the default system file manager
func openPath(path string) bool {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", path)
	case "darwin":
		cmd = exec.Command("open", path)
	default:
		cmd = exec.Command("xdg-open", path)
	}
	return cmd.Start() == nil
}

// openURL opens a URL in the default browser
func openURL(url string) bool {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	return cmd.Start() == nil
}

// currentTimeMillis returns current Unix time in milliseconds
func currentTimeMillis() int64 {
	return time.Now().UnixMilli()
}
