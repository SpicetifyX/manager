//go:build !windows

package helpers

import "os/exec"

func hideWindowIfNeeded(cmd *exec.Cmd) {}

func HideWindowIfNeeded(cmd *exec.Cmd) {}
