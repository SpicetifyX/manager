package discord

import (
	"encoding/binary"
	"net"
)

type Activity struct {
	Details    string `json:"details"`
	State      string `json:"state"`
	LargeImage string `json:"large_image"`
	LargeText  string `json:"large_text"`
	SmallImage string `json:"small_image"`
	SmallText  string `json:"small_text"`
	CreatedAt  int64  `json:"created_at"`
	Type       int    `json:"type"`
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

		if op == 3 {
			pong := make([]byte, 8+len(payload))
			binary.LittleEndian.PutUint32(pong[0:4], 4)
			binary.LittleEndian.PutUint32(pong[4:8], uint32(len(payload)))
			copy(pong[8:], payload)
			_, _ = d.conn.Write(pong)
		}
	}
}
