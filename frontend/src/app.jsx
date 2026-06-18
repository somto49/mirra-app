import { useState, useRef, useCallback } from "react";

const API_URL = "https://mirra-backend-b1c7.onrender.com";

const T = {
  bg: "#080A08",
  surface: "#0C100C",
  card: "#111611",
  border: "#1E2B1E",
  borderBright: "#2E4A2E",
  green: "#3DDB6A",
  greenDim: "#1A3D24",
  greenGlow: "#3DDB6A30",
  greenMid: "#2ABF55",
  greenDark: "#0F2018",
  white: "#F0F4F0",
  cream: "#D8E8D8",
  muted: "#5A7A5A",
  mutedBright: "#8AAA8A",
  error: "#E87070",
  errorBg: "#1A0808",
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
  { id: "gala", label: "Black Tie Gala", desc: "Floor-length elegance" },
  { id: "editorial", label: "Editorial", desc: "High fashion shoot" },
  { id: "street", label: "Street Luxe", desc: "Designer streetwear" },
  { id: "business", label: "Power Suit", desc: "Boardroom authority" },
  { id: "resort", label: "Resort Wear", desc: "Coastal luxury" },
  { id: "cocktail", label: "Cocktail", desc: "Evening chic" },
  { id: "afrofusion", label: "Afro Fusion", desc: "Bold prints & cuts" },
  { id: "athleisure", label: "Athleisure", desc: "Elevated activewear" },
  { id: "boho", label: "Boho Luxe", desc: "Flowing & free" },
  { id: "monochrome", label: "Monochrome", desc: "One-color power" },
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

async function analyzePhoto(imageBase64) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function generateLook(prompt, imageBase64, personData) {
  const res = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64, personData }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.image;
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepBar({ current }) {
  const steps = ["Capture", "Style", "Reveal"];
  const idx = { upload: 0, configure: 1, generating: 2, result: 2 }[current] ?? -1;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 0, padding: "14px 24px",
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
    }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: `1.5px solid ${i <= idx ? T.green : T.border}`,
              background: i < idx ? T.green : i === idx ? T.greenGlow : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: i <= idx ? T.green : T.muted,
              transition: "all 0.3s",
            }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
              color: i <= idx ? T.green : T.muted,
              transition: "all 0.3s",
            }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 48, height: 1, margin: "0 8px",
              background: i < idx ? T.green : T.border,
              marginBottom: 18, transition: "all 0.3s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ color: T.greenDim, fontSize: 8, letterSpacing: 3 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

// ── Style Card ────────────────────────────────────────────────────────────────
function StyleCard({ item, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? T.greenDark : hovered ? "#0F1A0F" : T.card,
        border: `1px solid ${selected ? T.green : hovered ? T.borderBright : T.border}`,
        borderRadius: 10, padding: "12px 14px",
        cursor: "pointer", textAlign: "left",
        transition: "all 0.18s", fontFamily: "inherit", position: "relative",
        boxShadow: selected ? `0 0 20px ${T.green}20` : "none",
        width: "100%",
      }}>
      {selected && (
        <div style={{
          position: "absolute", top: 8, right: 10,
          width: 16, height: 16, borderRadius: "50%",
          background: T.green, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 8, color: "#000",
        }}>✓</div>
      )}
      <div style={{
        color: selected ? T.green : T.white,
        fontSize: 13, fontWeight: 600, marginBottom: 2,
        transition: "color 0.18s",
      }}>
        {item.label}
      </div>
      <div style={{ color: T.muted, fontSize: 11 }}>{item.desc}</div>
    </button>
  );
}

