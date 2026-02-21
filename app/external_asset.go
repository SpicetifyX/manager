package app

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
)

func (a *App) GetExternalImageBase64(imageSrc string) string {
	log.Println(imageSrc)

	client := http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	req, err := http.NewRequest("GET", imageSrc, nil)
	if err != nil {
		log.Println(err)
		return ""
	}

	req.Header.Add("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		log.Println(err)
		return ""
	}

	defer resp.Body.Close()

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println(err)
		return ""
	}

	log.Println(imageSrc, len(content))

	return fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(content))
}
