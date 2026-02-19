//go:build !windows

package discord

import "net"

func winDialPipe(pipeName string) (net.Conn, error) {
	return net.Dial("unix", pipeName)
}
