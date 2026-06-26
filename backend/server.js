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
    "http://localhost:5174",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Garment images ─────────────────────────────────────────────────────────────
const GARMENT_IMAGES = {
  gala: "https://mirra-backend-b1c7.onrender.com/garments/gala.jpg",
  business: "https://mirra-backend-b1c7.onrender.com/garments/business.jpg",
  street: "https://mirra-backend-b1c7.onrender.com/garments/street.jpg",
};

// ── Upload a base64 image to Leffa's /upload endpoint ─────────────────────────
async function uploadImageToLeffa(base64Data, filename = "person.jpg") {
  const buffer = Buffer.from(base64Data, "base64");
  const form = new FormData();
  form.append("files", buffer, {
    filename,
    contentType: "image/jpeg",
  });

  const res = await fetch("https://franciszzj-leffa.hf.space/gradio_api/upload", {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Leffa upload failed: HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  // Returns an array of uploaded paths, e.g. ["/tmp/gradio/abc123/person.jpg"]
  return json[0];
}

// ── Upload a garment from URL to Leffa ────────────────────────────────────────
async function uploadGarmentToLeffa(garmentUrl) {
  console.log("[Leffa] Fetching garment from:", garmentUrl);
  const imgRes = await fetch(garmentUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch garment: ${imgRes.status}`);
  const buffer = await imgRes.buffer();

  const form = new FormData();
  form.append("files", buffer, {
    filename: "garment.jpg",
    contentType: "image/jpeg",
  });

  const uploadRes = await fetch("https://franciszzj-leffa.hf.space/gradio_api/upload", {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Leffa garment upload failed: HTTP ${uploadRes.status}: ${text}`);
  }

  const json = await uploadRes.json();
  console.log("[Leffa] Garment uploaded:", json[0]);
  return json[0];
}

// ── Submit Leffa virtual try-on and poll for result ───────────────────────────
async function generateWithLeffa(personBase64, garmentUrl) {
  console.log("[Leffa] Uploading person image...");
  const personPath = await uploadImageToLeffa(personBase64, "person.jpg");
  console.log("[Leffa] Person uploaded:", personPath);

  console.log("[Leffa] Uploading garment image...");
  const garmentPath = await uploadGarmentToLeffa(garmentUrl);

  // Submit the try-on job
  console.log("[Leffa] Submitting virtual try-on job...");
  const submitRes = await fetch(
    "https://franciszzj-leffa.hf.space/gradio_api/call/leffa_predict_vt",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          { path: personPath },       // person image (uploaded)
          { path: garmentPath },      // garment image (uploaded)
          true,                       // ref_acceleration
          50,                         // step
          2.5,                        // scale
          42,                         // seed
          "viton_hd",                 // vt_model_type
          "upper",                    // vt_garment_type
          false,                      // vt_repaint
        ],
      }),
    }
  );

  if (!submitRes.ok) {
    const text = await submitRes.text();
    throw new Error(`Leffa submit failed: HTTP ${submitRes.status}: ${text}`);
  }

  const { event_id } = await submitRes.json();
  console.log("[Leffa] Polling for result, event:", event_id);

  // Poll the SSE stream
  const pollRes = await fetch(
    `https://franciszzj-leffa.hf.space/gradio_api/call/leffa_predict_vt/${event_id}`
  );

  if (!pollRes.ok) {
    throw new Error(`Leffa poll failed: HTTP ${pollRes.status}`);
  }

  // Read SSE stream until complete or error
  const text = await pollRes.text();
  const lines = text.split("\n");

  let lastEvent = null;
  let lastData = null;

  for (const line of lines) {
    if (line.startsWith("event:")) lastEvent = line.replace("event:", "").trim();
    if (line.startsWith("data:")) lastData = line.replace("data:", "").trim();
  }

  if (lastEvent === "error") {
    throw new Error(`Leffa processing error: ${lastData}`);
  }

  if (lastEvent !== "complete" || !lastData || lastData === "null") {
    throw new Error(`Leffa did not complete. Last event: ${lastEvent}`);
  }

  const result = JSON.parse(lastData);
  // result[0] is the output image FileData
  const outputFile = result[0];

  // The URL field gives us the full accessible URL
  if (outputFile && outputFile.url) {
    // Rewrite to correct gradio_api path if needed
    const rawUrl = outputFile.url;
    const correctedUrl = rawUrl.replace(
      /\/call\/leffa\/file=/,
      "/gradio_api/file="
    ).replace(
      /\/file=/,
      "/gradio_api/file="
    );
    console.log("[Leffa] Result URL:", correctedUrl);

    // Fetch the image and return as base64
    const imgRes = await fetch(correctedUrl);
    if (!imgRes.ok) throw new Error(`Leffa image fetch failed: ${imgRes.status}`);
    const imgBuffer = await imgRes.buffer();
    return `data:image/webp;base64,${imgBuffer.toString("base64")}`;
  }

  throw new Error("Leffa returned no output URL");
}

