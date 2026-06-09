import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";

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

// ── CLOUDFLARE FLUX.2 img2img (primary) ──────────────────────────────────────
async function generateWithCloudflare(prompt, imageBase64) {
  const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!CF_TOKEN || !CF_ACCOUNT) throw new Error("Cloudflare credentials not set");

  const enrichedPrompt = `Take the exact person from the reference image — keep their face, skin tone, and body exactly as they are. Style them ${prompt}. Photorealistic, hyperrealistic skin texture, sharp facial details, realistic hair texture, 8k uhd, dslr photo, soft studio lighting, high fashion editorial photography, vogue magazine cover, true to life, masterpiece`;

  const form = new FormData();
  form.append("prompt", enrichedPrompt);
  form.append("steps", "25");
  form.append("width", "768");
  form.append("height", "1024");

  // Attach user photo as reference image
  const imageBuffer = Buffer.from(imageBase64, "base64");
  form.append("input_image_0", imageBuffer, {
    filename: "reference.jpg",
    contentType: "image/jpeg",
  });

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/@cf/black-forest-labs/flux-2-dev`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_TOKEN}`,
        ...form.getHeaders(),
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.result?.image) throw new Error("No image in Cloudflare response");

  return `data:image/jpeg;base64,${data.result.image}`;
}

// ── HUGGINGFACE text2img (fallback) ───────────────────────────────────────────
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

// ── /api/generate — Cloudflare primary, HuggingFace fallback ─────────────────
app.post("/api/generate", async (req, res) => {
  const { prompt, imageBase64 } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  if (process.env.CLOUDFLARE_API_TOKEN && imageBase64) {
    try {
      console.log("[/api/generate] Trying Cloudflare FLUX.2 img2img...");
      const image = await generateWithCloudflare(prompt, imageBase64);
      return res.json({ image, source: "cloudflare" });
    } catch (err) {
      console.error("[/api/generate] Cloudflare failed, falling back to HuggingFace:", err.message);
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
