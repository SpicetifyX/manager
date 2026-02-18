package main

import (
	"context"
	"net/http"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx          context.Context
	discord      *DiscordRPC
	rpcStart     int64
	rpcConnected bool
	closeToTray  bool
	assetHandler http.Handler
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		assetHandler: newAssetHandler(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.discord = NewDiscordRPC("1470628543938433034")
	a.rpcStart = currentTimeMillis()

	// Load settings and init Discord RPC
	settings, err := ReadSettings()
	if err == nil {
		a.closeToTray = settings.CloseToTray
		if settings.DiscordRpc {
			go func() {
				if err := a.discord.Connect(); err == nil {
					a.rpcConnected = true
					_ = a.discord.SetActivity(Activity{
						Name:      "SpicetifyX Manager",
						Details:   "Viewing Dashboard",
						CreatedAt: a.rpcStart,
						Type:      0,
					})
				}
			}()
		}
	}
}

func (a *App) shutdown(ctx context.Context) {
	if a.rpcConnected {
		a.discord.Close()
	}
}

// WindowMinimize minimizes the window
func (a *App) WindowMinimize() {
	runtime.WindowMinimise(a.ctx)
}

// WindowClose closes the window
func (a *App) WindowClose() {
	runtime.Quit(a.ctx)
}
