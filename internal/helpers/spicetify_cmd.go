package helpers

import (
	"bytes"
	"fmt"
	"io"
	"os/exec"
	"sync"
)

// spicetifyMu serializes all spicetify invocations so rapid UI actions
// (fast tab-switching, multiple button clicks) can't cause concurrent
// conflicting commands.
var spicetifyMu sync.Mutex

func SpicetifyCommand(execPath string, args []string, onData func(string)) error {
	spicetifyMu.Lock()
	defer spicetifyMu.Unlock()

	cmd := exec.Command(execPath, args...)
	hideWindowIfNeeded(cmd)

	if onData == nil {
		var buf bytes.Buffer
		cmd.Stdout = &buf
		cmd.Stderr = &buf
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("spicetify exited with error: %w\nOutput:\n%s", err, buf.String())
		}
		return nil
	}

	pr, pw := io.Pipe()
	cmd.Stdout = pw
	cmd.Stderr = pw

	var runErr error
	done := make(chan struct{})

	if err := cmd.Start(); err != nil {
		return err
	}

	go func() {
		defer close(done)
		buf := make([]byte, 512)
		for {
			n, err := pr.Read(buf)
			if n > 0 {
				onData(string(buf[:n]))
			}
			if err != nil {
				break
			}
		}
	}()

	runErr = cmd.Wait()
	pw.Close()
	<-done

	return runErr
}
