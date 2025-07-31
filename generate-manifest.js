const fs = require("fs");
const path = require("path");

const assetsDir = "./public/assets"; // Adjust path if needed
const outputPath = "./public/assets/manifest.json"; // Where to save manifest

try {
  // Check if assets directory exists
  if (!fs.existsSync(assetsDir)) {
    console.log("Assets directory not found, creating empty manifest");
    // Create directory if it doesn't exist
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ images: [] }, null, 2));
    process.exit(0);
  }

  // Get all PNG files
  const pngFiles = fs
    .readdirSync(assetsDir)
    .filter((file) => path.extname(file).toLowerCase() === ".png")
    .sort(); // Sort alphabetically for consistency

  const manifest = {
    images: pngFiles,
    generated: new Date().toISOString(),
  };

  // Write manifest file
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  console.log(`✅ Generated manifest with ${pngFiles.length} PNG files:`);
  pngFiles.forEach((file) => console.log(`   - ${file}`));
} catch (error) {
  console.error("❌ Error generating manifest:", error.message);
  process.exit(1);
}
