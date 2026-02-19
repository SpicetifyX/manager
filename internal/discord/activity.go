package discord

import (
	"fmt"
	"math/rand"
	"os"
)

func (d *DiscordRPC) SetActivity(activity Activity) error {
	if !d.connected || d.conn == nil {
		return fmt.Errorf("not connected")
	}

	nonce := fmt.Sprintf("%d", rand.Int63())
	frame, err := d.encode(1, map[string]interface{}{
		"cmd": "SET_ACTIVITY",
		"args": map[string]interface{}{
			"pid": os.Getpid(),
			"activity": map[string]interface{}{
				"name":    activity.Name,
				"details": activity.Details,
				"timestamps": map[string]interface{}{
					"start": activity.CreatedAt / 1000,
				},
				"type": activity.Type,
			},
		},
		"nonce": nonce,
	})
	if err != nil {
		return err
	}
	_, err = d.conn.Write(frame)
	return err
}