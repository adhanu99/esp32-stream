const WebSocket = require("ws");
const http = require("http");

const server = http.createServer((req, res) => {
    if (req.url === "/ping") {
        res.writeHead(200);
        res.end("awake");
    } else {
        res.writeHead(200);
        res.end("active");
    }
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const message = msg.toString();
        
        if (message === "LED_ON" || message === "LED_OFF") {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
            return;
        }

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
server.listen(PORT);
