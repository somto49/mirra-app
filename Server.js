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
// This searches for the 'dist' folder by checking the root directory 
// and the parent directory, ensuring it finds it regardless of 'Root Directory' settings.
const possiblePaths = [
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "..", "dist"),
  path.join(__dirname, "..", "dist")
];

const distPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

console.log("Serving static files from:", distPath);

app.use(express.static(distPath));

// ── SECURE ROUTE FOR GEMINI ANALYSIS ──────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }, { text: "Analyze this person's appearance. Return ONLY JSON." }] }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    res.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── SECURE ROUTE FOR FLUX GENERATION ──────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { num_inference_steps: 4, width: 768, height: 1024 } }),
    });
    const base64Image = Buffer.from(await response.arrayBuffer()).toString("base64");
    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Always route back to React index
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
