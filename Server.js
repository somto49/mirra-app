import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ABSOLUTE PATH FIX: 
// This resolves the path to the root 'dist' directory, 
// forcing it to look at /opt/render/project/dist
const distPath = path.resolve(process.cwd(), "dist");

console.log("Serving static files from:", distPath);

app.use(express.static(distPath));

// API ROUTES ... (Keep your existing API routes here)

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
