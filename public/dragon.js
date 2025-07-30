class Dragon {
  constructor(clientId, color, options = {}) {
    this.clientId = clientId;
    this.color = color;

    // Dragon configuration
    this.segNum = options.segNum || 20;
    this.segLength = options.segLength || 18;
    this.strokeWeight = options.strokeWeight || 9;
    this.opacity = options.opacity || 100;

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
  isInactive(timeoutMs = 3000) {
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
    for (let i = 0; i < this.x.length; i++) {
      if (i < this.x.length - 1) {
        // Calculate angle for this segment
        //const dx = this.x[i] - this.x[i + 1];
        //const dy = this.y[i] - this.y[i + 1];
        //const angle = atan2(dy, dx);
        // this.drawSegment(i, this.x[i], this.y[i]);
      }
    }

    // Draw dragon head (optional - a small circle)
    fill(this.color);
    // noStroke();
    ellipse(this.targetX, this.targetY, this.strokeWeight * 1.5);

    pop();
  }

  // Internal method to drag a segment
  dragSegment(i, xin, yin) {
    const dx = xin - this.x[i];
    const dy = yin - this.y[i];
    const angle = atan2(dy, dx);
    this.x[i] = xin - cos(angle) * this.segLength;
    this.y[i] = yin - sin(angle) * this.segLength;
    this.drawSegment(this.x[i], this.y[i], angle);
  }

  // Internal method to draw a single segment
  drawSegment(x, y, angle) {
    push();
    // Set dragon appearance
    strokeWeight(this.strokeWeight);
    stroke(this.color + this.opacity.toString(16).padStart(2, "0")); // Add opacity to colo
    translate(x, y);
    rotate(angle);
    line(0, 0, this.segLength, 0);
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
