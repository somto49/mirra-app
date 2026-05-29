import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// USE ABSOLUTE PATHING TO FIND THE DIST FOLDER
// This bypasses the nested 'src/src' issue by resolving from the root
const rootDir = "/opt/render/project"; 
const distDir = path.join(rootDir, "dist"); 

console.log("Looking for static files at:", distDir);

if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
    });
} else {
    console.error("CRITICAL: Could not find 'dist' at " + distDir);
}

// ... (Keep your API routes below)
