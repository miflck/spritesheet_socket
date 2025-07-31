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
      // Easing configuration
      easingDuration: options.easingDuration || 250, // ms for easing animation
      easingFunction: options.easingFunction || "easeOutCubic",
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

    // Easing state
    this.currentX = 0;
    this.currentY = 0;
    this.previousX = 0;
    this.previousY = 0;
    this.easingStartTime = 0;
    this.isEasing = false;
  }

  // Public methods
  updateTarget(x, y) {
    // Only start new easing if target has changed significantly
    const threshold = 2; // pixels
    const dx = x - this.targetX;
    const dy = y - this.targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > threshold) {
      // Store previous position as starting point for easing
      this.previousX = this.currentX;
      this.previousY = this.currentY;

      // Set new target
      this.targetX = x;
      this.targetY = y;

      // Start easing animation
      this.easingStartTime = millis();
      this.isEasing = true;
    }

    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  isInactive(timeoutMs = this.config.timeOut) {
    return Date.now() - this.lastUpdate > timeoutMs;
  }

  update() {
    if (!this.isActive) return;

    // Update current position with easing
    this._updateEasedPosition();

    // Update segment chain using the eased current position
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
    this.isEasing = false;
  }

  getInfo() {
    return {
      clientId: this.clientId,
      color: this.color,
      segNum: this.config.segNum,
      isActive: this.isActive,
      headPosition: { x: this.x[0], y: this.y[0] },
      currentPosition: { x: this.currentX, y: this.currentY },
      targetPosition: { x: this.targetX, y: this.targetY },
      isEasing: this.isEasing,
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

  _updateEasedPosition() {
    if (this.isEasing) {
      const elapsed = millis() - this.easingStartTime;

      if (elapsed >= this.config.easingDuration) {
        // Animation complete
        this.currentX = this.targetX;
        this.currentY = this.targetY;
        this.isEasing = false;
      } else {
        // Check if easing function is available
        if (typeof ease === "function") {
          // Calculate eased position using p5.easing
          this.currentX = ease(
            this.easingStartTime,
            this.config.easingDuration,
            this.previousX,
            this.targetX,
            this.config.easingFunction
          );

          this.currentY = ease(
            this.easingStartTime,
            this.config.easingDuration,
            this.previousY,
            this.targetY,
            this.config.easingFunction
          );
        } else {
          // Fallback to linear interpolation if easing library not available
          const progress = elapsed / this.config.easingDuration;
          this.currentX = this.previousX + (this.targetX - this.previousX) * progress;
          this.currentY = this.previousY + (this.targetY - this.previousY) * progress;
        }
      }
    } else {
      // No easing active, use target position directly
      this.currentX = this.targetX;
      this.currentY = this.targetY;
    }
  }

  _updateSegmentChain() {
    // Move head segment toward current eased position (not target)
    this._dragSegment(0, this.currentX, this.currentY);

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

    // Draw line from current eased position to first segment
    line(this.currentX, this.currentY, this.x[0], this.y[0]);

    // Draw lines between segments
    for (let i = 0; i < this.x.length - 1; i++) {
      line(this.x[i], this.y[i], this.x[i + 1], this.y[i + 1]);
    }
  }

  _drawHead() {
    // Draw head base at current eased position
    fill(this.color);
    noStroke();
    ellipse(this.currentX, this.currentY, this.config.strokeWeight * 1.5);

    // Draw head image with rotation and flipping
    push();
    translate(this.currentX, this.currentY);

    const { angle, shouldFlip } = this._calculateHeadOrientation();

    if (shouldFlip) {
      scale(-1, 1);
    }

    rotate(angle);
    image(this.head, -this.config.headSize / 2, -this.config.headSize / 2, this.config.headSize, this.config.headSize);
    pop();
  }

  _calculateHeadOrientation() {
    const dx = this.x[0] - this.currentX;
    const dy = this.y[0] - this.currentY;
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
