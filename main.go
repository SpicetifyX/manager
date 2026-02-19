package main

import (
	"manager/app"
	"manager/assets"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

func main() {
	appInterface := app.New()

	err := wails.Run(&options.App{
		Title:            "SpicetifyX Manager",
		Width:            916,
		Height:           649,
		MinWidth:         916,
		MaxWidth:         916,
		MinHeight:        649,
		MaxHeight:        649,
		Frameless:        true,
		BackgroundColour: &options.RGBA{R: 23, G: 27, B: 32, A: 255},
		AssetServer: &assetserver.Options{
			Assets:  assets.Assets,
			Handler: appInterface.AssetHandler,
		},
		OnStartup:  appInterface.Startup,
		OnShutdown: appInterface.Shutdown,
		Bind: []interface{}{
			appInterface,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
		EnableDefaultContextMenu: false,
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
