import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "20mb" }));

app.get("/", (_req, res) => res.json({ status: "CROWN API is running ✦" }));

// ── /api/analyze (Gemini Vision) ────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Describe this person's face, skin tone, and features for a portrait prompt. Be concise (1-2 sentences)." },
              { inline_data: { mime_type: "image/jpeg", data: base64 } }
            ]
          }]
        })
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Gemini failed" });
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/generate (Hugging Face Flux) ───────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    if (!process.env.HF_TOKEN) return res.status(500).json({ error: "HF_TOKEN not set" });

    const r = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.json({ image: `data:image/png;base64,${buf.toString("base64")}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✦ CROWN API on port ${PORT}`));
