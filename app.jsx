import { useState, useRef, useCallback } from "react";

const T = {
  bg: "#080604",
  surface: "#110D08",
  card: "#1A1208",
  border: "#2A1E0E",
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDim: "#7A5E2A",
  cream: "#F5EDD8",
  muted: "#7A6A50",
  green: "#4CAF7A",
};

const HAIRSTYLES = [
  { id: "twa", label: "TWA", desc: "Teeny Weeny Afro" },
  { id: "afro", label: "Full Afro", desc: "Big crown energy" },
  { id: "bantu", label: "Bantu Knots", desc: "Sculptural & regal" },
  { id: "braids", label: "Box Braids", desc: "Long & protective" },
  { id: "locs", label: "Faux Locs", desc: "Boho goddess" },
  { id: "sisterlocks", label: "Sisterlocks", desc: "Refined & elegant" },
  { id: "halo", label: "Halo Braid", desc: "Crowned royalty" },
  { id: "puff", label: "Afro Puff", desc: "High & proud" },
  { id: "flattwist", label: "Flat Twists", desc: "Sleek & defined" },
  { id: "cornrows", label: "Cornrows", desc: "Classic & sharp" },
];

const OUTFITS = [
  { id: "gala", label: "Black Tie Gala", desc: "Floor-length elegance", category: "Formal" },
  { id: "editorial", label: "Editorial", desc: "High fashion shoot", category: "Fashion" },
  { id: "street", label: "Street Luxe", desc: "Designer streetwear", category: "Casual" },
  { id: "business", label: "Power Suit", desc: "Boardroom authority", category: "Professional" },
  { id: "resort", label: "Resort Wear", desc: "Coastal luxury", category: "Vacation" },
  { id: "cocktail", label: "Cocktail", desc: "Evening chic", category: "Formal" },
  { id: "afrofusion", label: "Afro Fusion", desc: "Bold prints & cuts", category: "Cultural" },
  { id: "athleisure", label: "Athleisure", desc: "Elevated activewear", category: "Casual" },
  { id: "boho", label: "Boho Luxe", desc: "Flowing & free", category: "Casual" },
  { id: "monochrome", label: "Monochrome", desc: "One-color power", category: "Fashion" },
];

const HAIR_PROMPTS = {
  twa: "teeny weeny natural afro TWA hairstyle, close-cropped 4C coils, beautiful natural hair",
  afro: "large full natural afro, big voluminous 4C coil crown, gorgeous natural hair",
  bantu: "sculptural bantu knots hairstyle, perfectly sectioned knots, 4C natural hair",
  braids: "long box braids hairstyle, neat and uniform braids, protective style",
  locs: "faux locs hairstyle, bohemian goddess locs, natural hair protective style",
  sisterlocks: "sisterlocks hairstyle, fine uniform locs, elegant natural hair",
  halo: "halo braid crown hairstyle, elegant updo braided crown, regal look",
  puff: "high afro puff hairstyle, voluminous top puff, 4C natural hair",
  flattwist: "flat twist hairstyle, defined sleek flat twists, natural hair",
  cornrows: "neat cornrow braids, precise geometric parts, classic protective style",
};

const OUTFIT_PROMPTS = {
  gala: "wearing an exquisite floor-length black tie gown, deep jewel tones, elegant draping, crystal embellishments",
  editorial: "wearing high fashion editorial clothing, avant-garde designer outfit, fashion magazine cover look",
  street: "wearing luxury streetwear, designer hoodie and tailored joggers, high-end sneakers",
  business: "wearing a sharp power suit, tailored blazer and trousers, professional executive fashion",
  resort: "wearing resort wear, elegant flowing linen outfit, coastal luxury fashion",
  cocktail: "wearing a stunning cocktail dress, sophisticated evening wear, chic party outfit",
  afrofusion: "wearing vibrant African print fashion, Ankara fabric dress, Afrocentric luxury fashion, bold patterns",
  athleisure: "wearing elevated athleisure, luxury activewear, designer sports outfit",
  boho: "wearing bohemian luxury fashion, flowing maxi dress, earthy tones, boho chic",
  monochrome: "wearing a monochromatic power outfit, single color coordinated fashion, bold and striking",
};

// ── SECURE SERVER ROUTE FOR GEMINI ANALYSIS ──────────────────────────────────
async function analyzeWithGemini(imageBase64) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── SECURE SERVER ROUTE FOR FLUX GENERATION ──────────────────────────────────
async function generateWithFlux(prompt) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.image; 
}

