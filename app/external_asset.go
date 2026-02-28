package app

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
)

func (a *App) GetExternalImageBase64(imageSrc string) string {
	// Normalize GitHub URLs to raw.githubusercontent.com
	// github.com/{user}/{repo}/blob/{branch}/{path} -> raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
	// github.com/{user}/{repo}/raw/{branch}/{path} -> raw.githubusercontent.com/{user}/{repo}/{branch}/{path}

	cleanSrc := strings.Split(imageSrc, "?")[0]

	githubBlobRegex := regexp.MustCompile(`https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)`)
	if match := githubBlobRegex.FindStringSubmatch(cleanSrc); match != nil {
		cleanSrc = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", match[1], match[2], match[3], match[4])
	}

	githubRawRegex := regexp.MustCompile(`https?://github\.com/([^/]+)/([^/]+)/raw/([^/]+)/(.+)`)
	if match := githubRawRegex.FindStringSubmatch(cleanSrc); match != nil {
		cleanSrc = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", match[1], match[2], match[3], match[4])
	}

	log.Println("Fetching external image:", cleanSrc)

	client := http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return nil // Allow redirects
		},
	}

	req, err := http.NewRequest("GET", cleanSrc, nil)
	if err != nil {
		log.Println(err)
		return ""
	}

	req.Header.Add("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		log.Println("[GetExternalImageBase64] Request failed:", err)
		return ""
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[GetExternalImageBase64] Unexpected status code %d for %s", resp.StatusCode, cleanSrc)
		return ""
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		log.Printf("[GetExternalImageBase64] Invalid content type %s for %s", contentType, cleanSrc)
		return ""
	}

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("[GetExternalImageBase64] Read failed:", err)
		return ""
	}

	if len(content) == 0 {
		log.Println("[GetExternalImageBase64] Empty content for:", cleanSrc)
		return ""
	}

	log.Printf("[GetExternalImageBase64] Fetched %d bytes from %s (Type: %s)", len(content), cleanSrc, contentType)

	return fmt.Sprintf("data:%s;base64,%s", contentType, base64.StdEncoding.EncodeToString(content))
}
