import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "https://mirra-app.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.json({ status: "✦ MIRRA API is live" });
});

// ── /api/analyze — Groq photo analysis ───────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: "GROQ_API_KEY not set on server" });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.1,
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `You are an expert at analyzing human appearances for AI image generation. Study this person's face and body very carefully and return ONLY a valid JSON object — no markdown, no backticks, no extra text:
{
  "skinTone": "very precise skin tone e.g. deep ebony with cool undertones, rich dark brown with warm undertones, medium brown with golden undertones",
  "faceShape": "face shape e.g. oval, round, square, heart, oblong",
  "facialFeatures": "very detailed facial features e.g. broad nose, full lips, strong jawline, high cheekbones, deep-set dark brown eyes, thick eyebrows, prominent forehead",
  "bodyBuild": "detailed body build e.g. broad shoulders, athletic muscular build, slim waist",
  "gender": "woman or man",
  "ageRange": "approximate age range e.g. mid 20s, early 30s",
  "currentStyle": "one sentence about their current style",
  "fluxPromptBase": "A highly detailed photorealistic portrait of a [gender], [skin tone] skin with [undertones], [face shape] face shape, [detailed facial features including eyes, nose, lips, jawline], [body build], sharp facial details, hyperrealistic skin texture, professional fashion model"
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(502).json({ error: `Groq: ${data.error.message}` });

    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();

    try {
      return res.json(JSON.parse(clean));
    } catch {
      return res.status(502).json({ error: "Could not parse Groq response" });
    }
  } catch (err) {
    console.error("[/api/analyze]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GEMINI 2.5 FLASH IMAGE "Nano Banana" — true photo editing (primary) ──────
async function generateWithGemini(prompt, imageBase64) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  const enrichedPrompt = `Edit this exact photo. Keep the person's face, identity, skin tone, and body completely unchanged — do not generate a different person. Change only their hairstyle and outfit to: ${prompt}. Make the result photorealistic, hyperrealistic skin texture, sharp facial details, realistic natural hair texture, professional fashion editorial photography, studio lighting, high quality, 4k, true to life.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: enrichedPrompt },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(`Gemini ${response.status}: ${data.error.message}`);

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData || p.inline_data);
  const inline = imagePart?.inlineData || imagePart?.inline_data;
  if (!inline?.data) throw new Error("No image returned from Gemini — response may have been text-only");

  const mime = inline.mimeType || inline.mime_type || "image/png";
  return `data:${mime};base64,${inline.data}`;
}

// ── REPLICATE img2img (secondary fallback) ────────────────────────────────────
async function generateWithReplicate(prompt, imageBase64) {
  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

  const enrichedPrompt = `Take the exact person from the reference image — keep their face, skin tone, and body. Style them ${prompt}. Photorealistic, hyperrealistic skin texture, sharp facial details, realistic hair texture, 8k uhd, dslr photo, soft studio lighting, high fashion editorial photography, vogue magazine cover, true to life, masterpiece`;

  const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait=60",
    },
    body: JSON.stringify({
      input: {
        prompt: enrichedPrompt,
        image: `data:image/jpeg;base64,${imageBase64}`,
        prompt_strength: 0.75,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        width: 768,
        height: 1024,
        output_format: "jpeg",
        output_quality: 90,
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Replicate start failed: ${err.slice(0, 200)}`);
  }

  let prediction = await startRes.json();

  const maxWait = 90000;
  const interval = 3000;
  let waited = 0;

  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    if (waited >= maxWait) throw new Error("Replicate timed out after 90 seconds");
    await new Promise(r => setTimeout(r, interval));
    waited += interval;

    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
    });
    prediction = await pollRes.json();
  }

  if (prediction.status === "failed") {
    throw new Error(`Replicate generation failed: ${prediction.error}`);
  }

  const imageUrl = prediction.output?.[0] || prediction.output;
  if (!imageUrl) throw new Error("No image in Replicate response");

  const imgRes = await fetch(imageUrl);
  const buffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

// ── HUGGINGFACE text2img (final fallback) ─────────────────────────────────────
async function generateWithHuggingFace(prompt) {
  const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
  if (!HF_TOKEN) throw new Error("HUGGINGFACE_TOKEN not set");

  const enrichedPrompt = `${prompt}, highly detailed face, sharp eyes, realistic skin pores, subsurface scattering, 8k uhd, dslr photo, soft studio lighting, high fashion editorial photography, vogue magazine cover, masterpiece, best quality, hyperrealistic`;

  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: enrichedPrompt,
        parameters: {
          num_inference_steps: 8,
          width: 768,
          height: 1024,
          guidance_scale: 3.5,
        }
      })
    }
  );

  if (response.status === 503) throw new Error("Model warming up. Try again in 20 seconds.");
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HuggingFace ${response.status}: ${errText.slice(0, 200)}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

// ── /api/generate — Gemini (Nano Banana) → Replicate → HuggingFace ───────────
app.post("/api/generate", async (req, res) => {
  const { prompt, imageBase64 } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  if (process.env.GEMINI_API_KEY && imageBase64) {
    try {
      console.log("[/api/generate] Trying Gemini 2.5 Flash Image (Nano Banana)...");
      const image = await generateWithGemini(prompt, imageBase64);
      return res.json({ image, source: "gemini" });
    } catch (err) {
      console.error("[/api/generate] Gemini failed:", err.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN && imageBase64) {
    try {
      console.log("[/api/generate] Trying Replicate img2img...");
      const image = await generateWithReplicate(prompt, imageBase64);
      return res.json({ image, source: "replicate" });
    } catch (err) {
      console.error("[/api/generate] Replicate failed:", err.message);
    }
  }

  try {
    console.log("[/api/generate] Using HuggingFace fallback...");
    const image = await generateWithHuggingFace(prompt);
    return res.json({ image, source: "huggingface" });
  } catch (err) {
    console.error("[/api/generate] HuggingFace also failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✦ MIRRA API running on port ${PORT}`));
