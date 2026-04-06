const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// 🔥 Disable compression
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false
});

const USER_ID = "adhanu99";
const PASSWORD = "CallmeDJ@99";

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// 🔥 FRAME CONTROL
let lastFrameTime = 0;

wss.on("connection", (ws) => {
  let isAuth = false;

  ws.on("message", (message) => {

    // AUTH
    try {
      const msg = JSON.parse(message);

      if (msg.type === "auth") {
        if (msg.id === USER_ID && msg.password === PASSWORD) {
          isAuth = true;
          ws.send(JSON.stringify({ type: "auth", status: "ok" }));
        } else {
          ws.close();
        }
        return;
      }
    } catch (e) {}

    if (!isAuth) return;

    // 🔥 LIMIT FPS (IMPORTANT)
    const now = Date.now();
    if (now - lastFrameTime < 100) return;
    lastFrameTime = now;

    // BROADCAST
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: true });
      }
    });
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});
