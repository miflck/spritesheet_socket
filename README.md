# Animal Canvas

A collaborative drawing application where multiple users can draw together in real-time, with their cursors represented as animated animals (butterflies, etc.) on a display screen.

## Architecture

The application consists of:

- **Drawing Interface** (`drawing.js`) - Where users draw and interact with animated cursor feedback
- **Display Interface** (`display.js`) - Shows the collaborative canvas with animated animal cursors
- **Server** (`server.js`) - Handles real-time communication between clients
- **Settings** (`settings.json`) - Configuration file for all application parameters
- **Animal System** (`Animal.js`) - Manages animated animal representations of user cursors
- **Sprite Animation** (`p5.spritesheet.js`) - Custom p5.js library for sprite sheet animations

## Setup and Installation

1. **Clone or Download the Project**

   ```bash
   git clone [your-repo-url]
   cd animal-canvas
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Generate Asset Manifest** (if you add or remove animal sprite images)

   ```bash
   npm run build
   ```

4. **Directory Structure**

   ```
   project/
   ├── server.js
   ├── Animal.js              # Animal cursor class
   ├── public/
   │   ├── index.html          # Drawing interface
   │   ├── display.html        # Display interface
   │   ├── drawing.js          # Drawing interface logic
   │   ├── display.js          # Display interface logic
   │   ├── p5.spritesheet.js   # Sprite animation library
   │   ├── settings.json       # Configuration
   │   └── assets/
   │       ├── manifest.json   # List of animal sprite images
   │       └── *.png          # Animal sprite sheet files
   ```

5. **Start the Server**

   ```bash
   # Production
   npm start

   # Development (with auto-restart)
   npm run dev
   ```

6. **Access the Application**
   - Drawing interface: `http://localhost:3000`
   - Display interface: `http://localhost:3000/display`

## Usage

### For Drawing

1. Open `http://localhost:3000` on any device
2. Start drawing with mouse or touch
3. Press spacebar to clear the canvas
4. Each user gets a unique color and animated cursor with triangular indicators
5. Cursor appears as a colored circle with animated triangles that blink after 5 seconds

### For Display

1. Open `http://localhost:3000/display` on a large screen or projector
2. Watch as users' cursors appear as animated animals (butterflies, etc.)
3. See real-time collaborative drawing with animal representations
4. Each user gets a different animal sprite based on their color assignment

## Configuration

Edit `settings.json` to customize:

### Colors

```json
"colors": [
  "#FF6B6B", "#4ECDC4", "#45B7D1", ...
]
```

### Canvas Settings

```json
"canvas": {
  "width": "windowWidth",      // Drawing canvas width
  "height": "windowHeight",    // Drawing canvas height
  "backgroundColor": "#000000", // Canvas background color
  "displayWidth": 1920,        // Display canvas width
  "displayHeight": 1080        // Display canvas height
}
```

### Drawing Settings

```json
"drawing": {
  "strokeWeight": 5,           // Brush thickness
  "cursorSize": 20            // Cursor size on drawing interface
}
```

### Animal Settings

```json
"animal": {
  "headSize": 100,            // Animal sprite size
  "opacity": 180,             // Animal transparency
  "timeOut": 3000,           // Inactivity timeout (ms)
  "easing": 0.05,            // Movement smoothing
  "noiseScale": 0.005,       // Perlin noise time scale
  "noiseStrength": 500       // Perlin noise movement strength
}
```

### UI Settings

```json
"ui": {
  "showClientIds": true,      // Show client IDs near animals
  "clientIdLength": 8,        // Length of displayed client ID
  "clearStatusDelay": 2000   // Status message delay after clear
}
```

### Server Settings

```json
"server": {
  "port": 3000,                    // Server port
  "cursorInactiveTimeout": 5000,   // Time before removing inactive animals (ms)
  "enableLogging": true            // Enable server logging
}
```

## Technical Details

### Sprite Animation System

The application uses a custom p5.js sprite animation library (`p5.spritesheet.js`) that provides:

