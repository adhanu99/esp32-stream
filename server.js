const express = require("express");
const app = express();

// Store latest frame
let latestFrame = null;

// Health check (important for Render)
app.get("/", (req, res) => {
  res.send("ESP32 Stream Server Running 🚀");
});

// Receive image from ESP32
app.post("/upload", (req, res) => {
  let chunks = [];

  req.on("data", chunk => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    latestFrame = Buffer.concat(chunks);
    res.status(200).send("OK");
  });

  req.on("error", err => {
    console.error("Upload error:", err);
    res.sendStatus(500);
  });
});

// Stream endpoint
app.get("/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Pragma": "no-cache"
  });

  const interval = setInterval(() => {
    if (latestFrame) {
      try {
        res.write("--frame\r\n");
        res.write("Content-Type: image/jpeg\r\n\r\n");
        res.write(latestFrame);
        res.write("\r\n");
      } catch (err) {
        console.log("Client disconnected");
        clearInterval(interval);
      }
    }
  }, 100); // ~10 FPS

  req.on("close", () => {
    clearInterval(interval);
    console.log("Stream closed");
  });
});

// Use Render PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
