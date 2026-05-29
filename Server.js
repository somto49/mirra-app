import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "20mb" }));

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "CROWN API is running ✦" });
});

// ── API ROUTES ───────────────────────────────────────────────────────────────
// Keep your existing /api/analyze and /api/generate routes here...
// (Paste your original routes for /api/analyze and /api/generate here)

// ── CATCH-ALL HANDLER ────────────────────────────────────────────────────────
// THIS IS THE FIX: Explicitly handle non-API routes to prevent 
// the server from trying to look for a non-existent 'dist' directory.
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  next();
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✦ CROWN API running on port ${PORT}`);
});
