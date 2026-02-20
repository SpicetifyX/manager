//go:build !windows

package discord

import "net"

func DialPipe(pipeName string) (net.Conn, error) {
	return net.Dial("unix", pipeName)
}
