import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ABSOLUTE PATH RESOLUTION
// This forces the server to look for 'dist' at the absolute root 
// of the project, bypassing the nested 'src/src' issue.
const rootPath = process.cwd(); 
const distPath = path.join(rootPath, "dist");

console.log("Looking for static files at (Absolute Path):", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.error("CRITICAL ERROR: 'dist' folder NOT found at:", distPath);
  // Serve a simple response so the server doesn't crash
  app.get("*", (req, res) => res.send("Server is running, but 'dist' folder not found."));
}

// ── API ROUTES ──────────────────────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  /* ... keep your existing API logic here ... */
});

app.post("/api/generate", async (req, res) => {
  /* ... keep your existing API logic here ... */
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
