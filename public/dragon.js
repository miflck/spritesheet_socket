class Dragon {
  constructor(clientId, color, head, options = {}) {
    this.clientId = clientId;
    this.color = color;
    this.head = head;

    // Dragon configuration
    this.segNum = options.segNum || 20;
    this.segLength = options.segLength || 18;
    this.strokeWeight = options.strokeWeight || 9;
    this.opacity = options.opacity || 100;
    this.timeOut = options.timeOut || 3000;
    this.headSize = options.headSize || 100;
    // Initialize segment positions
    this.x = [];
    this.y = [];
    for (let i = 0; i < this.segNum; i++) {
      this.x[i] = 0;
      this.y[i] = 0;
    }

    // Target position (where the dragon should follow)
    this.targetX = 0;
    this.targetY = 0;

    // Dragon state
    this.isActive = false;
    this.lastUpdate = Date.now();
  }

  // Update target position (called when cursor moves)
  updateTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  // Check if dragon should be considered inactive
  isInactive(timeoutMs = this.timeOut) {
    return Date.now() - this.lastUpdate > timeoutMs;
  }

  // Update and draw the dragon
  update() {
    if (!this.isActive) return;

    // Move the head segment toward the target
    this.dragSegment(0, this.targetX, this.targetY);

    // Each subsequent segment follows the one before it
    for (let i = 0; i < this.x.length - 1; i++) {
      this.dragSegment(i + 1, this.x[i], this.y[i]);
    }
  }

  // Draw the dragon
  draw() {
    if (!this.isActive) return;
    push();
    // Set dragon appearance
    strokeWeight(this.strokeWeight);
    stroke(this.color + this.opacity.toString(16).padStart(2, "0")); // Add opacity to color
    //Draw each segment
    this.drawSegments();
    // Draw dragon head (optional - a small circle)
    fill(this.color);
    noStroke();
    ellipse(this.targetX, this.targetY, this.strokeWeight * 1.5);
    push();
    translate(this.targetX, this.targetY);
    const dx = this.x[0] - this.targetX;
    const dy = this.y[0] - this.targetY;
    let angle = atan2(dy, dx);
    // Check if dragging to the right (dx < 0 means target is to the right of current position)
    const flipImage = dx < 0;
    if (flipImage) {
      scale(-1, 1); // Flip horizontally
      angle = PI - angle; // or you could use: angle = -angle + PI
    }
    rotate(angle);

    image(this.head, -this.headSize / 2, -this.headSize / 2, this.headSize, this.headSize);
    pop();
    pop();
  }

  // Internal method to drag a segment
  dragSegment(i, xin, yin) {
    const dx = xin - this.x[i];
    const dy = yin - this.y[i];
    const angle = atan2(dy, dx);
    this.x[i] = xin - cos(angle) * this.segLength;
    this.y[i] = yin - sin(angle) * this.segLength;
  }

  drawSegments() {
    push();

    strokeWeight(this.strokeWeight);
    stroke(this.color + this.opacity.toString(16).padStart(2, "0"));
    line(this.targetX, this.targetY, this.x[0], this.y[0]);
    for (let i = 0; i < this.x.length; i++) {
      line(this.x[i], this.y[i], this.x[i + 1], this.y[i + 1]);
    }
    pop();
  }

  // Set dragon as inactive
  deactivate() {
    this.isActive = false;
  }

  // Get dragon info for debugging
  getInfo() {
    return {
      clientId: this.clientId,
      color: this.color,
      segNum: this.segNum,
      isActive: this.isActive,
      headPosition: { x: this.x[0], y: this.y[0] },
    };
  }
}
