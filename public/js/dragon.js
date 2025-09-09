class Dragon {
  constructor(clientId, color, animation, options = {}) {
    // Basic properties
    this.clientId = clientId;
    this.color = color;
    this.animation = animation;

    // Configuration with defaults
    this.config = {
      segNum: options.segNum || 20,
      segLength: options.segLength || 18,
      strokeWeight: options.strokeWeight || 9, // This becomes maxStrokeWeight for backward compatibility
      maxStrokeWeight: options.maxStrokeWeight || options.strokeWeight || 9, // Thickest at head
      minStrokeWeight: options.minStrokeWeight || 9,
      opacity: options.opacity || 100,
      timeOut: options.timeOut || 3000,
      headSize: options.headSize || 100,
      easing: options.easing || 0.05, // Simple easing factor
      segmentEasing: options.segmentEasing || 0.5,
    };

    // Initialize segments (maintain original property structure)
    this.x = [];
    this.y = [];
    this._initializeSegments();

    // Simple position and target
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.angle = 0;

    // State
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
    // Update the animation
    if (this.animation) {
      this.animation.update();
    }

    // Simple easing toward target
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    this.angle = atan2(dy, dx);

    this.x += dx * this.config.easing;
    this.y += dy * this.config.easing;

    // Update segment chain using current position
    this._updateSegmentChain();
  }

  draw() {
    if (!this.isActive) return;

    push();
    //this._drawBody();
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
      headPosition: { x: this.segX[0], y: this.segY[0] },
      currentPosition: { x: this.x, y: this.y },
      targetPosition: { x: this.targetX, y: this.targetY },
      angle: this.angle,
      maxStrokeWeight: this.config.maxStrokeWeight,
      minStrokeWeight: this.config.minStrokeWeight,
    };
  }

  getHeadPosition() {
    return { x: this.segX[0], y: this.segY[0] };
  }

  // Private methods
  _initializeSegments() {
    this.segX = [];
    this.segY = [];
    for (let i = 0; i < this.config.segNum; i++) {
      this.segX[i] = 0;
      this.segY[i] = 0;
    }
  }

  _updateSegmentChain() {
    // Move head segment toward current position
    this._dragSegment(0, this.x, this.y);

    // Each subsequent segment follows the previous one
    for (let i = 0; i < this.segX.length - 1; i++) {
      this._dragSegment(i + 1, this.segX[i], this.segY[i]);
    }
  }

  _dragSegment(index, targetX, targetY) {
    const dx = targetX - this.segX[index];
    const dy = targetY - this.segY[index];
    const angle = atan2(dy, dx);

    const idealX = targetX - cos(angle) * this.config.segLength;
    const idealY = targetY - sin(angle) * this.config.segLength;

    // Make segments further from head more flexible
    const flexibility = this.config.segmentEasing + index * 0.01; // Tail is more flexible

    this.segX[index] = lerp(this.segX[index], idealX, flexibility);
    this.segY[index] = lerp(this.segY[index], idealY, flexibility);
  }

  _getStrokeWeightForSegment(segmentIndex) {
    // Calculate progress from head (0) to tail (1)
    const progress = segmentIndex / (this.segX.length - 1);

    // Interpolate between max and min stroke weight
    return lerp(this.config.maxStrokeWeight, this.config.minStrokeWeight, progress);
  }

  _drawBody() {
    const colorWithOpacity = this.color + this._getOpacityHex();
    noFill();
    stroke(colorWithOpacity);

    // Draw line from current position to first segment with max stroke weight
    strokeWeight(this.config.maxStrokeWeight);
    line(this.x, this.y, this.segX[0], this.segY[0]);

    // Draw lines between segments with gradually decreasing stroke weight
    for (let i = 0; i < this.segX.length - 1; i++) {
      const strokeWeightForThisSegment = this._getStrokeWeightForSegment(i);
      strokeWeight(strokeWeightForThisSegment);
      line(this.segX[i], this.segY[i], this.segX[i + 1], this.segY[i + 1]);
    }
  }

  _drawHead() {
    // Draw head base at current position with max stroke weight size
    fill(this.color);
    noStroke();
    //   ellipse(this.x, this.y, this.config.maxStrokeWeight * 1.5);

    // Draw head image with rotation and flipping
    push();
    translate(this.x, this.y);

    const { angle, shouldFlip } = this._calculateHeadOrientation();

    if (shouldFlip) {
      scale(-1, 1);
    }
    // rotate(angle);
    this.animation.draw(
      -this.config.headSize / 2,
      -this.config.headSize / 2,
      this.config.headSize,
      this.config.headSize
    );

    //image(this.head, -this.config.headSize / 2, -this.config.headSize / 2, this.config.headSize, this.config.headSize);
    pop();
  }

  _calculateHeadOrientation() {
    const dx = this.segX[0] - this.x;
    const dy = this.segY[0] - this.y;
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
