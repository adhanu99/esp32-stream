const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const USER_ID = "adhanu99";
const PASSWORD = "CallmeDJ@99";

let esp32Client = null;
let lastFrameTime = 0;

app.get("/", (req, res) => res.send("Streamer Active"));

setInterval(() => {
  if (lastFrameTime !== 0 && Date.now() - lastFrameTime > 3000) {
    broadcast({ type: "status", value: "offline" });
    console.log("[Stream] Status: ESP32 went Offline");
    lastFrameTime = 0;
  }
}, 2000);

function broadcast(data) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on("connection", (ws) => {
  console.log("[WS] New Connection Initialized");

  ws.on("message", (message) => {
    // 1. Handle JSON/Text (Auth or LED Commands)
    try {
      const data = JSON.parse(message);
      
      // Auth from ESP32
      if (data.type === "auth" && data.id === USER_ID && data.password === PASSWORD) {
        esp32Client = ws;
        broadcast({ type: "status", value: "online" });
        console.log("[Auth] ESP32 Authenticated ✅");
        return;
      }
    } catch (e) { /* Binary Frame Data */ }

    // 2. Handle LED Commands from UI
    if (message.toString() === "LED_ON" || message.toString() === "LED_OFF") {
      if (esp32Client && esp32Client.readyState === WebSocket.OPEN) {
        esp32Client.send(message.toString());
        console.log(`[Command] Forwarding to ESP32: ${message}`);
      }
      return;
    }

    // 3. Handle Video Stream from ESP32
    if (ws === esp32Client) {
      if (lastFrameTime === 0) console.log("[Stream] Video Signal Received ✅");
      lastFrameTime = Date.now();
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message); 
        }
      });
    }
  });

  ws.on("close", () => {
    if (ws === esp32Client) {
      esp32Client = null;
      broadcast({ type: "status", value: "offline" });
      console.log("[WS] ESP32 Connection Closed");
    }
  });
});

server.listen(process.env.PORT || 3000);
