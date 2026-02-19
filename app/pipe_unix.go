//go:build !windows

package app

import "net"

// winDialPipe is not used on non-Windows platforms
func winDialPipe(pipeName string) (net.Conn, error) {
	return net.Dial("unix", pipeName)
}
