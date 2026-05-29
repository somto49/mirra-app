import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Because Root Directory is 'src', your root folder is one level up
const distPath = path.resolve(__dirname, "../dist");

console.log("Looking for static files at:", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.error("CRITICAL: 'dist' folder NOT found at:", distPath);
}

// ... rest of your API routes
