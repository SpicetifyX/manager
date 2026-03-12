package app

import (
	"log"
	"manager/internal/helpers"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins
	},
}

type WSServer struct {
	clients   map[*websocket.Conn]bool
	broadcast chan interface{}
	mu        sync.Mutex
}

var wsServer = &WSServer{
	clients:   make(map[*websocket.Conn]bool),
	broadcast: make(chan interface{}),
}

func StartWSServer() {
	http.HandleFunc("/ws", handleConnections)
	go handleMessages()

	log.Println("WebSocket server started on :3001")
	go func() {
		if err := http.ListenAndServe(":3001", nil); err != nil {
			log.Fatal("ListenAndServe: ", err)
		}
	}()
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	wsServer.mu.Lock()
	wsServer.clients[ws] = true
	wsServer.mu.Unlock()

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			wsServer.mu.Lock()
			delete(wsServer.clients, ws)
			wsServer.mu.Unlock()
			break
		}
	}
}

func handleMessages() {
	for {
		msg := <-wsServer.broadcast
		wsServer.mu.Lock()
		for client := range wsServer.clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(wsServer.clients, client)
			}
		}
		wsServer.mu.Unlock()
	}
}

func BroadcastLiveColor(themeID, preset, key, value string) {
	msg := map[string]string{
		"type":    "color_update",
		"themeID": themeID,
		"preset":  preset,
		"key":     key,
		"value":   value,
	}
	wsServer.broadcast <- msg
}

func (a *App) BroadcastColorUpdate(themeID, preset, key, value string) {
	BroadcastLiveColor(themeID, preset, key, value)
}

func (a *App) InstallSpicetifyXExtension() bool {
	extDir := helpers.GetExtensionsDir()
	_ = os.MkdirAll(extDir, 0755)

	destPath := filepath.Join(extDir, "spicetifyx.js")
	
	// Extension code
	content := `(function SpicetifyX() {
    const WS_URL = "ws://localhost:3001/ws";
    let socket;

    function connect() {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log("[SpicetifyX] Connected to live preview server");
        };

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "color_update") {
                    updateColor(msg.key, msg.value);
                }
            } catch (e) {
                console.error("[SpicetifyX] Failed to parse message", e);
            }
        };

        socket.onclose = () => {
            console.log("[SpicetifyX] Disconnected from live preview server. Retrying in 5s...");
            setTimeout(connect, 5000);
        };

        socket.onerror = (err) => {
            console.error("[SpicetifyX] WebSocket error", err);
            socket.close();
        };
    }

    function updateColor(key, value) {
        if (!key || !value) return;
        
        const hexValue = value.startsWith("#") ? value : "#" + value;
        const rgbValue = hexToRGB(value);

        document.documentElement.style.setProperty("--spice-" + key, hexValue);
        document.documentElement.style.setProperty("--spice-rgb-" + key, rgbValue);
    }

    function hexToRGB(hex) {
        hex = hex.replace("#", "");
        if (hex.length === 3) {
            hex = hex.split("").map(x => x + x).join("");
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return r + ", " + g + ", " + b;
    }

    if (!window.Spicetify || !Spicetify.Config) {
        setTimeout(SpicetifyX, 1000);
        return;
    }

    connect();
})();`

	err := os.WriteFile(destPath, []byte(content), 0644)
	if err != nil {
		return false
	}

	// Enable extension
	exec := helpers.GetSpicetifyExec()
	_ = helpers.SpicetifyCommand(exec, []string{"config", "extensions", "spicetifyx.js"}, nil)
	
	return true
}
