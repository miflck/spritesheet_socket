class Dragon {
  constructor(clientId, color, head, options = {}) {
    // Basic properties
    this.clientId = clientId;
    this.color = color;
    this.head = head;

    // Configuration with defaults
    this.config = {
      segNum: options.segNum || 20,
      segLength: options.segLength || 18,
      strokeWeight: options.strokeWeight || 9,
      opacity: options.opacity || 100,
      timeOut: options.timeOut || 3000,
      headSize: options.headSize || 100,
    };

    // Initialize segments (maintain original property structure)
    this.x = [];
    this.y = [];
    this._initializeSegments();

    // Target and state
    this.targetX = 0;
    this.targetY = 0;
    this.isActive = false;
    this.lastUpdate = Date.now();
  }

  // Public methods
  updateTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  isInactive(timeoutMs = this.config.timeOut) {
    return Date.now() - this.lastUpdate > timeoutMs;
  }

  update() {
    if (!this.isActive) return;

    this._updateSegmentChain();
  }

  draw() {
    if (!this.isActive) return;

    push();
    this._drawBody();
    this._drawHead();
    pop();
  }

  deactivate() {
    this.isActive = false;
  }

  getInfo() {
    return {
      clientId: this.clientId,
      color: this.color,
      segNum: this.config.segNum,
      isActive: this.isActive,
      headPosition: { x: this.x[0], y: this.y[0] },
    };
  }

  getHeadPosition() {
    return { x: this.x[0], y: this.y[0] };
  }

  // Private methods
  _initializeSegments() {
    for (let i = 0; i < this.config.segNum; i++) {
      this.x[i] = 0;
      this.y[i] = 0;
    }
  }

  _updateSegmentChain() {
    // Move head segment toward target
    this._dragSegment(0, this.targetX, this.targetY);

    // Each subsequent segment follows the previous one
    for (let i = 0; i < this.x.length - 1; i++) {
      this._dragSegment(i + 1, this.x[i], this.y[i]);
    }
  }

  _dragSegment(index, targetX, targetY) {
    const dx = targetX - this.x[index];
    const dy = targetY - this.y[index];
    const angle = atan2(dy, dx);

    this.x[index] = targetX - cos(angle) * this.config.segLength;
    this.y[index] = targetY - sin(angle) * this.config.segLength;
  }

  _drawBody() {
    const colorWithOpacity = this.color + this._getOpacityHex();

    strokeWeight(this.config.strokeWeight);
    stroke(colorWithOpacity);
    noFill();

    // Draw line from target to first segment
    line(this.targetX, this.targetY, this.x[0], this.y[0]);

    // Draw lines between segments
    for (let i = 0; i < this.x.length - 1; i++) {
      line(this.x[i], this.y[i], this.x[i + 1], this.y[i + 1]);
    }
  }

  _drawHead() {
    // Draw head base
    fill(this.color);
    noStroke();
    ellipse(this.targetX, this.targetY, this.config.strokeWeight * 1.5);

    // Draw head image with rotation and flipping
    push();
    translate(this.targetX, this.targetY);

    const { angle, shouldFlip } = this._calculateHeadOrientation();

    if (shouldFlip) {
      scale(-1, 1);
    }

    rotate(angle);
    image(this.head, -this.config.headSize / 2, -this.config.headSize / 2, this.config.headSize, this.config.headSize);
    pop();
  }

  _calculateHeadOrientation() {
    const dx = this.x[0] - this.targetX;
    const dy = this.y[0] - this.targetY;
    let angle = atan2(dy, dx);

    const shouldFlip = dx < 0;
    if (shouldFlip) {
      angle = PI - angle;
    }

    return { angle, shouldFlip };
  }

  _getOpacityHex() {
    return this.config.opacity.toString(16).padStart(2, "0");
  }
}
