package helpers

import (
	"bytes"
	"fmt"
	"io"
	"log"
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
		var combinedOut bytes.Buffer
		cmd.Stdout = &combinedOut
		cmd.Stderr = &combinedOut
		
		log.Printf("[SpicetifyCommand] Executing: %s %v\n", execPath, args)
		err := cmd.Run()
		output := combinedOut.String()
		if output != "" {
			log.Printf("[SpicetifyCommand] Output: %s\n", output)
		}
		if err != nil {
			return fmt.Errorf("spicetify %v exited with error: %w. Output: %s", args, err, output)
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
