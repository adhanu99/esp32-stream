const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const USER_ID = "adhanu99";
const PASSWORD = "CallmeDJ@99";

app.use(express.json());

// LOGIN API
app.post("/login", (req, res) => {
  const { id, password } = req.body;

  if (id === USER_ID && password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// HEALTH
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// WEBSOCKET
wss.on("connection", (ws) => {
  let isAuth = false;

  ws.on("message", (message) => {
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
    } catch {}

    if (!isAuth) return;

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
