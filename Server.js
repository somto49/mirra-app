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

// Serve the static React frontend files
// The "../" tells the server to look in the root folder, not inside src
app.use(express.static(path.join(__dirname, "../dist")));

// ── SECURE ROUTE FOR GEMINI ANALYSIS ──────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(500).json({ error: "Gemini API key is missing on the server configuration." });
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
              {
                text: `Analyze this person's appearance for AI fashion photo generation. Return ONLY a valid JSON object, no markdown, no backticks, no explanation:
{
  "skinTone": "very detailed skin tone description (e.g. deep ebony, rich mahogany, warm brown, golden caramel, medium brown)",
  "bodyBuild": "body build (e.g. tall and slender, petite and curvy, athletic and toned)",
  "gender": "woman or man",
  "ageRange": "approximate age range (e.g. mid 20s, early 30s)",
  "currentStyle": "one sentence about their current style",
  "fluxPromptBase": "A [gender] with [detailed skin tone] skin, [facial features], [body type], photorealistic fashion model"
}`
              }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

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

    if (!hfToken) {
      return res.status(500).json({ error: "HuggingFace token is missing on the server configuration." });
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { num_inference_steps: 4, width: 768, height: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `HuggingFace error: ${err.slice(0, 100)}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Always route back to React index if no API routes match
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
