package discord

import (
	"encoding/binary"
	"net"
)

type Activity struct {
	// Line 1 under app name (bold)
	Details string `json:"details"`
	// Line 2 under details
	State string `json:"state"`
	// Large image asset key (upload in Developer Portal → Rich Presence → Art Assets)
	LargeImage string `json:"large_image"`
	// Tooltip on the large image
	LargeText string `json:"large_text"`
	// Small overlay image asset key
	SmallImage string `json:"small_image"`
	// Tooltip on the small image
	SmallText string `json:"small_text"`
	// Unix milliseconds — shows as "XX elapsed" on the profile
	CreatedAt int64 `json:"created_at"`
	// 0 = Playing, 2 = Listening, 3 = Watching
	Type int `json:"type"`
}

type DiscordRPC struct {
	clientID  string
	conn      net.Conn
	connected bool
	done      chan struct{}
}

func NewDiscordRPC(clientID string) *DiscordRPC {
	return &DiscordRPC{clientID: clientID, done: make(chan struct{})}
}

func (d *DiscordRPC) Close() {
	select {
	case <-d.done:
	default:
		close(d.done)
	}
	if d.conn != nil {
		_ = d.conn.Close()
	}
	d.connected = false
}

func (d *DiscordRPC) Connected() bool {
	return d.connected
}

// Run sets the initial activity then handles all incoming frames (including
// PING→PONG) on the same goroutine as the writes, eliminating concurrent I/O.
// It blocks until the connection is closed or an error occurs.
func (d *DiscordRPC) Run(activity Activity) {
	if err := d.setActivity(activity); err != nil {
		d.connected = false
		return
	}

	for {
		select {
		case <-d.done:
			return
		default:
		}
		op, payload, err := d.readFrame()
		if err != nil {
			select {
			case <-d.done:
				return
			default:
				d.connected = false
				return
			}
		}
		// Respond to PING (opcode 3) with PONG (opcode 4)
		if op == 3 {
			pong := make([]byte, 8+len(payload))
			binary.LittleEndian.PutUint32(pong[0:4], 4)
			binary.LittleEndian.PutUint32(pong[4:8], uint32(len(payload)))
			copy(pong[8:], payload)
			_, _ = d.conn.Write(pong)
		}
	}
}
