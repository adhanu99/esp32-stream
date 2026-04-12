const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
    if (req.url === "/ping") {
        res.writeHead(200);
        res.end("Server is Awake");
    } else {
        res.writeHead(200);
        res.end("ESP32 Open Streamer Online");
    }
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("New connection established");

    ws.on("message", (msg) => {
        // 1. Handle LED Commands (Text)
        const message = msg.toString();
        if (message === "LED_ON" || message === "LED_OFF") {
            // Send command to ALL connected clients (ESP32 will pick it up)
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
            return;
        }

        // 2. Handle Video (Binary)
        // If message is binary (camera frame), broadcast it to everyone
        if (typeof msg !== 'string') {
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(msg);
                }
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Open Server live on port ${PORT}`));
