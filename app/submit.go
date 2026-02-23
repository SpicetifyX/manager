package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const submissionWebhook = "https://discord.com/api/webhooks/1475395513510527047/FtGe4NDpN1ef4sMCBeCFpL1YdXjYHsqW7vBL-OOtZTm5DcAJSUGY8xT9lf_Uwfvmp64P"

// SubmitMissingAddon sends a Discord embed to the dev channel when a user
// reports a missing marketplace listing. category is "extension", "theme", or
// "app". isDuplicate flags the embed when the user has already submitted the
// same repo+category (determined by the frontend). Returns true on 2xx.
func (a *App) SubmitMissingAddon(category, repoURL, note, discordUser string, isDuplicate bool) bool {
	noteText := note
	if noteText == "" {
		noteText = "*(none)*"
	}
	discordText := discordUser
	if discordText == "" {
		discordText = "*(not provided)*"
	}

	title := "📬 New Marketplace Submission"
	color := 0xd63c6a
	if isDuplicate {
		title = "🔁 Duplicate Submission"
		color = 0xe67e22
	}

	categoryEmoji := map[string]string{
		"extension": "🧩",
		"theme":     "🎨",
		"app":       "📦",
	}
	emoji := categoryEmoji[category]
	if emoji == "" {
		emoji = "•"
	}

	embed := map[string]any{
		"title":       title,
		"description": fmt.Sprintf("> **%s %s**\n> %s", emoji, category, repoURL),
		"color":       color,
		"fields": []map[string]any{
			{"name": "Note", "value": noteText, "inline": false},
			{"name": "Discord", "value": discordText, "inline": true},
		},
		"footer": map[string]any{"text": "SpicetifyX Marketplace Submissions"},
	}

	payload := map[string]any{
		"embeds": []any{embed},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("[submit] failed to marshal payload: %v\n", err)
		return false
	}

	resp, err := http.Post(submissionWebhook, "application/json", bytes.NewReader(body))
	if err != nil {
		fmt.Printf("[submit] webhook request failed: %v\n", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		fmt.Printf("[submit] webhook returned status %d\n", resp.StatusCode)
		return false
	}

	return true
}
