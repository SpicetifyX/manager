(function SpicetifyX() {
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
        
        // Prepend # if not present
        const hexValue = value.startsWith('#') ? value : `#${value}`;
        const rgbValue = hexToRGB(value);

        // Set CSS variables on :root
        document.documentElement.style.setProperty(`--spice-${key}`, hexValue);
        document.documentElement.style.setProperty(`--spice-rgb-${key}`, rgbValue);
        
        console.log(`[SpicetifyX] Updated ${key} to ${hexValue} (${rgbValue})`);
    }

    function hexToRGB(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }

    // Initialize
    if (!Spicetify.Config) {
        setTimeout(SpicetifyX, 1000);
        return;
    }

    connect();
})();