- **Sprite Sheet Loading**: Load and parse sprite sheets with configurable grid layouts
- **Frame Animation**: Automatic frame cycling with customizable speed
- **Animation Control**: Play, pause, loop controls for animations
- **p5.js Integration**: Functions work like native p5.js drawing functions

**Key Functions:**

- `createSpritesheet(imagePath, cols, rows)` - Load a sprite sheet
- `createSpriteAnimation(spritesheet, frames, speed)` - Create an animation
- `drawSprite(spritesheet, frameIndex, x, y, w, h)` - Draw a specific frame
- `animateSprite(spritesheet, x, y, w, h)` - Auto-animate through all frames

### Animal Cursor System

Each user's cursor is represented by an `Animal` class instance that features:

- **Smooth Movement**: Eased interpolation toward target positions
- **Perlin Noise**: Organic, lifelike movement patterns
- **Sprite Animation**: Animated sprite sheets (9-frame butterfly animations)
- **Orientation**: Automatic sprite flipping based on movement direction
- **Color Assignment**: Each user gets a unique color and corresponding sprite
- **Automatic Cleanup**: Inactive animals are removed after timeout

### Coordinate Normalization

The application uses normalized coordinates (0-1) for communication between clients and the server, ensuring the drawing works correctly across different screen sizes.

### Real-time Communication

Uses Socket.IO for real-time communication:

- `drawing` - Sends line drawing data with color information
- `cursor-position` - Sends cursor/touch position updates
- `clear` - Clears the canvas for all users
- `assigned-color` - Server assigns colors and settings to new clients
- `client-disconnected` - Removes animals when users disconnect
- `join-display` - Identifies display clients for proper routing

### Mobile Support

- Touch event handling for mobile devices
- Prevents default scrolling behavior on the canvas
- Responsive canvas sizing
- Touch-based drawing with same functionality as desktop

## Dependencies

### Production Dependencies

- **Express ^4.18.2** - Web server framework
- **Socket.IO ^4.7.2** - Real-time bidirectional communication

### Development Dependencies

- **Nodemon ^3.0.1** - Development server with auto-restart

### Client-side Libraries

- **p5.js** - Creative coding library (loaded via CDN)
- **Socket.IO Client** - Real-time communication client

### System Requirements

- **Node.js >= 16.0.0**

## Browser Support

Works in modern browsers that support:

- WebSocket connections
- HTML5 Canvas
- Touch events (for mobile)
- ES6+ JavaScript features

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart using nodemon
- `npm run build` - Generate asset manifest for animal sprite images
- `npm run prebuild` - Automatically runs before build to generate manifest

## Asset Management

The application includes a build system for managing animal sprite assets:

1. **Add animal sprite sheets** to the `public/assets/` directory (PNG format, 9x1 grid recommended)
2. **Run the build command** to generate the manifest:
   ```bash
   npm run build
   ```
3. **The manifest file** (`assets/manifest.json`) will list all available sprite sheets for the animals

### Sprite Sheet Format

Animal sprites should be:

- **PNG format** for transparency support
- **9 frames horizontally** in a single row (9x1 grid)
- **Square aspect ratio** for each frame
- **Consistent sizing** across all sprite sheets

## Development Notes

- The drawing interface shows animated cursors with blinking triangular indicators
- The display interface shows users as animated animals using sprite sheet animations
- Animals move with organic Perlin noise patterns for lifelike behavior
- Coordinates are normalized for cross-device compatibility
- Color assignment determines which sprite sheet each user gets
- All settings can be modified without changing code by editing `settings.json`
- The sprite animation system extends p5.js with custom functions for easy sprite handling

## Animation Features

- **Smooth Interpolation**: Animal movements use easing for smooth motion
- **Organic Movement**: Perlin noise adds natural, lifelike movement patterns
- **Sprite Flipping**: Animals automatically face their movement direction
- **Frame Animation**: Each animal cycles through sprite frames for realistic animation
- **Color Coordination**: Animal sprites are selected based on user's assigned color
- **Performance Optimized**: Efficient sprite rendering and animation updates
