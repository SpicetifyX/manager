package discord

import "net"

type Activity struct {
	Name      string `json:"name"`
	Details   string `json:"details"`
	CreatedAt int64  `json:"created_at"`
	Type      int    `json:"type"`
}

type DiscordRPC struct {
	clientID  string
	conn      net.Conn
	connected bool
}

func NewDiscordRPC(clientID string) *DiscordRPC {
	return &DiscordRPC{clientID: clientID}
}

func (d *DiscordRPC) Close() {
	if d.conn != nil {
		_ = d.conn.Close()
	}
	d.connected = false
}