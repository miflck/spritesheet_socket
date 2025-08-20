let socket;
let drawing = false;
let prevX, prevY;
let lastMouseX = -1;
let lastMouseY = -1;
let myColor = "#000000"; // Default color until server assigns one
let canvasSettings = { width: 800, height: 600, backgroundColor: "red" };
let drawingSettings = { strokeWeight: 3 };
let uiSettings = { showClientIds: true };
let myCursor;

// Helper function to normalize coordinates
function normalizeCoords(x, y) {
  return {
    x: map(x, 0, width, 0, 1),
    y: map(y, 0, height, 0, 1),
  };
}
31;

// Helper function to denormalize coordinates (for receiving from server)
function denormalizeCoords(normalizedX, normalizedY) {
  return {
    x: map(normalizedX, 0, 1, 0, width),
    y: map(normalizedY, 0, 1, 0, height),
  };
}

function setup() {
  // Create canvas using default settings first
  let canvas = createCanvas(100, 100);
  canvas.parent("canvasContainer");

  // Set background - convert hex to P5.js format
  background(canvasSettings.backgroundColor);
  let v = createVector(width / 2, height / 2);
  myCursor = new CursorCircle(v, 20, "red");

  // Prevent default touch behavior on canvas
  canvas.elt.addEventListener(
    "touchstart",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  canvas.elt.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  canvas.elt.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  // Initialize socket connection
  socket = io();

  // Listen for assigned color and settings from server
  socket.on("assigned-color", (data) => {
    myColor = data.color;
    // Update settings from server if provided
    if (data.canvasSettings) {
      canvasSettings = data.canvasSettings;
      console.log("Canvas settings:", canvasSettings);
      // Resize canvas if settings changed
      resizeCanvas(eval(canvasSettings.width), eval(canvasSettings.height));
      background(canvasSettings.backgroundColor);
    }
    if (data.drawingSettings) {
      drawingSettings = data.drawingSettings;
    }
    if (data.uiSettings) {
      uiSettings = data.uiSettings;
    }

    console.log("Assigned color:", myColor);
    console.log("Canvas settings2:", data.canvasSettings);
    background(canvasSettings.backgroundColor);

    console.log("Drawing canvas initialized");
    let v = createVector(width / 2, height / 2);
    myCursor = new CursorCircle(v, 50, myColor);
  });
}

function draw() {
  // Only render cursor if initialized
  background(canvasSettings.backgroundColor);
  if (myCursor) {
    myCursor.render();
  }
}

function mouseMoved() {
  // Update cursor position
  if (myCursor) {
    myCursor.updatePosition(createVector(mouseX, mouseY));
  }

  // Only send cursor position if mouse actually moved and is within canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
      const normalized = normalizeCoords(mouseX, mouseY);
      socket.emit("cursor-position", {
        x: normalized.x,
        y: normalized.y,
      });
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      myCursor.updatePosition(createVector(mouseX, mouseY));
    }
  }
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    drawing = true;
    prevX = mouseX;
    prevY = mouseY;
  }
}

function mouseDragged() {
  if (drawing && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Draw locally with assigned color and settings
    stroke(myColor);
    strokeWeight(drawingSettings.strokeWeight);
    line(prevX, prevY, mouseX, mouseY);

    // Normalize coordinates before sending
    const normalizedPrev = normalizeCoords(prevX, prevY);
    const normalizedCurrent = normalizeCoords(mouseX, mouseY);

    // Send normalized drawing data to server
    socket.emit("drawing", {
      x1: normalizedPrev.x,
      y1: normalizedPrev.y,
      x2: normalizedCurrent.x,
      y2: normalizedCurrent.y,
      weight: drawingSettings.strokeWeight,
    });

    // Update previous position
    prevX = mouseX;
    prevY = mouseY;
  }
  // Update cursor position while dragging
  if (myCursor) {
    myCursor.updatePosition(createVector(mouseX, mouseY));
  }
}

function mouseReleased() {
  drawing = false;
}

// Handle clear canvas
function keyPressed() {
  // Clear canvas on spacebar
  if (key === " ") {
    background(canvasSettings.backgroundColor);
    socket.emit("clear");
  }
}

