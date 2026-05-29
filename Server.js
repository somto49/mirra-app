import express from "express";
import path from "path";
import fs from "fs";

const app = express();
// This looks for 'dist' at the actual project root, 
// avoiding the 'src/src' nesting issue.
const distPath = path.resolve(process.cwd(), "dist");

console.log("Looking for static files at:", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.error("CRITICAL: 'dist' folder not found at:", distPath);
}
