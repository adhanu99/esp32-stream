const express = require("express");
const app = express();

let latestFrame = null;

app.post("/upload", (req, res) => {
  let data = [];

  req.on("data", chunk => data.push(chunk));
  req.on("end", () => {
    latestFrame = Buffer.concat(data);
    res.send("OK");
  });
});

app.get("/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame"
  });

  setInterval(() => {
    if (latestFrame) {
      res.write(--frame\r\nContent-Type: image/jpeg\r\n\r\n);
      res.write(latestFrame);
      res.write("\r\n");
    }
  }, 100);
});

app.listen(3000, () => console.log("Server running"));