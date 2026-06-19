import { useState, useRef, useCallback } from "react";

const API_URL = "https://mirra-backend-b1c7.onrender.com";

const T = {
  bg: "#0A0E1A",
  surface: "#0D1220",
  card: "#111827",
  cardBright: "#152035",
  border: "#1E2D45",
  borderCyan: "#00E5D433",
  cyan: "#00E5D4",
  cyanDim: "#00E5D420",
  cyanGlow: "#00E5D460",
  cyanText: "#7FF8F2",
  white: "#F0F8FF",
  muted: "#6B8BA4",
  mutedLight: "#9BB5CC",
  navy: "#0D1117",
};

const FEMALE_HAIRSTYLES = [
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

const MALE_HAIRSTYLES = [
  { id: "lowcut", label: "Low Cut", desc: "Clean & sharp" },
  { id: "afro_m", label: "Afro", desc: "Natural crown" },
  { id: "tempfade", label: "Temp Fade", desc: "Crisp & modern" },
  { id: "locs_m", label: "Locs", desc: "Bold & free" },
  { id: "twists_m", label: "Two-Strand Twists", desc: "Textured & defined" },
  { id: "cornrows_m", label: "Cornrows", desc: "Classic & sharp" },
  { id: "braids_m", label: "Box Braids", desc: "Protective style" },
  { id: "puff_m", label: "Afro Puff", desc: "High & proud" },
  { id: "waves", label: "360 Waves", desc: "Smooth & precise" },
  { id: "sponge", label: "Sponge Curls", desc: "Coily & defined" },
];

const FEMALE_OUTFITS = [
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

const MALE_OUTFITS = [
  { id: "agbada", label: "Agbada", desc: "Royal Yoruba elegance", category: "Cultural" },
  { id: "tuxedo", label: "Black Tuxedo", desc: "Classic formal", category: "Formal" },
  { id: "smartcasual", label: "Smart Casual", desc: "Polished & relaxed", category: "Casual" },
  { id: "powersuit_m", label: "Power Suit", desc: "Boardroom sharp", category: "Professional" },
  { id: "streetwear_m", label: "Street Luxe", desc: "Designer streetwear", category: "Casual" },
  { id: "dashiki", label: "Dashiki Luxe", desc: "Bold African print", category: "Cultural" },
  { id: "resort_m", label: "Resort Linen", desc: "Coastal ease", category: "Vacation" },
  { id: "editorial_m", label: "Editorial", desc: "High fashion shoot", category: "Fashion" },
  { id: "athleisure_m", label: "Athleisure", desc: "Elevated activewear", category: "Casual" },
  { id: "monochrome_m", label: "Monochrome", desc: "One-color statement", category: "Fashion" },
];

const HAIR_PROMPTS = {
  twa: "teeny weeny natural afro TWA hairstyle, close-cropped 4C coils",
  afro: "large full natural afro, big voluminous 4C coil crown",
  bantu: "sculptural bantu knots hairstyle, perfectly sectioned knots",
  braids: "long box braids hairstyle, neat and uniform braids",
  locs: "faux locs hairstyle, bohemian goddess locs",
  sisterlocks: "sisterlocks hairstyle, fine uniform locs",
  halo: "halo braid crown hairstyle, elegant updo braided crown",
  puff: "high afro puff hairstyle, voluminous top puff",
  flattwist: "flat twist hairstyle, defined sleek flat twists",
  cornrows: "neat cornrow braids, precise geometric parts",
  lowcut: "clean low cut fade hairstyle, sharp lineup",
  afro_m: "natural men's afro hairstyle, defined 4C coils",
  tempfade: "temple fade haircut, crisp edges, sharp lineup",
  locs_m: "men's dreadlocks hairstyle, neat and defined locs",
  twists_m: "men's two-strand twists, textured and defined",
  cornrows_m: "men's cornrows, straight-back braided pattern",
  braids_m: "men's box braids, neat protective style",
  puff_m: "men's afro puff updo, natural 4C hair",
  waves: "360 waves hairstyle, smooth ripple wave pattern",
  sponge: "sponge curls hairstyle, defined coily afro texture",
};

const OUTFIT_PROMPTS = {
  gala: "wearing an exquisite floor-length black tie gown, deep jewel tones, crystal embellishments",
  editorial: "wearing high fashion editorial clothing, avant-garde designer outfit, vogue cover",
  street: "wearing luxury streetwear, designer hoodie and tailored joggers",
  business: "wearing a sharp power suit, tailored blazer and trousers",
  resort: "wearing resort wear, elegant flowing linen outfit",
  cocktail: "wearing a stunning cocktail dress, sophisticated evening wear",
  afrofusion: "wearing vibrant African print fashion, Ankara fabric dress, bold Afrocentric patterns",
  athleisure: "wearing elevated athleisure, luxury activewear",
  boho: "wearing bohemian luxury fashion, flowing maxi dress, earthy tones",
  monochrome: "wearing a monochromatic power outfit, single color coordinated fashion",
  agbada: "wearing a stunning traditional Agbada, rich embroidered fabric, royal Yoruba fashion",
  tuxedo: "wearing a sharp black tuxedo, crisp white shirt, bow tie",
  smartcasual: "wearing smart casual fashion, fitted chinos, clean shirt, blazer",
  powersuit_m: "wearing a sharp men's power suit, tailored and authoritative",
  streetwear_m: "wearing luxury men's streetwear, designer pieces, high-end sneakers",
  dashiki: "wearing a vibrant men's dashiki, bold African print shirt",
  resort_m: "wearing men's resort linen, relaxed tropical luxury",
  editorial_m: "wearing men's high fashion editorial look, avant-garde designer pieces",
  athleisure_m: "wearing men's elevated athleisure, luxury activewear",
  monochrome_m: "wearing men's monochromatic outfit, bold single-color statement",
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

async function generateLook(prompt, imageBase64) {
  const res = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.image;
}

// ── Tiny components ───────────────────────────────────────────────────────────

function StepBar({ step }) {
  const steps = [
    { key: "upload", label: "Capture" },
    { key: "configure", label: "Style" },
    { key: "result", label: "Reveal" },
  ];
  const activeIndex = steps.findIndex(s => s.key === step);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? T.cyan : active ? T.cyanDim : "transparent",
                border: `1.5px solid ${done || active ? T.cyan : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: done ? T.navy : active ? T.cyan : T.muted,
                fontWeight: 700, transition: "all 0.3s",
                boxShadow: active ? `0 0 12px ${T.cyanGlow}` : "none",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
                color: active ? T.cyan : done ? T.cyanText : T.muted,
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 48, height: 1, margin: "0 6px",
                marginBottom: 16,
                background: done ? T.cyan : T.border,
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CyanCard({ children, style = {} }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.borderCyan}`,
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function StyleCard({ item, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? `${T.cyan}18` : hovered ? `${T.cyan}0A` : T.card,
        border: `1.5px solid ${selected ? T.cyan : hovered ? `${T.cyan}50` : T.border}`,
        borderRadius: 12, padding: "14px 16px",
        cursor: "pointer", textAlign: "left",
        transition: "all 0.2s", fontFamily: "inherit",
        position: "relative",
        boxShadow: selected ? `0 0 20px ${T.cyan}25` : "none",
      }}>
      {selected && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 18, height: 18, borderRadius: "50%",
          background: T.cyan, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, color: T.navy, fontWeight: 900,
        }}>✓</div>
      )}
      <div style={{ color: selected ? T.cyan : T.white, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
        {item.label}
      </div>
      <div style={{ color: T.muted, fontSize: 11 }}>{item.desc || item.category}</div>
    </button>
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
  const fileRef = useRef();

  const gender = personData?.gender?.toLowerCase().includes("man") || personData?.gender?.toLowerCase().includes("male") ? "male" : "female";
  const HAIRSTYLES = gender === "male" ? MALE_HAIRSTYLES : FEMALE_HAIRSTYLES;
  const OUTFITS = gender === "male" ? MALE_OUTFITS : FEMALE_OUTFITS;

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
        setError("Photo analysis failed: " + e.message);
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
    const base = personData?.fluxPromptBase || "A beautiful person,";
    const prompt = `${base} ${OUTFIT_PROMPTS[selectedOutfit]}, ${HAIR_PROMPTS[selectedHair]}, professional fashion photography, editorial lighting, luxury magazine shoot, sharp focus, photorealistic, 8k`;
    try {
      const url = await generateLook(prompt, photoBase64);
      setGeneratedImage(url);
      const hair = HAIRSTYLES.find(h => h.id === selectedHair);
      const outfit = OUTFITS.find(o => o.id === selectedOutfit);
      setHistory(prev => [{ url, hair: hair?.label, outfit: outfit?.label, id: Date.now() }, ...prev.slice(0, 5)]);
      setStep("result");
    } catch (e) {
      setError(e.message);
      setStep("configure");
    }
  };

  const reset = () => {
    setStep("hero");
    setPhotoUrl(null); setPhotoBase64(null); setPersonData(null);
    setSelectedHair(null); setSelectedOutfit(null);
    setGeneratedImage(null); setError(null);
  };

  const hair = HAIRSTYLES.find(h => h.id === selectedHair);
  const outfit = OUTFITS.find(o => o.id === selectedOutfit);

  const isConfiguring = step === "configure" || step === "upload" || step === "generating" || step === "result";

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.white,
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── HEADER ── */}
      <header style={{
        padding: "14px 32px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${T.navy}CC`, backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
      }}>
        <div onClick={reset} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${T.cyan}, #0088FF)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: T.navy,
          }}>M</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, color: T.white }}>MIRRA</div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: T.muted, textTransform: "uppercase" }}>AI Virtual Try-On</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isConfiguring && <StepBar step={step === "generating" ? "configure" : step} />}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            border: `1px solid ${T.borderCyan}`, borderRadius: 20, padding: "4px 12px",
            color: T.cyan, fontSize: 10, letterSpacing: 2,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />
            Live
          </div>
          {step !== "hero" && (
            <button onClick={reset} style={{
              background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "5px 14px", color: T.muted, fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1,
            }}>New Look</button>
          )}
        </div>
      </header>

      {error && (
        <div style={{
          background: "#1A0808", borderBottom: "1px solid #3D1515",
          padding: "10px 32px", color: "#E87070", fontSize: 12,
        }}>⚠ {error}</div>
      )}

      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        {step === "hero" && (
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* Hero section */}
            <section style={{
              padding: "60px 40px 80px",
              display: "flex", alignItems: "center", gap: 60,
              maxWidth: 1100, margin: "0 auto", flexWrap: "wrap",
            }}>
              {/* Left: text */}
              <div style={{ flex: "1 1 400px", minWidth: 300 }}>
                <div style={{
                  display: "inline-block",
                  border: `1px solid ${T.borderCyan}`, borderRadius: 20,
                  padding: "5px 16px", fontSize: 10, letterSpacing: 4,
                  color: T.cyan, textTransform: "uppercase", marginBottom: 24,
                }}>Virtual Try-On</div>

                <h1 style={{
                  margin: "0 0 8px", fontWeight: 800, lineHeight: 1.1,
                  fontSize: "clamp(40px, 5vw, 68px)", letterSpacing: -1,
                }}>
                  Experience<br />
                  <span style={{ color: T.cyan }}>Futuristic</span><br />
                  Styles.
                </h1>

                <p style={{
                  color: T.mutedLight, fontSize: 15, lineHeight: 1.7,
                  margin: "20px 0 36px", maxWidth: 420,
                }}>
                  Upload your photo, pick a hairstyle and outfit. Our AI renders an
                  editorial-quality look — photorealistic, fashion-forward, and centred on
                  4C natural hair.
                </p>

                <button
                  onClick={() => { setStep("upload"); setTimeout(() => fileRef.current?.click(), 100); }}
                  style={{
                    background: T.cyan, border: "none", borderRadius: 12,
                    padding: "16px 40px", color: T.navy,
                    fontSize: 14, fontWeight: 800, letterSpacing: 2,
                    textTransform: "uppercase", cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: `0 8px 32px ${T.cyan}40`,
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 12px 40px ${T.cyan}60`; }}
                  onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = `0 8px 32px ${T.cyan}40`; }}
                >
                  Try On — Free →
                </button>
              </div>

              {/* Right: glass display card */}
              <div style={{ flex: "1 1 320px", minWidth: 280 }}>
                <div style={{
                  border: `1px solid ${T.borderCyan}`,
                  borderRadius: 20, overflow: "hidden",
                  background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
                  aspectRatio: "4/5", display: "flex", alignItems: "center",
                  justifyContent: "center", flexDirection: "column", gap: 16,
                  position: "relative",
                  boxShadow: `0 0 60px ${T.cyan}10`,
                }}>
                  {/* Decorative grid overlay */}
                  <div style={{
                    position: "absolute", inset: 0, opacity: 0.05,
                    backgroundImage: `linear-gradient(${T.cyan} 1px, transparent 1px), linear-gradient(90deg, ${T.cyan} 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }} />
                  <div style={{ fontSize: 64, opacity: 0.4 }}>✦</div>
                  <div style={{ color: T.muted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
                    Your look here
                  </div>
                  <div style={{
                    position: "absolute", bottom: 20, left: 20, right: 20,
                    background: `${T.navy}CC`, borderRadius: 10, padding: "10px 16px",
                    border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 8px ${T.cyan}` }} />
                    <span style={{ color: T.cyanText, fontSize: 11, letterSpacing: 1 }}>AI-generated editorial look</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Benefits section */}
            <section style={{
              borderTop: `1px solid ${T.border}`,
              padding: "60px 40px",
              background: T.surface,
            }}>
              <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 60, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: "0 0 auto" }}>
                  <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, lineHeight: 1.2 }}>
                    Discover<br />the<br />Benefits
                  </h2>
                </div>
                <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    {
                      title: "No Account",
                      desc: "Instant access, no signup required.",
                      icon: "🔓",
                    },
                    {
                      title: "Fast Results",
                      desc: "Stunning looks in under 60 seconds.",
                      icon: "⚡",
                    },
                    {
                      title: "4C Hair First",
                      desc: "10 curated natural hair styles, centred on 4C coils.",
                      icon: "👑",
                    },
                    {
                      title: "Photorealistic",
                      desc: "Editorial AI rendering — not a filter, a full transformation.",
                      icon: "🎨",
                    },
                  ].map(b => (
                    <div key={b.title} style={{
                      display: "flex", alignItems: "center", gap: 20,
                      background: T.card, border: `1px solid ${T.borderCyan}`,
                      borderRadius: 14, padding: "18px 24px",
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: T.cyanDim, border: `1px solid ${T.borderCyan}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>{b.icon}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.cyan, marginBottom: 4 }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: "60px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ marginBottom: 8, fontSize: 10, letterSpacing: 4, color: T.muted, textTransform: "uppercase" }}>
                AI Virtual Try-On &nbsp;·&nbsp; How It Works
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800 }}>
                Discover Your Style
              </h2>
              <div style={{ color: T.cyan, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Seamless 3-Step Process</div>
              <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 500, marginBottom: 40 }}>
                Simply upload your photo, choose the desired look, and see yourself in real-time.
                The process takes less than one minute.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {[
                  { n: "01", title: "Capture", body: "Drop a clear front-facing photo. Our AI reads your features, skin tone, and style." },
                  { n: "02", title: "Style", body: "Pick from 10 gender-specific 4C hairstyles and 10 curated fashion outfits." },
                  { n: "03", title: "Reveal", body: "Your AI-rendered editorial look is ready in under 60 seconds. Download it instantly." },
                ].map(s => (
                  <CyanCard key={s.n} style={{ padding: "28px 24px" }}>
                    <div style={{
                      fontSize: 11, color: T.cyan, letterSpacing: 4, fontWeight: 700,
                      textTransform: "uppercase", marginBottom: 12,
                    }}>{s.n}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: T.white, marginBottom: 10 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{s.body}</div>
                  </CyanCard>
                ))}
              </div>

              <div style={{ marginTop: 48, textAlign: "center" }}>
                <button
                  onClick={() => { setStep("upload"); setTimeout(() => fileRef.current?.click(), 100); }}
                  style={{
                    background: "transparent", border: `1.5px solid ${T.cyan}`,
                    borderRadius: 12, padding: "14px 40px",
                    color: T.cyan, fontSize: 13, fontWeight: 700,
                    letterSpacing: 2, textTransform: "uppercase",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.target.style.background = T.cyanDim; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; }}
                >
                  Get Started →
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ══ UPLOAD / ANALYZING ════════════════════════════════════════════ */}
        {(step === "upload" || analyzing) && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
              <div style={{ marginBottom: 8, fontSize: 10, letterSpacing: 4, color: T.cyan, textTransform: "uppercase" }}>
                Step 01 · Capture
              </div>
              <h2 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
                Upload Your Photo
              </h2>
              <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                Face front, natural light, no heavy filters. Our AI analyzes your features for the most accurate result.
              </p>

              <div
                onClick={() => !analyzing && fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: `1.5px dashed ${analyzing ? T.cyan : T.border}`,
                  borderRadius: 20, padding: "56px 40px",
                  cursor: analyzing ? "default" : "pointer",
                  background: analyzing ? `${T.cyan}06` : T.card,
                  transition: "all 0.3s",
                }}
                onMouseEnter={e => { if (!analyzing) { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.background = T.cyanDim; } }}
                onMouseLeave={e => { if (!analyzing) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; } }}
              >
                {analyzing ? (
                  <div>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: `2px solid ${T.border}`, borderTopColor: T.cyan,
                      animation: "spin 1s linear infinite", margin: "0 auto 18px",
                    }} />
                    <div style={{ color: T.cyan, fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>
                      Analyzing features...
                    </div>
                    <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Reading skin tone, face shape & style</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>↑</div>
                    <div style={{ color: T.white, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop your photo here</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>or click to browse · JPG, PNG, HEIC</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {/* ══ CONFIGURE ════════════════════════════════════════════════════ */}
        {step === "configure" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Sidebar */}
            <div style={{
              width: 280, flexShrink: 0, borderRight: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", background: T.surface, overflowY: "auto",
            }}>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 10 }}>Your Photo</div>
                <img src={photoUrl} alt="uploaded" style={{
                  width: "100%", borderRadius: 12, border: `1px solid ${T.border}`,
                  objectFit: "cover", aspectRatio: "3/4", display: "block",
                }} />
              </div>

              {personData && (
                <div style={{ padding: "0 20px 16px" }}>
                  <div style={{
                    background: T.card, border: `1px solid ${T.borderCyan}`,
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: T.cyan, textTransform: "uppercase", marginBottom: 12 }}>AI Analysis</div>
                    {[
                      ["Skin Tone", personData.skinTone],
                      ["Build", personData.bodyBuild],
                      ["Styles for", gender === "male" ? "Men / Boys" : "Women / Girls"],
                    ].map(([k, v]) => v && (
                      <div key={k} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, color: T.white, lineHeight: 1.4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selection summary */}
              <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  background: selectedHair ? `${T.cyan}10` : T.card,
                  border: `1px solid ${selectedHair ? T.cyan : T.border}`,
                  borderRadius: 10, padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>Hairstyle</div>
                  <div style={{ fontSize: 12, color: selectedHair ? T.cyan : T.muted }}>
                    {hair?.label || "Not selected"}
                  </div>
                </div>
                <div style={{
                  background: selectedOutfit ? `${T.cyan}10` : T.card,
                  border: `1px solid ${selectedOutfit ? T.cyan : T.border}`,
                  borderRadius: 10, padding: "10px 14px",
                }}>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>Outfit</div>
                  <div style={{ fontSize: 12, color: selectedOutfit ? T.cyan : T.muted }}>
                    {outfit?.label || "Not selected"}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
                <button onClick={handleGenerate} disabled={!selectedHair || !selectedOutfit} style={{
                  width: "100%",
                  background: selectedHair && selectedOutfit ? T.cyan : T.card,
                  border: `1px solid ${selectedHair && selectedOutfit ? T.cyan : T.border}`,
                  borderRadius: 10, padding: "14px",
                  color: selectedHair && selectedOutfit ? T.navy : T.muted,
                  fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
                  cursor: selectedHair && selectedOutfit ? "pointer" : "default",
                  fontFamily: "inherit", fontWeight: 800, transition: "all 0.2s",
                  boxShadow: selectedHair && selectedOutfit ? `0 4px 24px ${T.cyan}40` : "none",
                }}>
                  {!selectedHair || !selectedOutfit ? "Select Both to Continue" : "Generate My Look →"}
                </button>
              </div>
            </div>

            {/* Main style picker */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: T.cyan, textTransform: "uppercase", marginBottom: 4 }}>
                Step 02 · Style
              </div>
              <h3 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Build Your Look</h3>

              {/* Tab toggle */}
              <div style={{
                display: "inline-flex", background: T.card,
                border: `1px solid ${T.border}`, borderRadius: 10, padding: 4, marginBottom: 24,
              }}>
                {[
                  { key: "hair", label: selectedHair ? `✓ ${hair?.label}` : "Hairstyle" },
                  { key: "outfit", label: selectedOutfit ? `✓ ${outfit?.label}` : "Outfit" },
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                    padding: "8px 20px", borderRadius: 7, border: "none",
                    background: activeTab === t.key ? T.cyan : "transparent",
                    color: activeTab === t.key ? T.navy : T.muted,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", letterSpacing: 1, transition: "all 0.2s",
                  }}>{t.label}</button>
                ))}
              </div>

              {activeTab === "hair" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>
                    {gender === "male"
                      ? "Men's styles — from clean fades to natural 4C locs."
                      : "All styles celebrate 4C natural hair — coily, tight curl patterns."}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                    {HAIRSTYLES.map(h => (
                      <StyleCard key={h.id} item={h} selected={selectedHair === h.id}
                        onClick={() => { setSelectedHair(h.id); setActiveTab("outfit"); }} />
                    ))}
                  </div>
                </>
              )}

              {activeTab === "outfit" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>
                    {gender === "male"
                      ? "Men's outfits — from Agbada to editorial fashion."
                      : "Looks tailored to your skin tone and body type."}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                    {OUTFITS.map(o => (
                      <StyleCard key={o.id} item={o} selected={selectedOutfit === o.id}
                        onClick={() => setSelectedOutfit(o.id)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ GENERATING ════════════════════════════════════════════════════ */}
        {step === "generating" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28, padding: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: `2px solid ${T.border}`, borderTopColor: T.cyan,
                animation: "spin 1.2s linear infinite", margin: "0 auto 28px",
              }} />
              <div style={{ fontSize: 10, letterSpacing: 5, color: T.cyan, textTransform: "uppercase", marginBottom: 10 }}>Generating</div>
              <h2 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 800 }}>
                {hair?.label} + {outfit?.label}
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
                Rendering your editorial look.<br />This takes 30–60 seconds.
              </p>
            </div>
            {photoUrl && (
              <img src={photoUrl} style={{
                height: 140, borderRadius: 12, border: `1px solid ${T.border}`,
                objectFit: "cover", filter: "brightness(0.35) saturate(0.5)",
              }} />
            )}
          </div>
        )}

        {/* ══ RESULT ════════════════════════════════════════════════════════ */}
        {step === "result" && generatedImage && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Image */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, background: "#040608" }}>
              <div style={{ position: "relative", maxWidth: 440, width: "100%" }}>
                <img src={generatedImage} alt="generated look" style={{
                  width: "100%", borderRadius: 18,
                  border: `1px solid ${T.borderCyan}`,
                  boxShadow: `0 40px 80px #000, 0 0 40px ${T.cyan}10`,
                  display: "block",
                }} />
                <div style={{
                  position: "absolute", bottom: 14, left: 14,
                  background: `${T.navy}EE`, borderRadius: 8, padding: "8px 14px",
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 9, color: T.cyan, letterSpacing: 3, textTransform: "uppercase" }}>
                    {hair?.label} · {outfit?.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ width: 280, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface }}>
              <div style={{ padding: "22px 22px 0", flex: 1, overflowY: "auto" }}>
                <div style={{ fontSize: 9, letterSpacing: 3, color: T.cyan, textTransform: "uppercase", marginBottom: 16 }}>Step 03 · Reveal</div>

                <CyanCard style={{ padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Hairstyle</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 3 }}>{hair?.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{hair?.desc}</div>
                </CyanCard>

                <CyanCard style={{ padding: "16px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Outfit</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 3 }}>{outfit?.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{outfit?.desc}</div>
                </CyanCard>

                {history.length > 1 && (
                  <>
                    <div style={{ fontSize: 9, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginBottom: 10 }}>Previous Looks</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {history.slice(1).map(h => (
                        <div key={h.id} onClick={() => setGeneratedImage(h.url)} style={{
                          display: "flex", gap: 10, alignItems: "center",
                          cursor: "pointer", padding: 8, borderRadius: 10,
                          border: `1px solid ${T.border}`, background: T.card,
                        }}>
                          <img src={h.url} style={{ width: 36, height: 46, objectFit: "cover", borderRadius: 6 }} />
                          <div>
                            <div style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{h.hair}</div>
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
                  background: T.cyan, border: "none", borderRadius: 10, padding: "13px",
                  color: T.navy, fontSize: 12, letterSpacing: 2, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 800, textTransform: "uppercase",
                  boxShadow: `0 4px 20px ${T.cyan}40`,
                }}>Try Another Look</button>

                <div style={{ display: "flex", gap: 8 }}>
                  <a href={generatedImage} download="mirra-look.jpg" style={{
                    flex: 1, display: "block", background: T.card,
                    border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px",
                    color: T.white, fontSize: 11, letterSpacing: 2,
                    textDecoration: "none", textAlign: "center", textTransform: "uppercase",
                    fontFamily: "inherit",
                  }}>↓ Save</a>
                  <button onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: "My MIRRA Look", text: `${hair?.label} + ${outfit?.label}`, url: window.location.href });
                      } catch {}
                    }
                  }} style={{
                    flex: 1, background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "11px", color: T.white,
                    fontSize: 11, letterSpacing: 2, cursor: "pointer",
                    fontFamily: "inherit", textTransform: "uppercase",
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
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
