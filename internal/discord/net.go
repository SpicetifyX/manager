package discord

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"runtime"
)

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