package discord

import (
	"fmt"
	"math/rand"
	"os"
)

func (d *DiscordRPC) setActivity(activity Activity) error {
	if !d.connected || d.conn == nil {
		return fmt.Errorf("not connected")
	}

	activityMap := map[string]interface{}{
		"details": activity.Details,
		"timestamps": map[string]interface{}{
			"start": activity.CreatedAt / 1000,
		},
		"type": activity.Type,
	}
	if activity.State != "" {
		activityMap["state"] = activity.State
	}

	assets := map[string]interface{}{}
	if activity.LargeImage != "" {
		assets["large_image"] = activity.LargeImage
	}
	if activity.LargeText != "" {
		assets["large_text"] = activity.LargeText
	}
	if activity.SmallImage != "" {
		assets["small_image"] = activity.SmallImage
	}
	if activity.SmallText != "" {
		assets["small_text"] = activity.SmallText
	}
	if len(assets) > 0 {
		activityMap["assets"] = assets
	}

	nonce := fmt.Sprintf("%d", rand.Int63())
	frame, err := d.encode(1, map[string]interface{}{
		"cmd": "SET_ACTIVITY",
		"args": map[string]interface{}{
			"pid":      os.Getpid(),
			"activity": activityMap,
		},
		"nonce": nonce,
	})
	_, err = d.conn.Write(frame)
	return err
}
