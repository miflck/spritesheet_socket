/**
 * Multi-Client Dragon Display System
 * Main display client that shows dragons following cursor movements from connected clients
 */

// Global state
let socket;
let statusElement;
let dragons = {};
let settings;
let images = [];
let manifest;

/**
 * Preload assets and configuration
 */
function preload() {
  settings = loadJSON("settings.json");
  manifest = loadJSON("assets/manifest.json");
}

/**
 * Initialize the display canvas and socket connections
 */
function setup() {
  _initializeAssets();
  _initializeCanvas();
  _initializeUI();
  _initializeSocket();

  console.log("Display view initialized");
}

/**
 * Main animation loop - updates and renders all dragons
 */
function draw() {
  background(settings.canvas.backgroundColor);
  _updateAndDrawDragons();
}

// =====================================
// INITIALIZATION METHODS
// =====================================

/**
 * Load all dragon head images from manifest
 */
function _initializeAssets() {
  for (let filename of manifest.images) {
    let img = loadImage("assets/" + filename);
    images.push(img);
  }
  console.log(`Loaded ${images.length} dragon head images`);
}

/**
 * Create and configure the display canvas
 */
function _initializeCanvas() {
  let canvas = createCanvas(settings.canvas.displayWidth, settings.canvas.displayHeight);
  canvas.parent("canvasContainer");
  background(settings.canvas.backgroundColor);
}

/**
 * Initialize UI elements and status display
 */
function _initializeUI() {
  statusElement = document.getElementById("status");
  _updateStatus("Initializing...", "#f0f0f0");
}

/**
 * Set up socket connection and event handlers
 */
function _initializeSocket() {
  socket = io();
  socket.emit("join-display");

  _setupConnectionHandlers();
  _setupClientDataHandlers();
  _setupCanvasHandlers();
}

// =====================================
// SOCKET EVENT HANDLERS
// =====================================

/**
 * Set up connection status event handlers
 */
function _setupConnectionHandlers() {
  socket.on("connect", () => {
    _updateStatus("Connected - Listening for dragons...", "#e8f5e8");
    console.log("Connected to server as display client");
  });

  socket.on("disconnect", () => {
    _updateStatus("Disconnected from server", "#f5e8e8");
    _clearAllDragons();
  });

  socket.on("client-disconnected", (data) => {
    _removeDragon(data.clientId);
  });
}

/**
 * Set up handlers for client drawing and cursor data
 */
function _setupClientDataHandlers() {
  // Handle drawing strokes from clients
  socket.on("drawing", (data) => {
    _handleClientMovement(data.clientId, data.color, data.x1, data.y1);
  });

  // Handle cursor position updates from clients
  socket.on("cursor-position", (data) => {
    _handleClientMovement(data.clientId, data.color, data.x, data.y);
  });
}

/**
 * Set up canvas-related event handlers
 */
function _setupCanvasHandlers() {
  socket.on("clear", () => {
    background(settings.canvas.backgroundColor);
    _updateStatus("Canvas cleared by drawing client", "#fff3cd");

    setTimeout(() => {
      _updateStatus("Connected - Listening for dragons...", "#e8f5e8");
    }, settings.ui.clearStatusDelay);
  });
}

// =====================================
// DRAGON MANAGEMENT
// =====================================

/**
 * Handle movement data from any client (drawing or cursor)
 */
function _handleClientMovement(clientId, color, normalizedX, normalizedY) {
  // Create dragon if it doesn't exist for this client
  if (!dragons[clientId]) {
    _createDragon(clientId, color);
  }

  // Convert normalized coordinates to canvas pixels and update dragon
  const pixelCoords = _denormalizeCoords(normalizedX, normalizedY);
  dragons[clientId].updateTarget(pixelCoords.x, pixelCoords.y);
}

/**
 * Create a new dragon instance for a client
 */
function _createDragon(clientId, color) {
  const randomHead = random(images);
  dragons[clientId] = new Dragon(clientId, color, randomHead, settings.dragon);
  console.log(`Created dragon for client ${clientId}`);
}

/**
 * Remove a specific dragon by client ID
 */
function _removeDragon(clientId) {
  if (dragons[clientId]) {
    delete dragons[clientId];
    console.log(`Removed dragon for client ${clientId}`);
  }
}

/**
 * Clear all dragons (used on disconnect)
 */
function _clearAllDragons() {
  dragons = {};
  console.log("Cleared all dragons");
}

/**
 * Update and draw all active dragons
 */
function _updateAndDrawDragons() {
  const clientIds = Object.keys(dragons);

  for (let clientId of clientIds) {
    const dragon = dragons[clientId];

    // Remove inactive dragons
    if (dragon.isInactive(settings.server.cursorInactiveTimeout)) {
      _removeDragon(clientId);
      continue;
    }

    // Update dragon physics and render
    dragon.update();
    dragon.draw();

    // Optionally draw client ID labels
    if (settings.ui.showClientIds && dragon.isActive) {
      _drawClientLabel(dragon, clientId);
    }
  }
}

/**
 * Draw client ID label near dragon head
 */
function _drawClientLabel(dragon, clientId) {
  const headPosition = dragon.getHeadPosition();
  const labelText = `ID: ${clientId.substring(0, settings.ui.clientIdLength)}`;

  push();
  fill(dragon.color);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(12);
  text(labelText, headPosition.x + 15, headPosition.y - 5);
  pop();
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Update status display with message and background color
 */
function _updateStatus(message, backgroundColor) {
  statusElement.textContent = message;
  statusElement.style.backgroundColor = backgroundColor;
}

/**
 * Convert normalized coordinates (0-1) to canvas pixel coordinates
 */
function _denormalizeCoords(normalizedX, normalizedY) {
  return {
    x: map(normalizedX, 0, 1, 0, width),
    y: map(normalizedY, 0, 1, 0, height),
  };
}

// =====================================
// INPUT BLOCKING (Display-only mode)
// =====================================

/**
 * Disable all mouse interactions for display-only mode
 */
function mousePressed() {
  return false;
}
function mouseDragged() {
  return false;
}
function mouseReleased() {
  return false;
}

/**
 * Disable keyboard interactions for display-only mode
 */
function keyPressed() {
  return false;
}
