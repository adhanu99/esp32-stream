const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const USER_ID = "adhanu99";
const PASSWORD = "CallmeDJ@99";

let esp32Client = null;
let lastFrameTime = Date.now();

app.get("/", (req, res) => res.send("System Live"));

// 🔥 STABILITY: Active Health Check
setInterval(() => {
  if (esp32Client && (Date.now() - lastFrameTime > 5000)) {
    console.log("ESP32 Timeout - Cleaning connection");
    broadcast({ type: "status", value: "offline" });
    esp32Client.terminate();
    esp32Client = null;
  }
}, 3000);

function broadcast(data) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    // 1. Auth & Commands
    try {
      const data = JSON.parse(msg);
      if (data.type === "auth" && data.id === USER_ID && data.password === PASSWORD) {
        esp32Client = ws;
        lastFrameTime = Date.now();
        broadcast({ type: "status", value: "online" });
        return;
      }
    } catch (e) {}

    const cmd = msg.toString();
    if (cmd === "LED_ON" || cmd === "LED_OFF") {
      if (esp32Client) esp32Client.send(cmd);
      return;
    }

    // 2. Stream handling
    if (ws === esp32Client) {
      lastFrameTime = Date.now();
      wss.clients.forEach(c => {
        if (c !== ws && c.readyState === WebSocket.OPEN) c.send(msg);
      });
    }
  });

  ws.on("close", () => {
    if (ws === esp32Client) {
      esp32Client = null;
      broadcast({ type: "status", value: "offline" });
    }
  });
});

server.listen(process.env.PORT || 3000);
