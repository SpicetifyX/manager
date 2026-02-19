package assets

import "embed"

//go:embed all:frontend/dist
var Assets embed.FS

//go:embed preinstall.json
var PreinstallAssetsJSON embed.FS