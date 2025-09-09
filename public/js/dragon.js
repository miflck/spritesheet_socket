class Dragon {
  constructor(clientId, color, animation, options = {}) {
    // Basic properties
    this.clientId = clientId;
    this.color = color;
    this.animation = animation;

    // Configuration with defaults
    this.config = {
      opacity: options.opacity || 100,
      timeOut: options.timeOut || 3000,
      headSize: options.headSize || 100,
      easing: options.easing || 0.05, // Simple easing factor
      noiseScale: options.noiseScale || 0.005, // Scale for Perlin noise time progression
      noiseStrength: options.noiseStrength || 500, // Strength of the noise effect
    };

    // Simple position and target
    this.x = 0;
    this.y = 0;
    this.prevX = 0; // Store previous X position for flip calculation
    this.targetX = 0;
    this.targetY = 0;
    this.angle = 0;

    // Noise offset for unique movement per dragon
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000, 2000);
    this.noiseTime = 0;

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

    // Store previous position for flip calculation
    this.prevX = this.x;

    // Increment noise time for continuous movement
    this.noiseTime += this.config.noiseScale;

    // Generate Perlin noise offsets
    const noiseX = (noise(this.noiseOffsetX + this.noiseTime) - 0.5) * this.config.noiseStrength;
    const noiseY = (noise(this.noiseOffsetY + this.noiseTime) - 0.5) * this.config.noiseStrength;

    // Add noise to target position
    const noisyTargetX = this.targetX + noiseX;
    const noisyTargetY = this.targetY + noiseY;

    // Simple easing toward noisy target
    let dx = noisyTargetX - this.x;
    let dy = noisyTargetY - this.y;
    this.angle = atan2(dy, dx);

    this.x += dx * this.config.easing;
    this.y += dy * this.config.easing;
  }

  draw() {
    if (!this.isActive) return;

    push();
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
      isActive: this.isActive,
      currentPosition: { x: this.x, y: this.y },
      targetPosition: { x: this.targetX, y: this.targetY },
      angle: this.angle,
    };
  }

  getHeadPosition() {
    return { x: this.x, y: this.y };
  }

  // Private methods
  _drawHead() {
    // Draw head image with rotation and flipping
    push();
    translate(this.x, this.y);

    const { shouldFlip } = this._calculateHeadOrientation();

    if (!shouldFlip) {
      scale(-1, 1);
    }

    this.animation.draw(
      -this.config.headSize / 2,
      -this.config.headSize / 2,
      this.config.headSize,
      this.config.headSize
    );

    pop();
  }

  _calculateHeadOrientation() {
    // Calculate flip based on movement direction (current x vs previous x)
    const dx = this.x - this.prevX;
    const shouldFlip = dx < 0; // Flip when moving left

    return { shouldFlip };
  }

  _getOpacityHex() {
    return this.config.opacity.toString(16).padStart(2, "0");
  }
}
