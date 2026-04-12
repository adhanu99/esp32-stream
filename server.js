const WebSocket = require("ws");
const http = require("http");

// HTTP Server for Render's Health Check & Keep-Alive
const server = http.createServer((req, res) => {
    if (req.url === "/ping") {
        res.writeHead(200);
        res.end("Server is Awake");
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ESP32 Cloud Streamer Online");
    }
});

const wss = new WebSocket.Server({ server });

// Security & Connection State
const AUTH = { id: "adhanu99", pass: "CallmeDJ@99" };
let esp32Socket = null;

wss.on("connection", (ws) => {
    console.log("New client connected.");

    ws.on("message", (msg) => {
        // 1. Handle JSON (Authentication or Status)
        try {
            const data = JSON.parse(msg);
            if (data.id === AUTH.id && data.password === AUTH.pass) {
                esp32Socket = ws;
                console.log("ESP32 Authenticated ✅");
                return;
            }
        } catch (e) { /* Not JSON, proceed to binary/text */ }

        // 2. Handle LED Commands (Browser -> ESP32)
        const command = msg.toString();
        if (command === "LED_ON" || command === "LED_OFF") {
            if (esp32Socket && esp32Socket.readyState === WebSocket.OPEN) {
                esp32Socket.send(command);
                console.log(`Command sent: ${command}`);
            }
            return;
        }

        // 3. Broadcast Video (ESP32 -> All Browsers)
        if (ws === esp32Socket) {
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(msg); // Forward raw binary JPEG
                }
            });
        }
    });

    ws.on("close", () => {
        if (ws === esp32Socket) {
            esp32Socket = null;
            console.log("ESP32 Disconnected ❌");
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server live on port ${PORT}`));