// ── Replicate two-step fallback ───────────────────────────────────────────────
async function generateWithReplicate(prompt, personBase64) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) throw new Error("No Replicate token");

  console.log("[Step 1] Generating fashion model with FLUX...");
  const fluxRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({ input: { prompt, aspect_ratio: "2:3", output_format: "webp" } }),
  });

  const fluxData = await fluxRes.json();
  if (!fluxRes.ok) throw new Error(`FLUX start failed: ${JSON.stringify(fluxData)}`);

  const fluxImageUrl = Array.isArray(fluxData.output) ? fluxData.output[0] : fluxData.output;
  if (!fluxImageUrl) throw new Error("FLUX returned no image");

  console.log("[Step 2] Running FaceSwap...");
  const swapRes = await fetch("https://api.replicate.com/v1/models/yan-ops/face-swap/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        target_image: fluxImageUrl,
        swap_image: `data:image/jpeg;base64,${personBase64}`,
        target_face_index: 0,
        swap_face_index: 0,
      },
    }),
  });

  const swapData = await swapRes.json();
  if (!swapRes.ok) throw new Error(`FaceSwap failed: ${JSON.stringify(swapData)}`);

  return Array.isArray(swapData.output) ? swapData.output[0] : swapData.output;
}

// ── HuggingFace FLUX fallback ─────────────────────────────────────────────────
async function generateWithHuggingFace(prompt) {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  if (!HF_API_KEY) throw new Error("No HuggingFace API key");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace ${response.status}: ${errorText}`);
  }

  const buffer = await response.buffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

// ── Main generate route ───────────────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  const { prompt, imageBase64, outfitId } = req.body;

  console.log("[/api/generate] prompt length:", prompt?.length);
  console.log("[/api/generate] imageBase64 present:", !!imageBase64);
  console.log("[/api/generate] outfitId:", outfitId);

  const garmentUrl = GARMENT_IMAGES[outfitId];
  console.log("[/api/generate] garment image available:", !!garmentUrl);

  // 1. Try Leffa
  if (imageBase64 && garmentUrl) {
    try {
      const result = await generateWithLeffa(imageBase64, garmentUrl);
      return res.json({ imageUrl: result, method: "leffa" });
    } catch (err) {
      console.log("[/api/generate] Leffa failed:", err.message);
    }
  }

  // 2. Try Replicate two-step
  try {
    const result = await generateWithReplicate(prompt, imageBase64);
    return res.json({ imageUrl: result, method: "replicate" });
  } catch (err) {
    console.log("[/api/generate] Two-step failed:", err.message);
  }

  // 3. Try HuggingFace FLUX
  console.log("[/api/generate] Using HuggingFace fallback...");
  try {
    const result = await generateWithHuggingFace(prompt);
    return res.json({ imageUrl: result, method: "huggingface" });
  } catch (err) {
    console.log("[/api/generate] All methods failed:", err.message);
    return res.status(500).json({ error: "All generation methods failed", details: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✦ MIRRA API running on port ${PORT}`);
});
