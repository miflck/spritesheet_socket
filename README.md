# Dragon Canvas

A collaborative application where multiple users can move dragons together in real-time,

## Architecture

The application consists of:

- **Drawing Interface** (`drawing.js`) - Where users draw and interact
- **Display Interface** (`display.js`) - Shows the collaborative canvas with dragon cursors
- **Server** (`server.js`) - Handles real-time communication between clients
- **Settings** (`settings.json`) - Configuration file for all application parameters

## Setup and Installation

1. **Clone or Download the Project**

   ```bash
   git clone [your-repo-url]
   cd dragon-canvas
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Generate Asset Manifest** (if you add or remove dragon images)

   ```bash
   npm run build
   ```

4. **Directory Structure**

   ```
   project/
   ├── server.js
   ├── public/
   │   ├── index.html          # Drawing interface
   │   ├── display.html        # Display interface
   │   ├── drawing.js
   │   ├── display.js
   │   ├── settings.json
   │   └── assets/
   │       ├── manifest.json   # List of dragon images
   │       └── *.png          # Dragon image files
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
4. Each user automatically gets assigned a unique color

### For Display

1. Open `http://localhost:3000/display` on a large screen or projector
2. Watch as users' cursors appear as animated dragons
3. See real-time collaborative drawing with dragon representations

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
  "cursorSize": 20,           // Cursor size
  "cursorOpacity": "99"       // Cursor opacity
}
```

### Dragon Settings

```json
"dragon": {
  "headSize": 100,            // Dragon head size
  "segNum": 30,               // Number of body segments
  "segLength": 15,            // Length of each segment
  "strokeWeight": 9,          // Dragon outline thickness
  "opacity": 180              // Dragon transparency
}
```

### UI Settings

```json
"ui": {
  "showClientIds": true,      // Show client IDs near dragons
  "clientIdLength": 8         // Length of displayed client ID
}
```

### Server Settings

```json
"server": {
  "port": 3000,                    // Server port
  "cursorInactiveTimeout": 5000,   // Time before removing inactive dragons (ms)
  "enableLogging": true            // Enable server logging
}
```

## Technical Details

### Coordinate Normalization

The application uses normalized coordinates (0-1) for communication between clients and the server, ensuring the drawing works correctly across different screen sizes.

### Real-time Communication

Uses Socket.IO for real-time communication:

- `drawing` - Sends line drawing data
- `cursor-position` - Sends cursor/touch position updates
- `clear` - Clears the canvas for all users
- `assigned-color` - Server assigns colors and to new clients
- `client-disconnected` - Removes dragons when users disconnect

### Dragon Animation

Each user's cursor is represented by an animated dragon with:

- Smooth movement interpolation
- Segmented body that follows the head
- Automatic cleanup of inactive dragons
- Color matching the user's assigned drawing color

### Mobile Support

- Touch event handling for mobile devices
- Prevents default scrolling behavior on the canvas
- Responsive canvas sizing

## Dependencies

### Production Dependencies

- **Express ^4.18.2** - Web server framework
- **Socket.IO ^4.7.2** - Real-time bidirectional communication

### Development Dependencies

- **Nodemon ^3.0.1** - Development server with auto-restart

### Client-side Libraries

- **p5.js** - Creative coding library (loaded via CDN)

### System Requirements

- **Node.js >= 16.0.0**

## Browser Support

Works in modern browsers that support:

- WebSocket connections
- HTML5 Canvas
- Touch events (for mobile)

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-restart using nodemon
- `npm run build` - Generate asset manifest for dragon images
- `npm run prebuild` - Automatically runs before build to generate manifest

## Asset Management

The application includes a build system for managing dragon image assets:

1. **Add dragon images** to the `public/assets/` directory (PNG format recommended)
2. **Run the build command** to generate the manifest:
   ```bash
   npm run build
   ```
3. **The manifest file** (`assets/manifest.json`) will list all available images for the dragons

## Development Notes

- The drawing interface normalizes coordinates before sending to ensure consistency across different screen sizes
- The display interface denormalizes coordinates when receiving data
- Dragons are automatically removed after a configurable timeout period
- All settings can be modified without changing code by editing `settings.json`
