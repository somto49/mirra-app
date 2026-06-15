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
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: `You are an expert at analyzing human appearances for AI image generation. Study this person's face and body very carefully and return ONLY a valid JSON object — no markdown, no backticks, no extra text:
{
  "skinTone": "very precise skin tone e.g. deep ebony with cool undertones, rich dark brown with warm undertones",
  "faceShape": "face shape e.g. oval, round, square, heart, oblong",
  "facialFeatures": "very detailed facial features e.g. broad flat nose, full lips, strong jawline, high cheekbones, dark brown eyes, thick eyebrows",
  "bodyBuild": "detailed body build e.g. broad shoulders, athletic build, slim waist",
  "gender": "woman or man or boy or girl",
  "ageRange": "approximate age e.g. 12 years old, mid 20s, early 30s",
  "currentStyle": "one sentence about their current style",
  "realisticVisionPrompt": "RAW photo, a [exact age] [gender], [skin tone] skin, [face shape] face, [detailed facial features], [body build], natural skin texture, skin pores visible, shot on Canon EOS R5, 85mm lens, f/1.8 aperture, soft natural window light, professional fashion portrait"
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

// ── Prompt builders ───────────────────────────────────────────────────────────

// Base fashion model prompt — macro skin texture + dynamic expression + complex lighting
function buildFashionModelPrompt(personPrompt, outfitHairPrompt) {
  return [
    // Subject
    personPrompt,
    outfitHairPrompt,

    // 1. Macro-texture skin (raw, unretouched look)
    "hyper-realistic macro skin texture showing visible pores, natural skin imperfections, micro-hairs on skin surface, natural hydration sheen, visible capillary details near the eyes, raw unretouched skin, subsurface scattering on cheeks and lips where light passes through skin creating warm glow",

    // 2. Dynamic expression (warm engagement, not blank)
    "subtle warm genuine engagement in the eyes, a natural smize with micro-tension in lower eyelids, slight relaxation in the brow, human natural expression with inner life and depth, not a blank stare",

    // 3. Complex lighting physics
    "short lighting technique with raking side light sculpting facial structure, high contrast directional light emphasizing bone structure, distinct sharp catchlights in pupils, cinematic lens flare, deep focus luxury fashion showroom background",

    // 4. Hair quality
    "individual hair strands visible, realistic hair texture and volume, true-to-life 4C coil pattern definition, natural hair movement",

    // 5. Technical
    "shot on Phase One IQ4 150MP medium format camera, 85mm f/1.4 lens, shallow depth of field, high resolution macro photography, 8k uhd, professional fashion editorial photography, Vogue magazine quality, masterpiece",
  ].join(", ");
}

// Fallback prompt for HuggingFace
function buildRealisticPrompt(prompt) {
  return `RAW photo, ${prompt}, hyper-realistic skin texture, visible pores, subsurface scattering, realistic hair strands, true-to-life fabric drape, short lighting, catchlights in eyes, cinematic, ultra-realistic, photorealistic, 8k uhd, masterpiece`;
}

// ── Helper: poll Replicate until done ────────────────────────────────────────
async function pollReplicate(predictionId, token, maxWait = 120000) {
  const interval = 3000;
  let waited = 0;
  let prediction = { status: "starting" };

  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    if (waited >= maxWait) throw new Error("Replicate timed out");
    await new Promise(r => setTimeout(r, interval));
    waited += interval;

    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    prediction = await pollRes.json();
  }

  if (prediction.status === "failed") throw new Error(`Replicate failed: ${prediction.error}`);
  return prediction.output?.[0] || prediction.output;
}

// ── Step 1: Generate fashion model with FLUX ──────────────────────────────────
async function generateFashionModel(prompt, personData) {
  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

  const gender = personData?.gender || "person";
  const skinTone = personData?.skinTone || "deep dark brown skin";
  const bodyBuild = personData?.bodyBuild || "athletic build";
  const ageRange = personData?.ageRange || "";

  const personPrompt = `a ${ageRange} ${gender}, ${skinTone} skin, ${bodyBuild}`;
  const fashionPrompt = buildFashionModelPrompt(personPrompt, prompt);

  console.log("[Step 1] Generating fashion model with FLUX...");

  const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait=60",
    },
    body: JSON.stringify({
      input: {
        prompt: fashionPrompt,
        num_inference_steps: 35,
        guidance_scale: 4.0,
        width: 768,
        height: 1024,
        output_format: "jpg",
        output_quality: 97,
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`FLUX start failed: ${err.slice(0, 200)}`);
  }

  const prediction = await startRes.json();
  if (prediction.status === "succeeded") return prediction.output?.[0] || prediction.output;
  return await pollReplicate(prediction.id, REPLICATE_TOKEN);
}

// ── Step 2: Swap face ─────────────────────────────────────────────────────────
async function swapFace(sourceImageBase64, targetImageUrl) {
  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

  console.log("[Step 2] Swapping face onto fashion model...");

  const models = [
    {
      url: "https://api.replicate.com/v1/models/cdingram/face-swap/predictions",
      input: {
        target_image: targetImageUrl,
        source_image: `data:image/jpeg;base64,${sourceImageBase64}`,
      },
    },
    {
      url: "https://api.replicate.com/v1/models/lucataco/faceswap/predictions",
      input: {
        target_image: targetImageUrl,
        swap_image: `data:image/jpeg;base64,${sourceImageBase64}`,
      },
    },
  ];

  for (const model of models) {
    try {
      const startRes = await fetch(model.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
          "Prefer": "wait=60",
        },
        body: JSON.stringify({ input: model.input }),
      });

      if (!startRes.ok) {
        const err = await startRes.text();
        console.log(`[Step 2] Model failed: ${err.slice(0, 100)}, trying next...`);
        continue;
      }

      const prediction = await startRes.json();
      let outputUrl;

      if (prediction.status === "succeeded") {
        outputUrl = prediction.output?.[0] || prediction.output;
      } else {
        outputUrl = await pollReplicate(prediction.id, REPLICATE_TOKEN);
      }

      if (outputUrl) {
        console.log("[Step 2] Face swap succeeded!");
        return outputUrl;
      }
    } catch (err) {
      console.log(`[Step 2] Error: ${err.message}, trying next...`);
      continue;
    }
  }

  throw new Error("All face swap models failed");
}

// ── /api/generate — Two-step: FLUX + FaceSwap ────────────────────────────────
app.post("/api/generate", async (req, res) => {
  const { prompt, imageBase64, personData } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  console.log("[/api/generate] prompt length:", prompt?.length);
  console.log("[/api/generate] imageBase64 present:", !!imageBase64);
  console.log("[/api/generate] REPLICATE_API_TOKEN present:", !!process.env.REPLICATE_API_TOKEN);

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (REPLICATE_TOKEN && imageBase64) {
    try {
      const fashionModelUrl = await generateFashionModel(prompt, personData);
      console.log("[Step 1] Fashion model generated:", fashionModelUrl);

      const finalImageUrl = await swapFace(imageBase64, fashionModelUrl);
      console.log("[Step 2] Face swap complete");

      const imgRes = await fetch(finalImageUrl);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return res.json({ image: `data:image/jpeg;base64,${base64}`, source: "faceswap" });

    } catch (err) {
      console.error("[/api/generate] Two-step failed:", err.message);
    }
  }

  // Fallback — HuggingFace FLUX.1-schnell
  try {
    console.log("[/api/generate] Using HuggingFace fallback...");
    const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
    if (!HF_TOKEN) throw new Error("HUGGINGFACE_TOKEN not set");

    const enrichedPrompt = buildRealisticPrompt(prompt);
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
          parameters: { num_inference_steps: 8, width: 768, height: 1024, guidance_scale: 0 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace ${response.status}: ${errText.slice(0, 200)}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return res.json({ image: `data:image/jpeg;base64,${base64}`, source: "huggingface" });

  } catch (err) {
    console.error("[/api/generate] All methods failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✦ MIRRA API running on port ${PORT}`));
