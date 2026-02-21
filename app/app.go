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

	a.discord = discord.NewDiscordRPC("1474805847946301440")
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
	const clientID = "1474805847946301440"
	// Brief delay so both the app and Discord finish initializing their IPC pipes
	time.Sleep(1 * time.Second)
	for {
		if !a.rpcConnected || (a.discord != nil && !a.discord.Connected()) {
			a.rpcConnected = false
			rpc := discord.NewDiscordRPC(clientID)
			if err := rpc.Connect(); err == nil {
				// Close the previous instance before replacing it
				if a.discord != nil {
					a.discord.Close()
				}
				a.discord = rpc
				a.rpcConnected = true
				// Run blocks on this goroutine: sets activity then handles all I/O serially
				go rpc.Run(discord.Activity{
					Details:    "Viewing Dashboard",
					State:      "Managing Spicetify",
					LargeImage: "appicon",
					LargeText:  "SpicetifyX Manager",
					CreatedAt:  a.rpcStart,
					Type:       0, // 0 = Playing, 2 = Listening, 3 = Watching
				})
			} else {
				// connect failed, retry after sleep
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