// ── Before/After Slider ───────────────────────────────────────────────────────
function BeforeAfterSlider({ beforeUrl, afterUrl }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef();

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={e => handleMove(e.clientX)}
      onTouchMove={e => handleMove(e.touches[0].clientX)}
      style={{
        position: "relative", width: "100%", borderRadius: 16,
        overflow: "hidden", cursor: "ew-resize", userSelect: "none",
        border: `1px solid ${T.border}`,
      }}
    >
      <img src={afterUrl} alt="after" style={{ width: "100%", display: "block" }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: `${sliderPos}%`, height: "100%", overflow: "hidden" }}>
        <img src={beforeUrl} alt="before" style={{ width: containerRef.current?.offsetWidth || 400, maxWidth: "none", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 0, left: `${sliderPos}%`, transform: "translateX(-50%)", width: 2, height: "100%", background: T.green }} />
      <div style={{
        position: "absolute", top: "50%", left: `${sliderPos}%`,
        transform: "translate(-50%, -50%)",
        width: 32, height: 32, borderRadius: "50%",
        background: T.green, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 12, color: "#000", fontWeight: 700,
        boxShadow: `0 0 16px ${T.green}60`,
      }}>⇔</div>
      <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.75)", borderRadius: 5, padding: "3px 9px", fontSize: 9, color: "#aaa", letterSpacing: 2, textTransform: "uppercase" }}>Before</div>
      <div style={{ position: "absolute", bottom: 12, right: 12, background: `${T.green}22`, border: `1px solid ${T.green}`, borderRadius: 5, padding: "3px 9px", fontSize: 9, color: T.green, letterSpacing: 2, textTransform: "uppercase" }}>After</div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("hero");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [personData, setPersonData] = useState(null);
  const [selectedHair, setSelectedHair] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("hair");
  const [history, setHistory] = useState([]);
  const [showSlider, setShowSlider] = useState(false);
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
        const data = await analyzePhoto(b64);
        setPersonData(data);
        setStep("configure");
      } catch (e) {
        setError("Photo analysis failed — " + e.message);
        setStep("upload");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!selectedHair || !selectedOutfit) return;
    setStep("generating");
    setError(null);
    setShowSlider(false);
    const gender = personData?.gender || "person";
    const skinTone = personData?.skinTone || "rich deep brown skin";
    const bodyBuild = personData?.bodyBuild || "";
    const facialFeatures = personData?.facialFeatures || "";
    const base = personData?.realisticVisionPrompt ||
      `RAW photo, a ${gender}, ${skinTone}, ${facialFeatures}, ${bodyBuild}, natural skin texture, professional fashion portrait`;
    const prompt = `${base}, ${OUTFIT_PROMPTS[selectedOutfit]}, ${HAIR_PROMPTS[selectedHair]}, professional fashion photography, editorial lighting, luxury magazine shoot, sharp focus, photorealistic, 8k`;
    try {
      const url = await generateLook(prompt, photoBase64, personData);
      setGeneratedImage(url);
      const h = HAIRSTYLES.find(h => h.id === selectedHair);
      const o = OUTFITS.find(o => o.id === selectedOutfit);
      setHistory(prev => [{ url, hair: h.label, outfit: o.label, id: Date.now() }, ...prev.slice(0, 5)]);
      setStep("result");
    } catch (e) {
      setError(e.message);
      setStep("configure");
    }
  };

  const reset = () => {
    setStep("hero");
    setPhotoUrl(null); setPhotoBase64(null);
    setPersonData(null); setSelectedHair(null);
    setSelectedOutfit(null); setGeneratedImage(null);
    setError(null); setShowSlider(false);
  };

  const hair = HAIRSTYLES.find(h => h.id === selectedHair);
  const outfit = OUTFITS.find(o => o.id === selectedOutfit);
  const showStepBar = ["upload", "configure", "generating", "result"].includes(step);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.white,
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      display: "flex", flexDirection: "column", maxWidth: "100vw", overflowX: "hidden",
    }}>

      {/* ── Header ── */}
      <header style={{
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)",
        flexShrink: 0,
      }}>
        <div onClick={reset} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${T.green}, ${T.greenMid})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#000", fontWeight: 900,
            }}>M</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 4, color: T.white }}>MIRRA</div>
              <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginTop: -1 }}>4C Hair · AI Try-On</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            border: `1px solid ${T.greenDim}`, borderRadius: 20,
            padding: "4px 10px", fontSize: 9, color: T.green, letterSpacing: 1,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
            Live
          </div>
          {step !== "hero" && (
            <button onClick={reset} style={{
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: 20, padding: "4px 12px", color: T.muted,
              fontSize: 9, letterSpacing: 2, cursor: "pointer",
              fontFamily: "inherit", textTransform: "uppercase",
            }}>New Look</button>
          )}
        </div>
      </header>

      {/* ── Step Bar ── */}
      {showStepBar && <StepBar current={step} />}

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          background: T.errorBg, borderBottom: `1px solid #3A1A1A`,
          padding: "10px 20px", color: T.error, fontSize: 12, flexShrink: 0,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

        {/* ══════════════════ HERO ══════════════════ */}
        {step === "hero" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            {/* Hero Section */}
            <div style={{
              padding: "48px 24px 40px", textAlign: "center",
              background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${T.green}0D 0%, transparent 70%)`,
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: T.greenDark, border: `1px solid ${T.greenDim}`,
                borderRadius: 20, padding: "5px 14px", marginBottom: 24,
                fontSize: 10, color: T.green, letterSpacing: 2, textTransform: "uppercase",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green }} />
                4C Hair First
              </div>

              <h1 style={{
                margin: "0 0 16px", fontWeight: 800,
                fontSize: "clamp(34px, 8vw, 64px)", lineHeight: 1.1, letterSpacing: -1,
              }}>
                See yourself<br />
                <span style={{ color: T.green }}>styled.</span>
              </h1>

              <p style={{
                color: T.mutedBright, fontSize: "clamp(14px, 2.5vw, 17px)",
                lineHeight: 1.65, marginBottom: 36, maxWidth: 440, margin: "0 auto 36px",
              }}>
                Upload your photo. Pick a 4C hairstyle and an outfit.
                MIRRA renders you — styled, lit, and shot to perfection.
              </p>

              <button
                onClick={() => { setStep("upload"); setTimeout(() => fileRef.current?.click(), 100); }}
                style={{
                  background: T.green, border: "none", borderRadius: 12,
                  padding: "16px 36px", color: "#000", fontSize: 14,
                  fontWeight: 800, letterSpacing: 1, cursor: "pointer",
                  fontFamily: "inherit", marginBottom: 12,
                  boxShadow: `0 8px 32px ${T.green}40`,
                  transition: "all 0.2s",
                }}>
                Try On — Free
              </button>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 48 }}>No account needed</div>

              {/* Feature pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
                {["10 4C Hairstyles", "10 Outfits", "Under 60 seconds", "Face preserved"].map(f => (
                  <div key={f} style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 20, padding: "5px 14px",
                    fontSize: 11, color: T.mutedBright,
                  }}>{f}</div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{ padding: "0 20px 48px" }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: T.muted, textTransform: "uppercase", textAlign: "center", marginBottom: 20 }}>How it works</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500, margin: "0 auto" }}>
                {[
                  { n: "01", title: "Upload your photo", body: "A clear, well-lit front-facing shot works best. Our AI reads your skin tone, face shape, and features." },
                  { n: "02", title: "Pick your look", body: "Choose a 4C hairstyle and a fashion style. Mix and match freely." },
                  { n: "03", title: "See the result", body: "Your editorial look renders in under 60 seconds, ready to download and share." },
                ].map((s, i) => (
                  <div key={s.n} style={{ display: "flex", gap: 16, padding: "18px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: T.greenDark, border: `1px solid ${T.greenDim}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: 1,
                    }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.white, marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{s.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ══════════════════ UPLOAD ══════════════════ */}
        {(step === "upload" || (step !== "hero" && analyzing)) && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
            <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
                Your photo.
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 28 }}>
                Face front, natural light, no heavy filters.
              </p>

              <div
                onClick={() => !analyzing && fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: `1.5px dashed ${analyzing ? T.green : T.borderBright}`,
                  borderRadius: 16, padding: "52px 32px",
                  cursor: analyzing ? "default" : "pointer",
                  background: analyzing ? T.greenDark : T.card,
                  transition: "all 0.3s", marginBottom: 20,
                }}
              >
                {analyzing ? (
                  <div>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: `2px solid ${T.greenDim}`, borderTopColor: T.green,
                      animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
                    }} />
                    <div style={{ color: T.green, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Analyzing your features
                    </div>
                    <div style={{ color: T.muted, fontSize: 11 }}>Skin tone · face shape · build</div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, background: T.greenDark,
                      border: `1px solid ${T.greenDim}`, display: "flex", alignItems: "center",
                      justifyContent: "center", margin: "0 auto 16px", fontSize: 22,
                    }}>📷</div>
                    <div style={{ color: T.white, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop your photo here</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>or tap to browse · JPG, PNG, HEIC</div>
                  </div>
                )}
              </div>

              {!analyzing && (
                <button
                  onClick={() => fileRef.current.click()}
                  style={{
                    width: "100%", background: T.green, border: "none",
                    borderRadius: 10, padding: "14px", color: "#000",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", letterSpacing: 0.5,
                  }}>
                  Choose Photo
                </button>
              )}

              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {/* ══════════════════ CONFIGURE ══════════════════ */}
        {step === "configure" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Mobile: stacked. Desktop: side-by-side */}
            <div style={{
              flex: 1, display: "flex",
              flexDirection: "row",
              overflow: "hidden",
            }}>
              {/* Sidebar */}
              <div style={{
                width: 220, flexShrink: 0,
                borderRight: `1px solid ${T.border}`,
                display: "flex", flexDirection: "column",
                background: T.surface, overflow: "auto",
              }}>
                {/* Photo */}
                <div style={{ padding: "16px 16px 0" }}>
                  <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 8 }}>Your Photo</div>
                  <img src={photoUrl} alt="uploaded" style={{
                    width: "100%", borderRadius: 10, border: `1px solid ${T.border}`,
                    objectFit: "cover", maxHeight: 200,
                  }} />
                </div>

                {/* AI Analysis */}
                {personData && (
                  <div style={{ padding: "10px 16px" }}>
                    <Divider />
                    <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 10 }}>AI Analysis</div>
                    {[["Skin Tone", personData.skinTone], ["Build", personData.bodyBuild]].map(([k, v]) => v && (
                      <div key={k} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 8, letterSpacing: 2, color: T.muted, textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                        <div style={{ fontSize: 11, color: T.cream, lineHeight: 1.5 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1 }} />

                {/* Generate CTA */}
                <div style={{ padding: 16, borderTop: `1px solid ${T.border}` }}>
                  {selectedHair && selectedOutfit && (
                    <div style={{
                      background: T.greenDark, border: `1px solid ${T.greenDim}`,
                      borderRadius: 8, padding: "8px 10px", marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 8, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>Your Look</div>
                      <div style={{ fontSize: 11, color: T.green }}>{hair?.label} · {outfit?.label}</div>
                    </div>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedHair || !selectedOutfit}
                    style={{
                      width: "100%",
                      background: selectedHair && selectedOutfit ? T.green : T.card,
                      border: `1px solid ${selectedHair && selectedOutfit ? T.green : T.border}`,
                      borderRadius: 10, padding: "13px",
                      color: selectedHair && selectedOutfit ? "#000" : T.muted,
                      fontSize: 11, fontWeight: 700, letterSpacing: 1,
                      cursor: selectedHair && selectedOutfit ? "pointer" : "default",
                      fontFamily: "inherit", transition: "all 0.2s",
                      boxShadow: selectedHair && selectedOutfit ? `0 4px 20px ${T.green}30` : "none",
                    }}>
                    {!selectedHair || !selectedOutfit ? "Select hair + outfit" : "Generate My Look →"}
                  </button>
                </div>
              </div>

              {/* Style picker */}
              <div style={{ flex: 1, overflow: "auto", padding: "20px 20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700 }}>Build your look</h3>

                {/* Tabs */}
                <div style={{
                  display: "flex", gap: 0, marginBottom: 20,
                  background: T.card, borderRadius: 10, padding: 3,
                  border: `1px solid ${T.border}`, width: "fit-content",
                }}>
                  {[["hair", "Hairstyle"], ["outfit", "Outfit"]].map(([id, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)} style={{
                      background: activeTab === id ? T.green : "transparent",
                      border: "none", borderRadius: 8, padding: "7px 18px",
                      color: activeTab === id ? "#000" : T.muted,
                      fontSize: 11, fontWeight: activeTab === id ? 700 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.18s",
                    }}>{label}</button>
                  ))}
                </div>

                {/* Hair grid */}
                {activeTab === "hair" && (
                  <>
                    <p style={{ color: T.muted, fontSize: 11, marginBottom: 14, lineHeight: 1.5 }}>
                      All styles celebrate 4C natural hair — coily, tight curl patterns.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                      {HAIRSTYLES.map(h => (
                        <StyleCard key={h.id} item={h} selected={selectedHair === h.id}
                          onClick={() => { setSelectedHair(h.id); setActiveTab("outfit"); }} />
                      ))}
                    </div>
                  </>
                )}

                {/* Outfit grid */}
                {activeTab === "outfit" && (
                  <>
                    <p style={{ color: T.muted, fontSize: 11, marginBottom: 14, lineHeight: 1.5 }}>
                      Tailored to your skin tone and body type from the AI analysis.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                      {OUTFITS.map(o => (
                        <StyleCard key={o.id} item={o} selected={selectedOutfit === o.id}
                          onClick={() => setSelectedOutfit(o.id)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ GENERATING ══════════════════ */}
        {step === "generating" && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column", gap: 28, padding: 40,
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${T.green}08 0%, transparent 70%)`,
          }}>
            <div style={{ textAlign: "center" }}>
              {/* Animated ring */}
              <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: `2px solid ${T.greenDim}`, borderTopColor: T.green,
                  animation: "spin 1s linear infinite",
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                }}>✦</div>
              </div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: T.green, textTransform: "uppercase", marginBottom: 10 }}>Rendering</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700 }}>
                {hair?.label} + {outfit?.label}
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
                Your editorial look is being created.<br />
                Usually takes 45–90 seconds.
              </p>
            </div>
            {photoUrl && (
              <div style={{ position: "relative" }}>
                <img src={photoUrl} style={{
                  height: 120, width: 90, borderRadius: 12, border: `1px solid ${T.border}`,
                  objectFit: "cover", filter: "brightness(0.35) saturate(0.5)",
                  display: "block",
                }} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 12,
                  background: `linear-gradient(to top, ${T.green}20, transparent)`,
                }} />
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ RESULT ══════════════════ */}
        {step === "result" && generatedImage && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Image area */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center",
              justifyContent: "center", padding: 24,
              background: "#050806", overflow: "auto",
            }}>
              <div style={{ maxWidth: 420, width: "100%" }}>
                {showSlider && photoUrl ? (
                  <BeforeAfterSlider beforeUrl={photoUrl} afterUrl={generatedImage} />
                ) : (
                  <div style={{ position: "relative" }}>
                    <img src={generatedImage} alt="your look" style={{
                      width: "100%", borderRadius: 16,
                      border: `1px solid ${T.border}`,
                      boxShadow: `0 32px 80px #000, 0 0 60px ${T.green}10`,
                      display: "block",
                    }} />
                    <div style={{
                      position: "absolute", bottom: 14, left: 14,
                      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
                      borderRadius: 8, padding: "7px 12px",
                      border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ fontSize: 9, color: T.green, letterSpacing: 2, textTransform: "uppercase" }}>
                        {hair?.label} · {outfit?.label}
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={() => setShowSlider(s => !s)} style={{
                  width: "100%", marginTop: 10,
                  background: showSlider ? T.greenDark : "transparent",
                  border: `1px solid ${showSlider ? T.green : T.border}`,
                  borderRadius: 8, padding: "9px",
                  color: showSlider ? T.green : T.muted,
                  fontSize: 10, letterSpacing: 2, cursor: "pointer",
                  fontFamily: "inherit", textTransform: "uppercase", transition: "all 0.2s",
                }}>
                  {showSlider ? "Hide comparison" : "⇔ Before / After"}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{
              width: 250, borderLeft: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", background: T.surface,
            }}>
              <div style={{ padding: "20px 16px", flex: 1, overflow: "auto" }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Your Look</div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{
                    flex: 1, background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 8, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Hair</div>
                    <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{hair?.label}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{hair?.desc}</div>
                  </div>
                  <div style={{
                    flex: 1, background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 8, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Outfit</div>
                    <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{outfit?.label}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{outfit?.desc}</div>
                  </div>
                </div>

                {/* Before thumb */}
                {photoUrl && (
                  <>
                    <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 8 }}>Original</div>
                    <img src={photoUrl} style={{
                      width: "100%", borderRadius: 8, border: `1px solid ${T.border}`,
                      objectFit: "cover", maxHeight: 110, display: "block", marginBottom: 14,
                    }} />
                  </>
                )}

                {/* History */}
                {history.length > 1 && (
                  <>
                    <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 8 }}>Previous</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {history.slice(1).map(h => (
                        <div key={h.id} onClick={() => setGeneratedImage(h.url)} style={{
                          display: "flex", gap: 8, alignItems: "center",
                          cursor: "pointer", padding: 8, borderRadius: 8,
                          border: `1px solid ${T.border}`, background: T.card,
                          transition: "border-color 0.2s",
                        }}>
                          <img src={h.url} style={{ width: 32, height: 42, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 10, color: T.white, fontWeight: 500 }}>{h.hair}</div>
                            <div style={{ fontSize: 9, color: T.muted }}>{h.outfit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { setSelectedHair(null); setSelectedOutfit(null); setStep("configure"); }} style={{
                  background: T.green, border: "none", borderRadius: 10, padding: "13px",
                  color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", boxShadow: `0 4px 16px ${T.green}30`,
                }}>Try Another Look</button>

                <div style={{ display: "flex", gap: 8 }}>
                  <a href={generatedImage} download="mirra-look.jpg" style={{
                    flex: 1, display: "block", background: T.card,
                    border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px",
                    color: T.mutedBright, fontSize: 10, textDecoration: "none",
                    textAlign: "center", fontFamily: "inherit",
                  }}>↓ Download</a>

                  <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "My MIRRA Look", text: `${hair?.label} + ${outfit?.label}`, url: window.location.href });
                    }
                  }} style={{
                    flex: 1, background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "10px", color: T.mutedBright,
                    fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                  }}>↗ Share</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.greenDim}; border-radius: 4px; }
        button:active { transform: scale(0.98); }

        @media (max-width: 600px) {
          .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
