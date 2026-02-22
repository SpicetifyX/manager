//go:build windows

package helpers

import (
	"os/exec"
	"syscall"
)

func hideWindowIfNeeded(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}

func HideWindowIfNeeded(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
