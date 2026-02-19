package app

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"math/rand"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// Activity is the Discord RPC activity structure
type Activity struct {
	Name      string `json:"name"`
	Details   string `json:"details"`
	CreatedAt int64  `json:"created_at"`
	Type      int    `json:"type"`
}

// DiscordRPC implements a minimal Discord RPC client using IPC
type DiscordRPC struct {
	clientID  string
	conn      net.Conn
	connected bool
}

// NewDiscordRPC creates a new DiscordRPC instance
func NewDiscordRPC(clientID string) *DiscordRPC {
	return &DiscordRPC{clientID: clientID}
}

func (d *DiscordRPC) dialPipe(i int) (net.Conn, error) {
	if runtime.GOOS == "windows" {
		pipeName := fmt.Sprintf(`\\.\pipe\discord-ipc-%d`, i)
		return winDialPipe(pipeName)
	}
	var sockPath string
	if runtime.GOOS == "darwin" {
		home, _ := os.UserHomeDir()
		sockPath = filepath.Join(home, "Library", "Application Support", "discord", "ipc", fmt.Sprintf("discord-ipc-%d", i))
	} else {
		sockPath = fmt.Sprintf("/tmp/discord-ipc-%d", i)
	}
	return net.Dial("unix", sockPath)
}

func (d *DiscordRPC) encode(op uint32, data interface{}) ([]byte, error) {
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	buf := make([]byte, 8+len(payload))
	binary.LittleEndian.PutUint32(buf[0:4], op)
	binary.LittleEndian.PutUint32(buf[4:8], uint32(len(payload)))
	copy(buf[8:], payload)
	return buf, nil
}

func (d *DiscordRPC) readFrame() (uint32, []byte, error) {
	header := make([]byte, 8)
	if _, err := readFull(d.conn, header); err != nil {
		return 0, nil, err
	}
	op := binary.LittleEndian.Uint32(header[0:4])
	length := binary.LittleEndian.Uint32(header[4:8])
	payload := make([]byte, length)
	if _, err := readFull(d.conn, payload); err != nil {
		return 0, nil, err
	}
	return op, payload, nil
}

func readFull(conn net.Conn, buf []byte) (int, error) {
	total := 0
	for total < len(buf) {
		n, err := conn.Read(buf[total:])
		total += n
		if err != nil {
			return total, err
		}
	}
	return total, nil
}

// Connect opens the IPC connection to Discord
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

	// Send handshake
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

	// Wait for READY
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

// SetActivity sets the Discord RPC activity
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

// Close closes the Discord RPC connection
func (d *DiscordRPC) Close() {
	if d.conn != nil {
		_ = d.conn.Close()
	}
	d.connected = false
}

// SetRpcActivity is the Wails-bound method for setting Discord activity
func (a *App) SetRpcActivity(details string) {
	if !a.rpcConnected {
		return
	}
	_ = a.discord.SetActivity(Activity{
		Name:      "SpicetifyX Manager",
		Details:   details,
		CreatedAt: a.rpcStart,
		Type:      0,
	})
}

// ToggleDiscordRpc enables/disables Discord RPC
func (a *App) ToggleDiscordRpc(enable bool) {
	if enable && !a.rpcConnected {
		go func() {
			if err := a.discord.Connect(); err == nil {
				a.rpcConnected = true
				_ = a.discord.SetActivity(Activity{
					Name:      "SpicetifyX Manager",
					Details:   "Viewing Dashboard",
					CreatedAt: a.rpcStart,
					Type:      0,
				})
			}
		}()
	} else if !enable && a.rpcConnected {
		a.discord.Close()
		a.rpcConnected = false
	}
}

// SetCloseToTray sets the close-to-tray preference
func (a *App) SetCloseToTray(enable bool) {
	a.closeToTray = enable
}
