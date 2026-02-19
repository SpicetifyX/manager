package app

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"strings"
)

// extractZipToDir extracts a zip archive (as []byte) into destDir.
// If stripTopDir is true, the top-level directory in the zip is stripped.
func extractZipToDir(data []byte, destDir string, stripTopDir bool) error {
	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return err
	}

	for _, f := range r.File {
		name := f.Name
		if name == "" {
			continue
		}

		if stripTopDir {
			// Strip the first path component
			idx := strings.Index(name, "/")
			if idx < 0 {
				continue
			}
			name = name[idx+1:]
			if name == "" {
				continue
			}
		}

		destPath := filepath.Join(destDir, filepath.FromSlash(name))

		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(destPath, 0755); err != nil {
				return err
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return err
		}

		rc, err := f.Open()
		if err != nil {
			return err
		}

		out, err := os.Create(destPath)
		if err != nil {
			rc.Close()
			return err
		}

		buf := make([]byte, 32*1024)
		for {
			n, err := rc.Read(buf)
			if n > 0 {
				if _, werr := out.Write(buf[:n]); werr != nil {
					out.Close()
					rc.Close()
					return werr
				}
			}
			if err != nil {
				break
			}
		}
		out.Close()
		rc.Close()
	}

	return nil
}