// Handle touch events for mobile
function touchMoved() {
  // Send cursor position for touch
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
      const normalized = normalizeCoords(mouseX, mouseY);
      socket.emit("cursor-position", {
        x: normalized.x,
        y: normalized.y,
      });
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }

    // Handle drawing on touch drag
    if (drawing) {
      stroke(myColor);
      strokeWeight(drawingSettings.strokeWeight);
      line(prevX, prevY, mouseX, mouseY);

      // Normalize coordinates before sending
      const normalizedPrev = normalizeCoords(prevX, prevY);
      const normalizedCurrent = normalizeCoords(mouseX, mouseY);

      socket.emit("drawing", {
        x1: normalizedPrev.x,
        y1: normalizedPrev.y,
        x2: normalizedCurrent.x,
        y2: normalizedCurrent.y,
        weight: drawingSettings.strokeWeight,
      });

      prevX = mouseX;
      prevY = mouseY;
    }
  }

  // Update cursor position while dragging
  if (myCursor) {
    myCursor.updatePosition(createVector(mouseX, mouseY));
  }

  // Prevent default scrolling behavior
  return false;
}

function touchStarted() {
  // Only handle touch if within canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    drawing = true;
    prevX = mouseX;
    prevY = mouseY;
    return false; // Prevent default
  }
}

function touchEnded() {
  drawing = false;
  return false; // Prevent default
}

class CursorCircle {
  constructor(position, radius = 20, color = "white") {
    this.position = position.copy();
    this.radius = radius;
    this.color = color;
    this.triangleSize = radius * 0.4;
    this.triangleDistance = radius * 1.5;

    // Triangle animation properties
    this.startTime = millis();
    this.blinkStarted = false;
    this.triangleOpacity = 0;
    this.fadeSpeed = 7; // How fast triangles fade in/out
    this.fadingIn = true; // Track if we're fading in or out
  }

  updateTriangles() {
    let elapsed = millis() - this.startTime;

    // Start blinking after 3 seconds
    if (elapsed < 5000 && !this.blinkStarted) {
      this.blinkStarted = true;
      this.triangleOpacity = 0;
      this.fadingIn = true;
    }

    // Start blinking after 3 seconds
    if (elapsed > 5000 && this.blinkStarted) {
      this.blinkStarted = false;
      this.triangleOpacity = 0;
      this.fadingIn = false;
    }

    // Create blinking effect (fade in and out cyclically)
    if (this.blinkStarted) {
      if (this.fadingIn) {
        this.triangleOpacity += this.fadeSpeed;
        if (this.triangleOpacity >= 255) {
          this.triangleOpacity = 255;
          this.fadingIn = false; // Switch to fading out
        }
      } else {
        this.triangleOpacity -= this.fadeSpeed;
        if (this.triangleOpacity <= 0) {
          this.triangleOpacity = 0;
          this.fadingIn = true; // Switch to fading in
        }
      }

      // Clamp opacity to valid range
      this.triangleOpacity = constrain(this.triangleOpacity, 0, 255);
    }
  }

  renderTriangles() {
    if (this.triangleOpacity <= 0) return;

    push();
    fill(red(this.color), green(this.color), blue(this.color), this.triangleOpacity);
    noStroke();

    let x = this.position.x;
    let y = this.position.y;
    let size = this.triangleSize;
    let dist = this.triangleDistance;

    // Right triangle (pointing left toward center)
    triangle(x + dist + size, y, x + dist, y - size / 2, x + dist, y + size / 2);

    // Left triangle (pointing right toward center)
    triangle(x - dist - size, y, x - dist, y - size / 2, x - dist, y + size / 2);

    // Top triangle (pointing down toward center)
    triangle(x, y - dist - size, x - size / 2, y - dist, x + size / 2, y - dist);

    // Bottom triangle (pointing up toward center)
    triangle(x, y + dist + size, x - size / 2, y + dist, x + size / 2, y + dist);

    pop();
  }

  updatePosition(position) {
    this.position = position.copy();
  }

  render() {
    this.updateTriangles();

    push();
    fill(this.color + 99);
    noStroke();
    circle(this.position.x, this.position.y, this.radius * 2);

    fill(this.color);
    circle(this.position.x, this.position.y, this.radius * 1.5);
    pop();

    // Render triangles
    this.renderTriangles();
  }
}

// Optional: Listen for drawing data from other clients (if needed)
// You would denormalize the coordinates when receiving them
socket.on("drawing", (data) => {
  const denormalizedStart = denormalizeCoords(data.x1, data.y1);
  const denormalizedEnd = denormalizeCoords(data.x2, data.y2);

  stroke(data.color || "#000000");
  strokeWeight(data.weight || 3);
  line(denormalizedStart.x, denormalizedStart.y, denormalizedEnd.x, denormalizedEnd.y);
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
