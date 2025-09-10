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

// Store client colors and their indices per room
const clientColors = new Map();
const clientColorIndices = new Map();
const clientRooms = new Map(); // Track which room each client is in

// Serve static files from public directory
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/index2", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index2.html"));
});

app.get("/display", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "display.html"));
});

app.get("/display2", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "display2.html"));
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  if (settings.server.enableLogging) {
    console.log("User connected:", socket.id);
  }

  // Handle joining a drawing room
  socket.on("join-drawing-room", (roomId) => {
    const drawingRoom = roomId || "room1"; // Default to room1
    socket.join(drawingRoom);
    clientRooms.set(socket.id, drawingRoom);

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
      console.log(
        `Client ${socket.id} joined drawing room ${drawingRoom} with color ${randomColor} (index ${colorIndex})`
      );
    }
  });

  // Handle joining a display room
  socket.on("join-display-room", (roomId) => {
    const displayRoom = roomId || "display"; // Default to 'display'
    socket.join(displayRoom);
    clientRooms.set(socket.id, displayRoom);
    console.log(`Client ${socket.id} joined display room: ${displayRoom}`);
  });

  // Handle drawing data
  socket.on("drawing", (data) => {
    const clientRoom = clientRooms.get(socket.id);
    if (!clientRoom) return;

    // Add client ID and their assigned color to the drawing data
    data.clientId = socket.id;
    data.color = clientColors.get(socket.id) || "#000000";
    data.colorIndex = clientColorIndices.get(socket.id) || 0;

    // Determine which display room to send to based on drawing room
    let targetDisplayRoom = "display"; // Default
    if (clientRoom === "room2") {
      targetDisplayRoom = "display2";
    }

    // Broadcast to the appropriate display room
    io.to(targetDisplayRoom).emit("drawing", data);
  });

  // Handle mouse/touch position updates
  socket.on("cursor-position", (data) => {
    const clientRoom = clientRooms.get(socket.id);
    if (!clientRoom) return;

    // Add client ID and their assigned color
    data.clientId = socket.id;
    data.color = clientColors.get(socket.id) || "#000000";
    data.colorIndex = clientColorIndices.get(socket.id) || 0;

    // Determine which display room to send to based on drawing room
    let targetDisplayRoom = "display";
    if (clientRoom === "room2") {
      targetDisplayRoom = "display2";
    }

    io.to(targetDisplayRoom).emit("cursor-position", data);
  });

  // Handle clear canvas
  socket.on("clear", () => {
    const clientRoom = clientRooms.get(socket.id);
    if (!clientRoom) return;

    // Determine which display room to send to based on drawing room
    let targetDisplayRoom = "display";
    if (clientRoom === "room2") {
      targetDisplayRoom = "display2";
    }

    io.to(targetDisplayRoom).emit("clear");
  });

  // Legacy support for old join-display event (maps to display room)
  socket.on("join-display", () => {
    socket.join("display");
    clientRooms.set(socket.id, "display");
    console.log("Client joined display room:", socket.id);
  });

  socket.on("disconnect", () => {
    if (settings.server.enableLogging) {
      console.log("User disconnected:", socket.id);
    }

    const clientRoom = clientRooms.get(socket.id);

    // Remove client color and index from memory
    clientColors.delete(socket.id);
    clientColorIndices.delete(socket.id);
    clientRooms.delete(socket.id);

    // Tell appropriate display clients to remove this cursor
    if (clientRoom && (clientRoom === "room1" || clientRoom === "room2")) {
      let targetDisplayRoom = "display";
      if (clientRoom === "room2") {
        targetDisplayRoom = "display2";
      }
      io.to(targetDisplayRoom).emit("client-disconnected", { clientId: socket.id });
    }
  });
});

const PORT = process.env.PORT || settings.server.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Available colors: ${settings.colors.length}`);
  console.log(`Canvas size: ${settings.canvas?.width}x${settings.canvas?.height}`);
  console.log("Room mapping:");
  console.log("  / (index.html) -> room1 -> display (/display)");
  console.log("  /index2 -> room2 -> display2 (/display2)");
});
