const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// 🔥 Disable compression for low latency
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false
});

// 🔐 LOGIN (same as before)
const USER_ID = "adhanu99";
const PASSWORD = "CallmeDJ@99";

app.use(express.json());

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("ESP32 Stream Server Running 🚀");
});

// ===== LOGIN API =====
app.post("/login", (req, res) => {
  const { id, password } = req.body;

  if (id === USER_ID && password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// ===== WEBSOCKET =====
wss.on("connection", (ws) => {
  let isAuth = false;

  ws.on("message", (message) => {

    // 🔐 Handle auth (JSON only)
    try {
      const msg = JSON.parse(message);

      if (msg.type === "auth") {
        if (msg.id === USER_ID && msg.password === PASSWORD) {
          isAuth = true;

          ws.send(JSON.stringify({
            type: "auth",
            status: "ok"
          }));

          console.log("Client authenticated ✅");
        } else {
          ws.close();
        }
        return;
      }
    } catch (e) {
      // Binary data (video frame)
    }

    if (!isAuth) return;

    // 🚀 FAST BROADCAST (low latency)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: true });
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected ❌");
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
