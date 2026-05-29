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

// 1. Use absolute paths based on the project root (process.cwd())
const rootDir = process.cwd();
app.use(express.static(path.join(rootDir, 'dist')));

// ── SECURE ROUTE FOR GEMINI ANALYSIS ──────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
              { text: `Analyze this person's appearance... (your existing prompt here)` }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── SECURE ROUTE FOR FLUX GENERATION ──────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const hfToken = process.env.HUGGING_FACE_TOKEN;
    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { num_inference_steps: 4, width: 768, height: 1024 } }),
    });

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Use absolute path for the fallback route
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
