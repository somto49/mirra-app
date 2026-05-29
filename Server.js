import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// SEARCH FROM THE ABSOLUTE ROOT
const findDist = () => {
    // Look for a 'dist' folder anywhere in the project root
    const rootDir = "/opt/render/project/src";
    const possible = [
        path.join(rootDir, "dist"),
        path.join(rootDir, "src", "dist"),
        path.join(process.cwd(), "dist")
    ];
    for (const p of possible) {
        if (fs.existsSync(p)) return p;
    }
    return null;
};

const distDir = findDist();
console.log("Resolved Dist Directory:", distDir);

if (distDir) {
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
    });
} else {
    console.error("CRITICAL: Dist directory not found!");
}

// ... (Your API routes remain here)