// ── UI HELPERS ───────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.goldDim})` }} />
      <span style={{ color: T.goldDim, fontSize: 8, letterSpacing: 4 }}>✦ ✦ ✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${T.goldDim})` }} />
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 40,
      border: `1px solid ${active ? T.gold : T.border}`,
      background: active ? `${T.gold}18` : "transparent",
      color: active ? T.goldLight : T.muted,
      fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
      cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function SelectCard({ item, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? `${T.gold}12` : T.card,
      border: `1px solid ${selected ? T.gold : T.border}`,
      borderRadius: 12, padding: "14px 18px",
      cursor: "pointer", textAlign: "left",
      transition: "all 0.2s", fontFamily: "inherit", position: "relative",
    }}>
      {selected && <div style={{ position: "absolute", top: 8, right: 10, color: T.gold, fontSize: 10 }}>✦</div>}
      <div style={{ color: selected ? T.goldLight : T.cream, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
        {item.label}
      </div>
      <div style={{ color: T.muted, fontSize: 11 }}>{item.desc || item.category}</div>
    </button>
  );
}

function ApiSetup({ geminiKey, setGeminiKey, hfToken, setHfToken, onDone }) {
  const geminiOk = geminiKey.trim().length > 10;
  const hfOk = hfToken.trim().startsWith("hf_");

  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40,
    }}>
      <div style={{ maxWidth: 500, width: "100%" }}>
        <div style={{ fontSize: 9, letterSpacing: 6, color: T.gold, textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
          One-Time Setup
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 400, letterSpacing: 2, textAlign: "center" }}>
          Connect Free APIs
        </h2>
        <p style={{ color: T.muted, fontSize: 13, textAlign: "center", marginBottom: 32, lineHeight: 1.7 }}>
          Both APIs are completely free. No credit card needed.
        </p>

        {/* Gemini */}
        <div style={{ background: T.card, border: `1px solid ${geminiOk ? T.gold : T.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ color: T.cream, fontSize: 14, fontWeight: 600 }}>Google Gemini</div>
              <div style={{ color: T.muted, fontSize: 11 }}>Photo analysis · 1500 free/day</div>
            </div>
            {geminiOk
              ? <span style={{ color: T.green, fontSize: 11, letterSpacing: 2 }}>✦ CONNECTED</span>
              : <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                  style={{ color: T.gold, fontSize: 11, letterSpacing: 2, textDecoration: "none" }}>GET KEY →</a>
            }
          </div>
          <input
            type="password"
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="Paste your Gemini API key here"
            style={{
              width: "100%", background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "10px 14px", color: T.cream,
              fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* HuggingFace */}
        <div style={{ background: T.card, border: `1px solid ${hfOk ? T.gold : T.border}`, borderRadius: 16, padding: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ color: T.cream, fontSize: 14, fontWeight: 600 }}>HuggingFace</div>
              <div style={{ color: T.muted, fontSize: 11 }}>FLUX.1 image generation · Free</div>
            </div>
            {hfOk
              ? <span style={{ color: T.green, fontSize: 11, letterSpacing: 2 }}>✦ CONNECTED</span>
              : <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer"
                  style={{ color: T.gold, fontSize: 11, letterSpacing: 2, textDecoration: "none" }}>GET KEY →</a>
            }
          </div>
          <input
            type="password"
            value={hfToken}
            onChange={e => setHfToken(e.target.value)}
            placeholder="hf_xxxxxxxxxxxxxxxx"
            style={{
              width: "100%", background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "10px 14px", color: T.cream,
              fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={onDone}
          disabled={!geminiOk || !hfOk}
          style={{
            width: "100%",
            background: geminiOk && hfOk ? `linear-gradient(135deg, #8B6914, ${T.gold}, ${T.goldLight})` : T.card,
            border: `1px solid ${geminiOk && hfOk ? T.gold : T.border}`,
            borderRadius: 14, padding: "18px",
            color: geminiOk && hfOk ? T.bg : T.muted,
            fontSize: 12, letterSpacing: 4, textTransform: "uppercase",
            cursor: geminiOk && hfOk ? "pointer" : "default",
            fontFamily: "inherit", fontWeight: 700, transition: "all 0.3s",
          }}
        >
          {geminiOk && hfOk ? "✦ Enter CROWN" : "Add Both Keys to Continue"}
        </button>

        <p style={{ color: T.muted, fontSize: 10, textAlign: "center", marginTop: 16, letterSpacing: 1, lineHeight: 1.8 }}>
          Keys stay in your browser only · Never stored or shared · Delete anytime
        </p>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [geminiKey, setGeminiKey] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [step, setStep] = useState("upload");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [personData, setPersonData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedHair, setSelectedHair] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("hair");
  const [history, setHistory] = useState([]);
  const fileRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
    setAnalyzing(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result.split(",")[1];
      setPhotoBase64(b64);
      try {
        const data = await analyzeWithGemini(b64, geminiKey);
        setPersonData(data);
        setStep("configure");
      } catch (e) {
        setError("Photo analysis failed: " + e.message);
        setStep("upload");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, [geminiKey]);

  const handleGenerate = async () => {
    if (!selectedHair || !selectedOutfit) return;
    setGenerating(true);
    setStep("generating");
    setError(null);

    const hairPrompt = HAIR_PROMPTS[selectedHair];
    const outfitPrompt = OUTFIT_PROMPTS[selectedOutfit];
    const base = personData?.fluxPromptBase || "A beautiful woman with rich deep brown skin,";
    const finalPrompt = `${base} ${outfitPrompt}, ${hairPrompt}, professional fashion photography, editorial lighting, luxury magazine shoot, sharp focus, photorealistic, 8k, cinematic composition`;

    try {
      const url = await generateWithFlux(finalPrompt, hfToken);
      setGeneratedImage(url);
      const hair = HAIRSTYLES.find(h => h.id === selectedHair);
      const outfit = OUTFITS.find(o => o.id === selectedOutfit);
      setHistory(prev => [{ url, hair: hair.label, outfit: outfit.label, id: Date.now() }, ...prev.slice(0, 5)]);
      setStep("result");
    } catch (e) {
      setError(e.message);
      setStep("configure");
    }
    setGenerating(false);
  };

  const reset = () => {
    setStep("upload");
    setPhotoUrl(null);
    setPhotoBase64(null);
    setPersonData(null);
    setSelectedHair(null);
    setSelectedOutfit(null);
    setGeneratedImage(null);
    setError(null);
  };

  const hair = HAIRSTYLES.find(h => h.id === selectedHair);
  const outfit = OUTFITS.find(o => o.id === selectedOutfit);
  const geminiOk = geminiKey.trim().length > 10;
  const hfOk = hfToken.trim().startsWith("hf_");

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.cream,
      fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* HEADER */}
      <header style={{
        padding: "24px 32px 18px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `linear-gradient(to bottom, #0F0A05, transparent)`,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 26, letterSpacing: 8, fontWeight: 400 }}>CROWN</h1>
            <span style={{ color: T.gold, fontSize: 10, letterSpacing: 6, textTransform: "uppercase" }}>by Aya</span>
          </div>
          <p style={{ margin: 0, fontSize: 10, letterSpacing: 4, color: T.muted, textTransform: "uppercase" }}>
            AI Virtual Try-On · 4C Hair Specialist
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setSetupDone(false)} style={{
            background: "none",
            border: `1px solid ${geminiOk && hfOk ? T.gold : T.border}`,
            borderRadius: 8, padding: "6px 14px",
            color: geminiOk && hfOk ? T.gold : T.muted,
            fontSize: 10, letterSpacing: 2, cursor: "pointer",
            fontFamily: "inherit", textTransform: "uppercase",
          }}>
            {geminiOk && hfOk ? "✦ APIs Connected" : "Setup APIs"}
          </button>
          {step !== "upload" && setupDone && (
            <button onClick={reset} style={{
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "6px 14px", color: T.muted,
              fontSize: 10, letterSpacing: 2, cursor: "pointer",
              fontFamily: "inherit", textTransform: "uppercase",
            }}>New Look</button>
          )}
        </div>
      </header>

      {error && (
        <div style={{
          background: "#2A0A0A", borderBottom: `1px solid #5A1A1A`,
          padding: "10px 32px", color: "#E87070", fontSize: 12, letterSpacing: 1, flexShrink: 0,
        }}>⚠ {error}</div>
      )}

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* SETUP */}
        {!setupDone && (
          <ApiSetup
            geminiKey={geminiKey} setGeminiKey={setGeminiKey}
            hfToken={hfToken} setHfToken={setHfToken}
            onDone={() => setSetupDone(true)}
          />
        )}

        {/* UPLOAD */}
        {setupDone && (step === "upload" || analyzing) && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 6, color: T.gold, textTransform: "uppercase", marginBottom: 16 }}>
                Step 01 · Upload
              </div>
              <h2 style={{ margin: "0 0 12px", fontSize: 40, fontWeight: 400, letterSpacing: 2, lineHeight: 1.1 }}>
                Your Crown.<br />Your Canvas.
              </h2>
              <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
                Upload a clear photo and Gemini AI will build a personalized fashion prompt —
                then FLUX.1 renders you styled in any outfit and 4C hairstyle.
              </p>

              <div
                onClick={() => !analyzing && fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: `1px dashed ${analyzing ? T.gold : T.goldDim}`,
                  borderRadius: 20, padding: "64px 40px",
                  cursor: analyzing ? "default" : "pointer",
                  background: analyzing ? `${T.gold}06` : T.card,
                  transition: "all 0.3s",
                }}
              >
                {analyzing ? (
                  <div>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      border: `2px solid ${T.goldDim}`, borderTopColor: T.gold,
                      animation: "spin 1s linear infinite", margin: "0 auto 20px",
                    }} />
                    <div style={{ color: T.gold, fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>
                      Gemini is analyzing your features...
                    </div>
                    <div style={{ color: T.muted, fontSize: 11, marginTop: 8 }}>
                      Reading skin tone, build & style
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
                    <div style={{ color: T.goldLight, fontSize: 15, letterSpacing: 2, marginBottom: 8 }}>
                      Drop your photo here
                    </div>
                    <div style={{ color: T.muted, fontSize: 12 }}>or click to browse · JPG, PNG, HEIC</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
              <GoldDivider />
              <p style={{ color: T.muted, fontSize: 11, letterSpacing: 1 }}>
                Best results with a clear, well-lit front-facing photo.
              </p>
            </div>
          </div>
        )}

        {/* CONFIGURE */}
        {setupDone && step === "configure" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Left panel */}
            <div style={{
              width: 270, flexShrink: 0, borderRight: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", background: T.surface, overflow: "auto",
            }}>
              <div style={{ padding: "20px 20px 0" }}>
                <div style={{ fontSize: 9, letterSpacing: 4, color: T.goldDim, textTransform: "uppercase", marginBottom: 10 }}>Your Photo</div>
                <img src={photoUrl} alt="uploaded" style={{
                  width: "100%", borderRadius: 14, border: `1px solid ${T.border}`,
                  objectFit: "cover", maxHeight: 280,
                }} />
              </div>
              {personData && (
                <div style={{ padding: "12px 20px" }}>
                  <GoldDivider />
                  <div style={{ fontSize: 9, letterSpacing: 4, color: T.goldDim, textTransform: "uppercase", marginBottom: 10 }}>AI Analysis</div>
                  {[["Skin Tone", personData.skinTone], ["Build", personData.bodyBuild], ["Style", personData.currentStyle]].map(([k, v]) => v && (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, letterSpacing: 3, color: T.goldDim, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, color: T.cream, lineHeight: 1.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ flex: 1 }} />
              <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
                {selectedHair && selectedOutfit && (
                  <div style={{ background: T.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}`, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginBottom: 4 }}>YOUR LOOK</div>
                    <div style={{ fontSize: 12, color: T.goldLight }}>{hair?.label} + {outfit?.label}</div>
                  </div>
                )}
                <button onClick={handleGenerate} disabled={!selectedHair || !selectedOutfit} style={{
                  width: "100%",
                  background: selectedHair && selectedOutfit ? `linear-gradient(135deg, #8B6914, ${T.gold}, ${T.goldLight})` : T.card,
                  border: `1px solid ${selectedHair && selectedOutfit ? T.gold : T.border}`,
                  borderRadius: 12, padding: "15px",
                  color: selectedHair && selectedOutfit ? T.bg : T.muted,
                  fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
                  cursor: selectedHair && selectedOutfit ? "pointer" : "default",
                  fontFamily: "inherit", fontWeight: 700, transition: "all 0.3s",
                }}>
                  {!selectedHair || !selectedOutfit ? "Select Hair + Outfit" : "✦ Generate My Look"}
                </button>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: T.goldDim, textTransform: "uppercase", marginBottom: 4 }}>Step 02 · Style</div>
              <h3 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 400, letterSpacing: 2 }}>Build Your Look</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                <Pill active={activeTab === "hair"} onClick={() => setActiveTab("hair")}>
                  {selectedHair ? `✦ ${hair?.label}` : "Hair Style"}
                </Pill>
                <Pill active={activeTab === "outfit"} onClick={() => setActiveTab("outfit")}>
                  {selectedOutfit ? `✦ ${outfit?.label}` : "Outfit"}
                </Pill>
              </div>

              {activeTab === "hair" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 20 }}>
                    All styles celebrate 4C natural hair — coily, tight curl patterns front and centre.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                    {HAIRSTYLES.map(h => (
                      <SelectCard key={h.id} item={h} selected={selectedHair === h.id}
                        onClick={() => { setSelectedHair(h.id); setActiveTab("outfit"); }} />
                    ))}
                  </div>
                </>
              )}

              {activeTab === "outfit" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 20 }}>
                    Each look is tailored to your specific skin tone and body type from Gemini's analysis.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                    {OUTFITS.map(o => (
                      <SelectCard key={o.id} item={o} selected={selectedOutfit === o.id}
                        onClick={() => setSelectedOutfit(o.id)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* GENERATING */}
        {setupDone && step === "generating" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28, padding: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                border: `2px solid ${T.border}`, borderTopColor: T.gold,
                animation: "spin 1.5s linear infinite", margin: "0 auto 28px",
              }} />
              <div style={{ fontSize: 11, letterSpacing: 6, color: T.gold, textTransform: "uppercase", marginBottom: 10 }}>Generating</div>
              <h2 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 400, letterSpacing: 2 }}>
                {hair?.label} + {outfit?.label}
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
                FLUX.1 is rendering your editorial look.<br />This takes 15–40 seconds.
              </p>
            </div>
            {photoUrl && (
              <img src={photoUrl} style={{
                height: 160, borderRadius: 14,
                border: `1px solid ${T.border}`,
                objectFit: "cover", filter: "brightness(0.5)",
              }} />
            )}
          </div>
        )}

        {/* RESULT */}
        {setupDone && step === "result" && generatedImage && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#050302" }}>
              <div style={{ position: "relative", maxWidth: 460, width: "100%" }}>
                <img src={generatedImage} alt="generated look" style={{
                  width: "100%", borderRadius: 20,
                  border: `1px solid ${T.border}`,
                  boxShadow: `0 40px 80px #000, 0 0 0 1px ${T.goldDim}30`,
                }} />
                <div style={{
                  position: "absolute", bottom: 16, left: 16,
                  background: `${T.bg}E0`, borderRadius: 10, padding: "10px 16px",
                  backdropFilter: "blur(10px)", border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 10, color: T.gold, letterSpacing: 3, textTransform: "uppercase" }}>
                    {hair?.label} · {outfit?.label}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: 290, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface }}>
              <div style={{ padding: "24px 24px 0", flex: 1, overflow: "auto" }}>
                <div style={{ fontSize: 9, letterSpacing: 4, color: T.goldDim, textTransform: "uppercase", marginBottom: 10 }}>Your Look</div>
                <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 400, letterSpacing: 1 }}>{hair?.label}</h3>
                <p style={{ margin: "0 0 4px", color: T.muted, fontSize: 12 }}>{hair?.desc}</p>
                <GoldDivider />
                <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 400, letterSpacing: 1 }}>{outfit?.label}</h3>
                <p style={{ margin: "0 0 4px", color: T.muted, fontSize: 12 }}>{outfit?.desc}</p>

                {history.length > 1 && (
                  <>
                    <GoldDivider />
                    <div style={{ fontSize: 9, letterSpacing: 4, color: T.goldDim, textTransform: "uppercase", marginBottom: 10 }}>Previous Looks</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {history.slice(1).map(h => (
                        <div key={h.id} onClick={() => setGeneratedImage(h.url)} style={{
                          display: "flex", gap: 10, alignItems: "center",
                          cursor: "pointer", padding: 8, borderRadius: 10,
                          border: `1px solid ${T.border}`, background: T.card,
                        }}>
                          <img src={h.url} style={{ width: 40, height: 52, objectFit: "cover", borderRadius: 6 }} />
                          <div>
                            <div style={{ fontSize: 11, color: T.cream }}>{h.hair}</div>
                            <div style={{ fontSize: 10, color: T.muted }}>{h.outfit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding: 20, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { setSelectedHair(null); setSelectedOutfit(null); setStep("configure"); }} style={{
                  background: `linear-gradient(135deg, #8B6914, ${T.gold})`,
                  border: "none", borderRadius: 12, padding: "14px",
                  color: T.bg, fontSize: 11, letterSpacing: 3, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, textTransform: "uppercase",
                }}>
                  Regenerate Look
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
