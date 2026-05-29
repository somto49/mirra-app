import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ABSOLUTE PATH FIX
// We define the root as the current working directory
const rootPath = process.cwd();
// We look for 'dist' inside that root, which bypasses the src/src nesting issue
const distPath = path.join(rootPath, "dist");

console.log("Checking for dist at:", distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.error("CRITICAL ERROR: 'dist' folder not found at", distPath);
  // Still serve API so the app doesn't crash completely
}

// ── API ROUTES ──────────────────────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: "API Key missing" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }, { text: "Analyze this person's appearance. Return JSON." }] }],
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

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt }),
    });
    const base64Image = Buffer.from(await response.arrayBuffer()).toString("base64");
    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
