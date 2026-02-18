//go:build windows

package main

import (
	"net"
	"os"
	"time"
)

// winDialPipe connects to a Windows named pipe using os.OpenFile
func winDialPipe(pipeName string) (net.Conn, error) {
	f, err := os.OpenFile(pipeName, os.O_RDWR, os.ModeNamedPipe)
	if err != nil {
		return nil, err
	}
	return &pipeConn{f: f}, nil
}

type pipeConn struct {
	f *os.File
}

func (p *pipeConn) Read(b []byte) (int, error)         { return p.f.Read(b) }
func (p *pipeConn) Write(b []byte) (int, error)        { return p.f.Write(b) }
func (p *pipeConn) Close() error                       { return p.f.Close() }
func (p *pipeConn) LocalAddr() net.Addr                { return pipeAddr("pipe") }
func (p *pipeConn) RemoteAddr() net.Addr               { return pipeAddr("pipe") }
func (p *pipeConn) SetDeadline(t time.Time) error      { return p.f.SetDeadline(t) }
func (p *pipeConn) SetReadDeadline(t time.Time) error  { return p.f.SetReadDeadline(t) }
func (p *pipeConn) SetWriteDeadline(t time.Time) error { return p.f.SetWriteDeadline(t) }

type pipeAddr string

func (a pipeAddr) Network() string { return "pipe" }
func (a pipeAddr) String() string  { return string(a) }
