package discord

import (
	"encoding/json"
	"fmt"
	"net"
	"time"
)

func (d *DiscordRPC) Connect() error {
	var conn net.Conn
	var err error

	for i := 0; i <= 9; i++ {
		conn, err = d.dialPipe(i)
		if err == nil {
			break
		}
	}
	if err != nil {
		return fmt.Errorf("could not connect to Discord IPC: %w", err)
	}
	d.conn = conn

	handshake, err := d.encode(0, map[string]interface{}{
		"v":         1,
		"client_id": d.clientID,
	})
	if err != nil {
		return err
	}
	if _, err := d.conn.Write(handshake); err != nil {
		return err
	}

	d.conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	_, payload, err := d.readFrame()
	if err != nil {
		d.conn.Close()
		return err
	}
	d.conn.SetReadDeadline(time.Time{})

	var response map[string]interface{}
	if err := json.Unmarshal(payload, &response); err != nil {
		d.conn.Close()
		return err
	}
	if response["evt"] != "READY" {
		d.conn.Close()
		return fmt.Errorf("unexpected Discord RPC event: %v", response["evt"])
	}

	d.connected = true
	return nil
}