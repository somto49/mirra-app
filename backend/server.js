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

// ── Garment image library — confirmed free Pexels stock photos ──────────────
// TEST SET: only these 3 outfits are wired to real garment images right now.
// Remaining outfits will fall through to the prompt-only pipeline until more
// garment images are sourced.
const GARMENT_IMAGES = {
  gala: "https://images.pexels.com/photos/33665482/pexels-photo-33665482.jpeg?cs=srgb&fm=jpg",
  business: "https://images.pexels.com/photos/10419116/pexels-photo-10419116.jpeg?cs=srgb&fm=jpg",
  street: "https://images.pexels.com/photos/17474220/pexels-photo-17474220.jpeg?cs=srgb&fm=jpg",
};

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

function buildFashionModelPrompt(personPrompt, outfitHairPrompt) {
  return [
    personPrompt,
    outfitHairPrompt,
    "hyper-realistic macro skin texture showing visible pores, natural skin imperfections, micro-hairs on skin surface, natural hydration sheen, visible capillary details near the eyes, raw unretouched skin, subsurface scattering on cheeks and lips where light passes through skin creating warm glow",
    "subtle warm genuine engagement in the eyes, a natural smize with micro-tension in lower eyelids, slight relaxation in the brow, human natural expression with inner life and depth, not a blank stare",
    "short lighting technique with raking side light sculpting facial structure, high contrast directional light emphasizing bone structure, distinct sharp catchlights in pupils, cinematic lens flare, deep focus luxury fashion showroom background",
    "individual hair strands visible, realistic hair texture and volume, true-to-life 4C coil pattern definition, natural hair movement",
    "shot on Phase One IQ4 150MP medium format camera, 85mm f/1.4 lens, shallow depth of field, high resolution macro photography, 8k uhd, professional fashion editorial photography, Vogue magazine quality, masterpiece",
  ].join(", ");
}

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

// ── PRIMARY: free IDM-VTON HuggingFace Space (yisol/IDM-VTON) ────────────────
// Calls the Gradio REST API directly (submit -> poll) since this is Node, not
// Python, so the official gradio_client library can't be used.
// Confirmed endpoint pattern (Gradio's own curl docs):
//   POST {space}/call/{api_name}          -> { event_id }
//   GET  {space}/call/{api_name}/{event_id} -> SSE stream, "event: complete"
// File-type inputs are passed as { "path": "<url-or-data-uri>" }, not raw
// base64 strings.
// This is a FREE shared-GPU community Space — it can be slow, queued, or
// occasionally down since nobody is paying to keep it always-on.
async function generateWithIDMVTON(garmentImageUrl, personImageBase64, garmentDescription) {
  const HF_TOKEN = process.env.HUGGINGFACE_TOKEN; // optional but helps with rate limits
  const SPACE_BASE = "https://yisol-idm-vton.hf.space";

  const personDataUri = `data:image/jpeg;base64,${personImageBase64}`;

  console.log("[IDM-VTON] Submitting tryon job...");

  const submitRes = await fetch(`${SPACE_BASE}/call/tryon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      data: [
        { background: { path: personDataUri }, layers: [], composite: null },
        { path: garmentImageUrl },
        garmentDescription || "",
        true,   // is_checked (auto-mask)
        false,  // is_checked_crop
        30,     // denoise_steps
        42,     // seed
      ],
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`IDM-VTON submit failed: HTTP ${submitRes.status}: ${errText.slice(0, 200)}`);
  }

  const submitData = await submitRes.json();
  const eventId = submitData.event_id;
  if (!eventId) throw new Error("IDM-VTON: no event_id returned");

  console.log("[IDM-VTON] Polling for result, event:", eventId);

  const maxWait = 120000; // free Space can be slow under load
  const interval = 3000;
  let waited = 0;

  while (waited < maxWait) {
    await new Promise(r => setTimeout(r, interval));
    waited += interval;

    const resultRes = await fetch(`${SPACE_BASE}/call/tryon/${eventId}`, {
      headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {},
    });

    if (!resultRes.ok) continue; // not ready yet, keep polling

    const text = await resultRes.text();
    if (text.includes("event: complete") || text.includes('"msg":"process_completed"')) {
      const dataLineMatch = text.match(/data:\s*(\[.*\])/s);
      if (dataLineMatch) {
        const parsed = JSON.parse(dataLineMatch[1]);
        const imageOutput = parsed[0];
        const imageUrl = imageOutput?.url || imageOutput?.path || imageOutput;
        if (imageUrl) {
          console.log("[IDM-VTON] Result ready!");
          const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${SPACE_BASE}/file=${imageUrl}`;
          const imgRes = await fetch(fullUrl, { headers: HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {} });
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          return `data:image/jpeg;base64,${base64}`;
        }
      }
      throw new Error("IDM-VTON: completed but no image found in response");
    }

    if (text.includes("event: error") || text.includes('"msg":"process_completed_error"')) {
      throw new Error(`IDM-VTON processing error: ${text.slice(0, 200)}`);
    }
    // otherwise: still queued/processing, keep polling
  }

  throw new Error("IDM-VTON timed out — free Space may be overloaded or queued");
}

// ── FALLBACK 1: Replicate two-step — FLUX fashion model + faceswap ───────────
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

// ── /api/generate — IDM-VTON (free) → Replicate two-step → HuggingFace ───────
app.post("/api/generate", async (req, res) => {
  const { prompt, imageBase64, personData, outfitId } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  console.log("[/api/generate] prompt length:", prompt?.length);
  console.log("[/api/generate] imageBase64 present:", !!imageBase64);
  console.log("[/api/generate] outfitId:", outfitId);
  console.log("[/api/generate] garment image available:", !!GARMENT_IMAGES[outfitId]);

  // ── PRIMARY: IDM-VTON free Space — only if this outfit has a garment image ─
  if (imageBase64 && outfitId && GARMENT_IMAGES[outfitId]) {
    try {
      const image = await generateWithIDMVTON(GARMENT_IMAGES[outfitId], imageBase64, prompt);
      console.log("[/api/generate] IDM-VTON succeeded!");
      return res.json({ image, source: "idm-vton" });
    } catch (err) {
      console.error("[/api/generate] IDM-VTON failed:", err.message);
    }
  }

  // ── FALLBACK 1: Replicate two-step (FLUX + FaceSwap) ────────────────────
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

  // ── FALLBACK 2: HuggingFace FLUX.1-schnell (text-only) ───────────────────
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
