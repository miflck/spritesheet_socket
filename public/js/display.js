let socket;
let statusElement;
let animals = {}; // Store animal instances for each client
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
  // get all path for any animal images
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

  // Determine which display room to join based on the page
  // Check if ROOM_ID is set in the HTML, otherwise default to 'display'
  const roomId = window.ROOM_ID || "display";

  socket.on("connect", () => {
    console.log(`Connected to server, joining display room: ${roomId}`);
    socket.emit("join-display-room", roomId);
  });

  // Handle connection status
  socket.on("connect", () => {
    if (statusElement) {
      statusElement.textContent = "Connected - Listening for animals...";
      statusElement.style.backgroundColor = "#e8f5e8";
    }
    console.log("Connected to server as display client");
  });

  socket.on("disconnect", () => {
    if (statusElement) {
      statusElement.textContent = "Disconnected from server";
      statusElement.style.backgroundColor = "#f5e8e8";
    }
    animals = {}; // Clear animals on disconnect
  });

  // Listen for drawing data from all drawing clients
  socket.on("drawing", (data) => {
    const clientId = data.clientId;

    // Create animal if it doesn't exist
    if (!animals[clientId]) {
      // Use color index to select sprite sheet, with fallback to first animation if index is out of bounds
      let selectedAnimation;
      if (data.colorIndex !== undefined && data.colorIndex < animations.length) {
        selectedAnimation = animations[data.colorIndex];
        console.log(`Using sprite sheet index ${data.colorIndex} for client ${clientId}`);
      } else {
        selectedAnimation = animations[0] || random(animations); // Fallback to first or random if index invalid
        console.log(`Color index ${data.colorIndex} out of bounds, using fallback for client ${clientId}`);
      }

      animals[clientId] = new Animal(clientId, data.color, selectedAnimation, settings.animal);
      console.log(`Created animal for client ${clientId} with color index ${data.colorIndex}`);
    }

    // Denormalize coordinates before using them
    const denormalized = denormalizeCoords(data.x1, data.y1);

    // Update animal target position with pixel coordinates
    animals[clientId].updateTarget(denormalized.x, denormalized.y);
  });

  // Listen for cursor position updates - create/update animals
  socket.on("cursor-position", (data) => {
    const clientId = data.clientId;

    // Create animal if it doesn't exist
    if (!animals[clientId]) {
      // Use color index to select sprite sheet, with fallback to first animation if index is out of bounds
      let selectedAnimation;
      if (data.colorIndex !== undefined && data.colorIndex < animations.length) {
        selectedAnimation = animations[data.colorIndex];
        console.log(`Using sprite sheet index ${data.colorIndex} for client ${clientId}`);
      } else {
        selectedAnimation = animations[0] || random(animations); // Fallback to first or random if index invalid
        console.log(`Color index ${data.colorIndex} out of bounds, using fallback for client ${clientId}`);
      }

      animals[clientId] = new Animal(clientId, data.color, selectedAnimation, settings.animal);
      console.log(`Created animal for client ${clientId} with color index ${data.colorIndex}`);
    }

    // Denormalize coordinates before using them
    const denormalized = denormalizeCoords(data.x, data.y);

    // Update animal target position with pixel coordinates
    animals[clientId].updateTarget(denormalized.x, denormalized.y);
  });

  // Handle client disconnections - remove animals
  socket.on("client-disconnected", (data) => {
    // Remove animal for disconnected client
    if (animals[data.clientId]) {
      delete animals[data.clientId];
      console.log(`Removed animal for client ${data.clientId}`);
    }
  });

  // Handle clear canvas from drawing clients
  socket.on("clear", () => {
    background(settings.canvas.backgroundColor);
    if (statusElement) {
      statusElement.textContent = "Canvas cleared by drawing client";

      setTimeout(() => {
        statusElement.textContent = "Connected - Listening for drawings...";
      }, settings.ui.clearStatusDelay);
    }
  });

  console.log("Display view initialized");
}

function draw() {
  // Clear background each frame
  background(settings.canvas.backgroundColor);

  // Update and draw all animals
  for (let clientId in animals) {
    let animal = animals[clientId];

    // Remove inactive animals
    if (animal.isInactive(settings.server.cursorInactiveTimeout)) {
      delete animals[clientId];
      console.log(`Removed inactive animal for client ${clientId}`);
      continue;
    }

    // Update animal movement
    animal.update();

    // Draw the animal
    animal.draw();

    // Draw client ID near animal head (optional)
    if (settings.ui.showClientIds && animal.isActive) {
      const headPosition = animal.getHeadPosition();
      push();
      fill(animal.color);
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
