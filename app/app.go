package app

import (
	"context"
	"manager/internal/discord"
	"manager/internal/helpers"
	"net/http"
	"time"

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

func New() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	a.discord = discord.NewDiscordRPC("1475108123336249490")
	a.rpcStart = helpers.CurrentTimeMillis()

	settings, err := ReadSettings()
	if err == nil {
		a.closeToTray = settings.CloseToTray
		if settings.DiscordRpc {
			go a.discordConnectLoop()
		}
	}
}

func (a *App) discordConnectLoop() {
	for {
		if !a.rpcConnected || (a.discord != nil && !a.discord.Connected()) {
			a.rpcConnected = false
			rpc := discord.NewDiscordRPC("1475108123336249490")
			if err := rpc.Connect(); err == nil {
				if a.discord != nil {
					a.discord.Close()
				}

				a.discord = rpc
				a.rpcConnected = true

				go rpc.Run(discord.Activity{
					Details:    "Viewing Dashboard",
					State:      "Managing Spicetify",
					LargeImage: "appicon",
					LargeText:  "SpicetifyX Manager",
					CreatedAt:  a.rpcStart,
					Type:       0,
				})
			} else {
			}
		}
		time.Sleep(5 * time.Second)
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
