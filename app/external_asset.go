package app

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
)

func (a *App) GetExternalImageBase64(imageSrc string) string {
	resp, err := http.Get(imageSrc)
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

	return fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(content))
}
