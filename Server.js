import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ABSOLUTE PATH FIX: 
// This resolves the 'dist' folder from the absolute root of the project, 
// bypassing the 'src/src' nesting issue entirely.
const rootPath = path.resolve(process.cwd()); 
const distPath = path.join(rootPath, "dist");

console.log("Looking for static files at:", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.error("CRITICAL: 'dist' folder not found at:", distPath);
}

// ── API ROUTES ──────────────────────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  // ... (Keep your existing API logic here)
});

app.post("/api/generate", async (req, res) => {
  // ... (Keep your existing API logic here)
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
