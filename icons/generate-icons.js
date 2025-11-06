// Generate modern minimal recording icons
const fs = require("fs");
const { createCanvas } = require("canvas");

function rrRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createIcon(size, filename) {
  const c = createCanvas(size, size);
  const ctx = c.getContext("2d");

  // Background radial gradient
  const bg = ctx.createRadialGradient(
    size * 0.3,
    size * 0.3,
    0,
    size * 0.3,
    size * 0.3,
    size * 0.9
  );
  bg.addColorStop(0, "#222");
  bg.addColorStop(0.6, "#111");
  bg.addColorStop(1, "#090909");
  rrRect(ctx, 0, 0, size, size, Math.round(size * 0.24));
  ctx.fillStyle = bg;
  ctx.fill();

  // Inner stroke
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = Math.max(1, size * 0.016);
  rrRect(
    ctx,
    size * 0.03,
    size * 0.03,
    size * 0.94,
    size * 0.94,
    Math.round(size * 0.22)
  );
  ctx.stroke();

  // Concentric ring
  ctx.strokeStyle = ctx.createLinearGradient(0, 0, 0, size);
  ctx.strokeStyle.addColorStop(0, "rgba(255,255,255,0.22)");
  ctx.strokeStyle.addColorStop(1, "rgba(255,255,255,0.06)");
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
  ctx.stroke();

  // Red dot + halo
  ctx.fillStyle = "#ff2d55";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.115, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,45,85,0.22)";
  ctx.lineWidth = size * 0.035;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  const buf = c.toBuffer("image/png");
  fs.writeFileSync(filename, buf);
  console.log("Created", filename);
}

try {
  require.resolve("canvas");
  createIcon(16, "icon16.png");
  createIcon(48, "icon48.png");
  createIcon(128, "icon128.png");
  console.log("All icons created successfully!");
} catch (e) {
  console.log("Canvas module not installed. Run: npm install canvas");
  console.log(
    "Alternatively, see icons/README.md for manual icon creation instructions."
  );
}
