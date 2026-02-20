package helpers

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func ExtractZipToDir(data []byte, destDir string, stripTopDir bool) error {
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

func ExtractTarGz(data []byte, destDir string) error {
	br := bytes.NewReader(data)
	gr, err := gzip.NewReader(br)
	if err != nil {
		return fmt.Errorf("gzip error: %w", err)
	}
	defer gr.Close()

	tr := tar.NewReader(gr)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		destPath := filepath.Join(destDir, hdr.Name)
		if hdr.Typeflag == tar.TypeDir {
			if err := os.MkdirAll(destPath, 0755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return err
		}
		out, err := os.Create(destPath)
		if err != nil {
			return err
		}
		if _, err := io.Copy(out, tr); err != nil {
			out.Close()
			return err
		}
		out.Close()

		if hdr.Mode&0111 != 0 {
			_ = os.Chmod(destPath, 0755)
		}
	}
	return nil
}
