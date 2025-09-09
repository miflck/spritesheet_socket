let socket;
let statusElement;
let dragons = {}; // Store dragon instances for each client
let settings;

let images = [];
let manifest;

let spriteSheets = []; // Store all sprite sheets
let animations = []; // Store all animations
let mySprite;
let anim;

function preload() {
  console.log("******** Preloading assets...********");
  settings = loadJSON("settings.json");
  // get all path for any dragon images
  manifest = loadJSON("assets/manifest.json");
  mySprite = createSpritesheet("assets/butterfly_1_blue.png", 9, 1);
}

function setup() {
  // Load all PNG images from the manifest
  for (let filename of manifest.images) {
    let spriteSheet = createSpritesheet("assets/" + filename, 9, 1); // Adjust dimensions as needed
    spriteSheets.push(spriteSheet);

    let animation = createSpriteAnimation(spriteSheet); // Adjust frame sequence and speed
    animations.push(animation);
    console.log(`------Loaded sprite sheet and animation: ${filename}`);
  }

  anim = createSpriteAnimation(mySprite);

  console.log(`Loaded ${spriteSheets.length} sprite sheets and animations`);
  // Create canvas using default settings (will be updated when clients send settings)
  let canvas = createCanvas(settings.canvas.displayWidth, settings.canvas.displayHeight);
  canvas.parent("canvasContainer");

  // Set background
  background(settings.canvas.backgroundColor);

  // Get status element
  statusElement = document.getElementById("status");

  // Initialize socket connection
  socket = io();

  // Join the display room
  socket.emit("join-display");

  // Handle connection status
  socket.on("connect", () => {
    statusElement.textContent = "Connected - Listening for dragons...";
    statusElement.style.backgroundColor = "#e8f5e8";
    console.log("Connected to server as display client");
  });

  socket.on("disconnect", () => {
    statusElement.textContent = "Disconnected from server";
    statusElement.style.backgroundColor = "#f5e8e8";
    dragons = {}; // Clear dragons on disconnect
  });

  // Listen for drawing data from all drawing clients
  socket.on("drawing", (data) => {
    const clientId = data.clientId;

    // Create dragon if it doesn't exist
    if (!dragons[clientId]) {
      let randomAnimation = random(animations);

      dragons[clientId] = new Dragon(clientId, data.color, randomAnimation, settings.dragon);
      console.log(`Created dragon for client ${clientId}`);
    }

    // Denormalize coordinates before using them
    const denormalized = denormalizeCoords(data.x1, data.y1);

    // Update dragon target position with pixel coordinates
    dragons[clientId].updateTarget(denormalized.x, denormalized.y);
  });

  // Listen for cursor position updates - create/update dragons
  socket.on("cursor-position", (data) => {
    const clientId = data.clientId;

    // Create dragon if it doesn't exist
    if (!dragons[clientId]) {
      // Get random animation
      let randomAnimation = random(animations);
      dragons[clientId] = new Dragon(clientId, data.color, randomAnimation, settings.dragon);
      console.log(`Created dragon for client ${clientId} with random animation`);
    }

    // Denormalize coordinates before using them
    const denormalized = denormalizeCoords(data.x, data.y);

    // Update dragon target position with pixel coordinates
    dragons[clientId].updateTarget(denormalized.x, denormalized.y);
  });

  // Handle client disconnections - remove dragons
  socket.on("client-disconnected", (data) => {
    // Remove dragon for disconnected client
    if (dragons[data.clientId]) {
      delete dragons[data.clientId];
      console.log(`Removed dragon for client ${data.clientId}`);
    }
  });

  // Handle clear canvas from drawing clients
  socket.on("clear", () => {
    background(settings.canvas.backgroundColor);
    statusElement.textContent = "Canvas cleared by drawing client";

    setTimeout(() => {
      statusElement.textContent = "Connected - Listening for drawings...";
    }, settings.ui.clearStatusDelay);
  });

  console.log("Display view initialized");
}

function draw() {
  // Clear background each frame
  background(settings.canvas.backgroundColor);

  // Update and draw all dragons
  for (let clientId in dragons) {
    let dragon = dragons[clientId];

    // Remove inactive dragons
    if (dragon.isInactive(settings.server.cursorInactiveTimeout)) {
      delete dragons[clientId];
      console.log(`Removed inactive dragon for client ${clientId}`);
      continue;
    }

    // Update dragon movement
    dragon.update();

    // Draw the dragon
    dragon.draw();

    // Draw client ID near dragon head (optional)
    if (settings.ui.showClientIds && dragon.isActive) {
      const headPosition = dragon.getHeadPosition();
      push();
      fill(dragon.color);
      noStroke();
      textAlign(LEFT, BOTTOM);
      textSize(12);
      text("ID: " + clientId.substring(0, settings.ui.clientIdLength), headPosition.x + 15, headPosition.y - 5);
      pop();
    }
  }
}

// Disable all mouse interactions
function mousePressed() {
  return false;
}

function mouseDragged() {
  return false;
}

function mouseReleased() {
  return false;
}

// Disable keyboard interactions
function keyPressed() {
  return false;
}

// Helper function to denormalize coordinates (convert from 0-1 to canvas pixels)
function denormalizeCoords(normalizedX, normalizedY) {
  return {
    x: map(normalizedX, 0, 1, 0, width),
    y: map(normalizedY, 0, 1, 0, height),
  };
}
