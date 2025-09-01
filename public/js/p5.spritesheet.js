// spritesheet.js - A proper p5.js library using p5.prototype

/**
 * Internal Spritesheet class (not exposed globally)
 * Handles loading and rendering individual frames from a spritesheet image
 */
class Spritesheet {
  /**
   * Creates a new Spritesheet instance
   * @param {string} imagePath - Path to the spritesheet image file
   * @param {number} cols - Number of columns in the spritesheet grid (default: 6)
   * @param {number} rows - Number of rows in the spritesheet grid (default: 1)
   */
  constructor(imagePath, cols = 6, rows = 1) {
    this.image = null;
    this.cols = cols;
    this.rows = rows;
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.totalFrames = cols * rows;
    this.currentFrame = 0;

    // Load the image
    this.image = loadImage(imagePath, () => {
      this.frameWidth = this.image.width / this.cols;
      this.frameHeight = this.image.height / this.rows;
    });
  }

  /**
   * Draws a specific frame from the spritesheet
   * @param {number} frameIndex - The frame number to draw (0-based index)
   * @param {number} x - X coordinate to draw the frame
   * @param {number} y - Y coordinate to draw the frame
   * @param {number|null} w - Width to draw the frame (uses original size if null)
   * @param {number|null} h - Height to draw the frame (uses original size if null)
   */
  drawFrame(frameIndex, x, y, w = null, h = null) {
    if (!this.image || frameIndex < 0 || frameIndex >= this.totalFrames) return;

    const col = frameIndex % this.cols;
    const row = Math.floor(frameIndex / this.cols);
    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;

    const drawWidth = w || this.frameWidth;
    const drawHeight = h || this.frameHeight;

    image(this.image, x, y, drawWidth, drawHeight, sx, sy, this.frameWidth, this.frameHeight);
  }

  /**
   * Checks if the spritesheet image has finished loading
   * @returns {boolean} True if the image is loaded and ready to use
   */
  isLoaded() {
    return this.image && this.image.width > 0;
  }
}

// Add functions to p5.prototype - these become global p5 functions

/**
 * Creates a new spritesheet from an image file
 * @param {string} imagePath - Path to the spritesheet image file
 * @param {number} [cols=6] - Number of columns in the spritesheet grid
 * @param {number} [rows=1] - Number of rows in the spritesheet grid
 * @returns {Spritesheet} A new Spritesheet instance
 */
p5.prototype.createSpritesheet = function (imagePath, cols = 6, rows = 1) {
  return new Spritesheet(imagePath, cols, rows);
};

/**
 * Draws a specific frame from a spritesheet
 * @param {Spritesheet} spritesheet - The spritesheet to draw from
 * @param {number} frameIndex - The frame number to draw (0-based index)
 * @param {number} x - X coordinate to draw the frame
 * @param {number} y - Y coordinate to draw the frame
 * @param {number} [w] - Width to draw the frame (uses original size if omitted)
 * @param {number} [h] - Height to draw the frame (uses original size if omitted)
 */
p5.prototype.drawSprite = function (spritesheet, frameIndex, x, y, w, h) {
  if (spritesheet instanceof Spritesheet) {
    spritesheet.drawFrame(frameIndex, x, y, w, h);
  }
};

/**
 * Alias for drawSprite() - draws a specific frame from a spritesheet
 * @param {Spritesheet} spritesheet - The spritesheet to draw from
 * @param {number} frameIndex - The frame number to draw (0-based index)
 * @param {number} x - X coordinate to draw the frame
 * @param {number} y - Y coordinate to draw the frame
 * @param {number} [w] - Width to draw the frame (uses original size if omitted)
 * @param {number} [h] - Height to draw the frame (uses original size if omitted)
 */
p5.prototype.drawSpriteFrame = function (spritesheet, frameIndex, x, y, w, h) {
  this.drawSprite(spritesheet, frameIndex, x, y, w, h);
};

/**
 * Automatically animates through all frames of a spritesheet based on frameCount
 * Changes frame every 5 frames (12fps at 60fps)
 * @param {Spritesheet} spritesheet - The spritesheet to animate
 * @param {number} x - X coordinate to draw the animation
 * @param {number} y - Y coordinate to draw the animation
 * @param {number} [w] - Width to draw each frame (uses original size if omitted)
 * @param {number} [h] - Height to draw each frame (uses original size if omitted)
 */
p5.prototype.animateSprite = function (spritesheet, x, y, w, h) {
  if (spritesheet instanceof Spritesheet) {
    const frame = Math.floor(frameCount / 5) % spritesheet.totalFrames;
    spritesheet.drawFrame(frame, x, y, w, h);
  }
};

