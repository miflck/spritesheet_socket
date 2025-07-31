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

    // Vehicle physics (exactly like Boid)
    this.position = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.acceleration = createVector(0, 0);
    this.maxSpeed = options.maxSpeed || 20;
    this.maxForce = options.maxForce || 0.2;

    // Target and state
    this.target = createVector(0, 0);
    this.isActive = false;
    this.lastUpdate = Date.now();
  }

  // Public methods
  updateTarget(x, y) {
    this.target.set(x, y);
    this.isActive = true;
    this.lastUpdate = Date.now();
  }

  isInactive(timeoutMs = this.config.timeOut) {
    return Date.now() - this.lastUpdate > timeoutMs;
  }

  update() {
    if (!this.isActive) return;

    // Apply arrive behavior toward target
    let arriveForce = this.arrive(this.target);
    this.applyForce(arriveForce);

    // Update physics (exactly like Boid)
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Update segment chain using current position
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
    this.velocity.mult(0);
    this.acceleration.mult(0);
  }

  getInfo() {
    return {
      clientId: this.clientId,
      color: this.color,
      segNum: this.config.segNum,
      isActive: this.isActive,
      headPosition: { x: this.x[0], y: this.y[0] },
      currentPosition: { x: this.position.x, y: this.position.y },
      targetPosition: { x: this.target.x, y: this.target.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      currentSpeed: this.velocity.mag(),
    };
  }

  getHeadPosition() {
    return { x: this.x[0], y: this.y[0] };
  }

  // Physics methods (exactly like Boid)
  applyForce(force) {
    this.acceleration.add(force);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    desired.setMag(this.maxSpeed);

    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);

    return steer;
  }

  arrive(target, slowingRadius = 200) {
    let desired = p5.Vector.sub(target, this.position);
    let distance = desired.mag();

    if (distance < slowingRadius) {
      let speed = map(distance, 0, slowingRadius, 0, this.maxSpeed);
      desired.setMag(speed);
    } else {
      desired.setMag(this.maxSpeed);
    }

    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);

    return steer;
  }

  // Private methods
  _initializeSegments() {
    for (let i = 0; i < this.config.segNum; i++) {
      this.x[i] = 0;
      this.y[i] = 0;
    }
  }

  _updateSegmentChain() {
    // Move head segment toward current position
    this._dragSegment(0, this.position.x, this.position.y);

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

    // Draw line from current position to first segment
    line(this.position.x, this.position.y, this.x[0], this.y[0]);

    // Draw lines between segments
    for (let i = 0; i < this.x.length - 1; i++) {
      line(this.x[i], this.y[i], this.x[i + 1], this.y[i + 1]);
    }
  }

  _drawHead() {
    // Draw head base at current position
    fill(this.color);
    noStroke();
    ellipse(this.position.x, this.position.y, this.config.strokeWeight * 1.5);

    // Draw head image with rotation and flipping
    push();
    translate(this.position.x, this.position.y);

    const { angle, shouldFlip } = this._calculateHeadOrientation();

    if (shouldFlip) {
      scale(-1, 1);
    }

    rotate(angle);
    image(this.head, -this.config.headSize / 2, -this.config.headSize / 2, this.config.headSize, this.config.headSize);
    pop();
  }

  _calculateHeadOrientation() {
    const dx = this.x[0] - this.position.x;
    const dy = this.y[0] - this.position.y;
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
