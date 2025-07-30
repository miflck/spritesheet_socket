const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/display", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "display.html"));
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle drawing data
  socket.on("drawing", (data) => {
    // Broadcast to display clients only
    socket.broadcast.to("display").emit("drawing", data);
    // Also broadcast to other display clients in case multiple displays
    io.to("display").emit("drawing", data);
  });

  // Handle clear canvas
  socket.on("clear", () => {
    io.to("display").emit("clear");
  });

  // Handle joining display room
  socket.on("join-display", () => {
    socket.join("display");
    console.log("Client joined display room:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