/**
 * Creates a custom sprite animation with frame sequences and timing control
 * @param {Spritesheet} spritesheet - The spritesheet to animate
 * @param {number[]} [frames] - Array of frame indices to animate (uses all frames if omitted)
 * @param {number} [speed=5] - Number of draw calls to wait between frame changes (higher = slower)
 * @returns {Object} Animation object with control methods
 * @returns {Spritesheet} returns.spritesheet - Reference to the spritesheet
 * @returns {number[]} returns.frames - Array of frame indices being animated
 * @returns {number} returns.speed - Current animation speed
 * @returns {number} returns.currentFrame - Current frame index in the sequence
 * @returns {boolean} returns.playing - Whether animation is currently playing
 * @returns {boolean} returns.loop - Whether animation loops when it reaches the end
 * @returns {Function} returns.play - Starts/resumes the animation
 * @returns {Function} returns.pause - Pauses the animation
 * @returns {Function} returns.setSpeed - Changes animation speed
 * @returns {Function} returns.setLoop - Sets whether animation loops
 * @returns {Function} returns.update - Updates animation state (call in draw loop)
 * @returns {Function} returns.draw - Draws current animation frame
 */
p5.prototype.createSpriteAnimation = function (spritesheet, frames, speed = 5) {
  return {
    spritesheet: spritesheet,
    frames: frames || Array.from({ length: spritesheet.totalFrames }, (_, i) => i),
    speed: speed,
    currentFrame: 0,
    playing: true,
    loop: true,

    /**
     * Starts or resumes the animation
     * @returns {Object} This animation object for method chaining
     */
    play() {
      this.playing = true;
      return this;
    },

    /**
     * Pauses the animation
     * @returns {Object} This animation object for method chaining
     */
    pause() {
      this.playing = false;
      return this;
    },

    /**
     * Sets the animation speed
     * @param {number} s - Number of draw calls to wait between frames (higher = slower)
     * @returns {Object} This animation object for method chaining
     */
    setSpeed(s) {
      this.speed = s;
      return this;
    },

    /**
     * Sets whether the animation loops
     * @param {boolean} l - True to loop, false to stop at the end
     * @returns {Object} This animation object for method chaining
     */
    setLoop(l) {
      this.loop = l;
      return this;
    },

    /**
     * Updates the animation state - call this in your draw() function
     * Advances to the next frame based on timing and loop settings
     */
    update() {
      if (!this.playing) return;
      if (frameCount % this.speed === 0) {
        this.currentFrame++;
        if (this.currentFrame >= this.frames.length) {
          if (this.loop) {
            this.currentFrame = 0;
          } else {
            this.currentFrame = this.frames.length - 1;
            this.playing = false;
          }
        }
      }
    },

    /**
     * Draws the current animation frame
     * @param {number} x - X coordinate to draw the frame
     * @param {number} y - Y coordinate to draw the frame
     * @param {number} [w] - Width to draw the frame (uses original size if omitted)
     * @param {number} [h] - Height to draw the frame (uses original size if omitted)
     */
    draw(x, y, w, h) {
      const frameIndex = this.frames[this.currentFrame];
      this.spritesheet.drawFrame(frameIndex, x, y, w, h);
    },
  };
};

/**
 * Gets the total number of frames in a spritesheet
 * @param {Spritesheet} spritesheet - The spritesheet to check
 * @returns {number} Total number of frames, or 0 if invalid spritesheet
 */
p5.prototype.getSpriteFrameCount = function (spritesheet) {
  return spritesheet instanceof Spritesheet ? spritesheet.totalFrames : 0;
};

/**
 * Checks if a spritesheet has finished loading and is ready to use
 * @param {Spritesheet} spritesheet - The spritesheet to check
 * @returns {boolean} True if loaded and ready, false otherwise
 */
p5.prototype.isSpriteLoaded = function (spritesheet) {
  return spritesheet instanceof Spritesheet ? spritesheet.isLoaded() : false;
};

/* 
USAGE EXAMPLES:

// Now you can use these functions globally in your sketch:

let mySprite;
let walkAnim;

function preload() {
  // Creates spritesheet using p5 function
  mySprite = createSpritesheet('character.png', 6, 1);
}

function setup() {
  createCanvas(800, 600);
  
  // Create animation using p5 function
  walkAnim = createSpriteAnimation(mySprite, [0, 1, 2, 3], 8);
}

function draw() {
  background(220);
  
  // Use p5 functions directly
  drawSprite(mySprite, 0, 100, 100, 64, 64);
  
  // Or use animation
  walkAnim.update();
  walkAnim.draw(200, 100, 64, 64);
  
  // Automatic animation helper
  animateSprite(mySprite, 300, 100, 64, 64);
}

WHY USE p5.prototype:

1. FEELS NATIVE
   - Functions work like built-in p5 functions
   - No need to remember class names or methods
   - Consistent with p5 API style

2. EASIER FOR BEGINNERS
   - drawSprite() feels natural after rect(), ellipse()
   - No object-oriented complexity
   - Matches p5's beginner-friendly philosophy

3. LIBRARY STANDARDS
   - Official p5 libraries use this pattern
   - Expected by p5 community
   - Better integration with p5 ecosystem

4. GLOBAL AVAILABILITY
   - Functions available everywhere in sketch
   - No imports or instantiation needed
   - Can be used in any function

WHEN NOT TO USE p5.prototype:

1. COMPLEX STATE MANAGEMENT
   - When you need many interacting objects
   - OOP makes more sense for game entities

2. NAMESPACE POLLUTION
   - Adding too many global functions
   - Name conflicts with other libraries

3. PERFORMANCE CRITICAL
   - Direct class methods might be faster
   - Less function call overhead

4. LARGE APPLICATIONS
   - Better code organization with classes
   - Easier to maintain and test
*/
