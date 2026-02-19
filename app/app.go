package app

import (
	"context"
	"manager/internal/discord"
	"net/http"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx          context.Context
	discord      *discord.DiscordRPC
	rpcStart     int64
	rpcConnected bool
	closeToTray  bool
	AssetHandler http.Handler
}

func  New() *App {
	return &App{
		AssetHandler: newAssetHandler(),
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.discord = discord.NewDiscordRPC("1470628543938433034")
	a.rpcStart = currentTimeMillis()

	settings, err := ReadSettings()
	if err == nil {
		a.closeToTray = settings.CloseToTray
		if settings.DiscordRpc {
			go func() {
				if err := a.discord.Connect(); err == nil {
					a.rpcConnected = true
					_ = a.discord.SetActivity(discord.Activity{
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

func (a *App) Shutdown(ctx context.Context) {
	if a.rpcConnected {
		a.discord.Close()
	}
}

func (a *App) WindowMinimize() {
	runtime.WindowMinimise(a.ctx)
}

func (a *App) WindowClose() {
	runtime.Quit(a.ctx)
}
