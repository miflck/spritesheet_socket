const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Load settings from JSON file
let settings;
try {
  const settingsData = fs.readFileSync("public/settings.json", "utf8");
  settings = JSON.parse(settingsData);
  console.log("Settings loaded successfully");
} catch (error) {
  console.error("Error loading settings.json:", error.message);
  console.log("Using default settings");
  // Fallback default settings
  settings = {
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"],
    server: { port: 3000, enableLogging: true },
  };
}

// Store client colors and their indices
const clientColors = new Map();
const clientColorIndices = new Map();

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
  if (settings.server.enableLogging) {
    console.log("User connected:", socket.id);
  }

  // Assign a random color to new client
  const colorIndex = Math.floor(Math.random() * settings.colors.length);
  const randomColor = settings.colors[colorIndex];
  clientColors.set(socket.id, randomColor);
  clientColorIndices.set(socket.id, colorIndex);

  // Send the assigned color, color index, and canvas settings to the client
  socket.emit("assigned-color", {
    color: randomColor,
    colorIndex: colorIndex,
    canvasSettings: settings.canvas || null,
    drawingSettings: settings.drawing || null,
    uiSettings: settings.ui || null,
  });

  if (settings.server.enableLogging) {
    console.log(`Assigned color ${randomColor} (index ${colorIndex}) to client ${socket.id}`);
  }

  // Handle drawing data
  socket.on("drawing", (data) => {
    // Add client ID and their assigned color to the drawing data
    data.clientId = socket.id;
    data.color = clientColors.get(socket.id) || "#000000";
    data.colorIndex = clientColorIndices.get(socket.id) || 0;
    // Broadcast to display clients only
    io.to("display").emit("drawing", data);
  });

  // Handle mouse/touch position updates
  socket.on("cursor-position", (data) => {
    // Add client ID and their assigned color
    data.clientId = socket.id;
    data.color = clientColors.get(socket.id) || "#000000";
    data.colorIndex = clientColorIndices.get(socket.id) || 0;
    io.to("display").emit("cursor-position", data);
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
    if (settings.server.enableLogging) {
      console.log("User disconnected:", socket.id);
    }
    // Remove client color and index from memory
    clientColors.delete(socket.id);
    clientColorIndices.delete(socket.id);
    // Tell display clients to remove this cursor
    io.to("display").emit("client-disconnected", { clientId: socket.id });
  });
});

const PORT = process.env.PORT || settings.server.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Available colors: ${settings.colors.length}`);
  console.log(`Canvas size: ${settings.canvas.width}x${settings.canvas.height}`);
});
