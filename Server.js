import express from "express";
import path from "path";
import fs from "fs";

const app = express();
// Point to the dist folder created by your frontend build
// If your build puts it in a 'client/dist' folder, change this to 'client/dist'
const distPath = path.resolve(process.cwd(), "dist"); 

console.log("Looking for static files at:", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ... your API routes remain here ...
