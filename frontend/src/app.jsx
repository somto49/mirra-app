import { useState, useRef, useCallback } from "react";

const API_URL = "https://mirra-backend-b1c7.onrender.com";

const T = {
  bg: "#0A0A0F",
  surface: "#13131A",
  card: "#1A1A24",
  border: "#2A2A3A",
  gold: "#FFB800",
  goldLight: "#FFD54F",
  goldDim: "#8B7000",
  cream: "#F5F0FF",
  muted: "#6B6B8A",
  purple: "#7C3AED",
  purpleLight: "#A78BFA",
  pink: "#EC4899",
  green: "#10B981",
};

const HAIRSTYLES = [
  { id: "twa", label: "TWA", desc: "Teeny Weeny Afro", emoji: "👑", color: "#FFB800" },
  { id: "afro", label: "Full Afro", desc: "Big crown energy", emoji: "✨", color: "#EC4899" },
  { id: "bantu", label: "Bantu Knots", desc: "Sculptural & regal", emoji: "💎", color: "#7C3AED" },
  { id: "braids", label: "Box Braids", desc: "Long & protective", emoji: "🌟", color: "#10B981" },
  { id: "locs", label: "Faux Locs", desc: "Boho goddess", emoji: "🔥", color: "#F59E0B" },
  { id: "sisterlocks", label: "Sisterlocks", desc: "Refined & elegant", emoji: "💫", color: "#06B6D4" },
  { id: "halo", label: "Halo Braid", desc: "Crowned royalty", emoji: "👸🏾", color: "#FFB800" },
  { id: "puff", label: "Afro Puff", desc: "High & proud", emoji: "⚡", color: "#EC4899" },
  { id: "flattwist", label: "Flat Twists", desc: "Sleek & defined", emoji: "🌀", color: "#7C3AED" },
  { id: "cornrows", label: "Cornrows", desc: "Classic & sharp", emoji: "💪🏾", color: "#10B981" },
];

const OUTFITS = [
  { id: "gala", label: "Black Tie Gala", desc: "Floor-length elegance", emoji: "🥂", color: "#FFB800" },
  { id: "editorial", label: "Editorial", desc: "High fashion shoot", emoji: "📸", color: "#EC4899" },
  { id: "street", label: "Street Luxe", desc: "Designer streetwear", emoji: "🔥", color: "#7C3AED" },
  { id: "business", label: "Power Suit", desc: "Boardroom authority", emoji: "💼", color: "#06B6D4" },
  { id: "resort", label: "Resort Wear", desc: "Coastal luxury", emoji: "🌊", color: "#10B981" },
  { id: "cocktail", label: "Cocktail", desc: "Evening chic", emoji: "✨", color: "#F59E0B" },
  { id: "afrofusion", label: "Afro Fusion", desc: "Bold prints & cuts", emoji: "🌍", color: "#EC4899" },
  { id: "athleisure", label: "Athleisure", desc: "Elevated activewear", emoji: "⚡", color: "#10B981" },
  { id: "boho", label: "Boho Luxe", desc: "Flowing & free", emoji: "🌸", color: "#F59E0B" },
  { id: "monochrome", label: "Monochrome", desc: "One-color power", emoji: "🖤", color: "#6B6B8A" },
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

async function generateLook(prompt) {
  const res = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.image;
}

// ── INTERACTIVE STYLE CARD ────────────────────────────────────────────────────
function StyleCard({ item, selected, onClick, type }) {
  const [hovered, setHovered] = useState(false);
  const isActive = selected || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${item.color}22, ${item.color}11)`
          : hovered ? `${item.color}11` : T.card,
        border: `1.5px solid ${selected ? item.color : hovered ? `${item.color}60` : T.border}`,
        borderRadius: 16,
        padding: "16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        transform: hovered && !selected ? "translateY(-2px)" : selected ? "translateY(-3px)" : "none",
        boxShadow: selected
          ? `0 8px 24px ${item.color}30, 0 0 0 1px ${item.color}40`
          : hovered ? `0 4px 16px ${item.color}20` : "none",
      }}
    >
      {/* Glow effect */}
      {isActive && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
          opacity: selected ? 1 : 0.5,
        }} />
      )}

      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 20, height: 20, borderRadius: "50%",
          background: item.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: "#000", fontWeight: 700,
        }}>✓</div>
      )}

      <div style={{ fontSize: 22, marginBottom: 8 }}>{item.emoji}</div>
      <div style={{
        color: selected ? item.color : hovered ? T.cream : T.cream,
        fontSize: 13, fontWeight: 700, marginBottom: 3,
        transition: "color 0.2s",
      }}>
        {item.label}
      </div>
      <div style={{
        color: hovered || selected ? `${item.color}CC` : T.muted,
        fontSize: 11, transition: "color 0.2s",
      }}>
        {item.desc}
      </div>
    </button>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({ onStart }) {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    { icon: "👑", title: "4C Hair First", desc: "10 natural hairstyles built for coily, kinky textures", color: T.gold },
    { icon: "🎨", title: "AI Styled", desc: "Our AI analyzes your unique features for personalized results", color: T.purple },
    { icon: "⚡", title: "Instant Looks", desc: "Our AI generates editorial fashion in under a minute", color: T.pink },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* Animated background */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: `
          radial-gradient(ellipse at 10% 10%, ${T.purple}25 0%, transparent 50%),
          radial-gradient(ellipse at 90% 90%, ${T.pink}20 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, ${T.gold}10 0%, transparent 60%)
        `,
        pointerEvents: "none",
      }} />

      {/* Dot grid */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `radial-gradient(${T.border} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        opacity: 0.4,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 1,
        borderBottom: `1px solid ${T.border}`,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.gold}, ${T.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>👑</div>
          <div>
            <div style={{ fontSize: 18, letterSpacing: 6, fontWeight: 700, color: T.cream }}>MIRRA</div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: T.muted, textTransform: "uppercase" }}>by Aya</div>
          </div>
        </div>
        <button onClick={onStart} style={{
          background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
          border: "none", borderRadius: 40, padding: "10px 24px",
          color: "#fff", fontSize: 12, letterSpacing: 2,
          textTransform: "uppercase", cursor: "pointer",
          fontFamily: "inherit", fontWeight: 700,
          boxShadow: `0 4px 20px ${T.purple}50`,
        }}>Try Now →</button>
      </header>

      {/* Hero */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 24px", textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: `linear-gradient(135deg, ${T.purple}30, ${T.pink}20)`,
          border: `1px solid ${T.purple}50`,
          borderRadius: 40, padding: "8px 20px", marginBottom: 28,
        }}>
          <span style={{ fontSize: 12 }}>✨</span>
          <span style={{ color: T.purpleLight, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
            AI Virtual Try-On · 4C Hair Specialist
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          margin: "0 0 20px",
          fontSize: "clamp(40px, 8vw, 80px)",
          fontWeight: 800,
          lineHeight: 1.05,
          maxWidth: 700,
          letterSpacing: "-1px",
        }}>
          <span style={{ color: T.cream }}>See Yourself</span><br />
          <span style={{
            background: `linear-gradient(135deg, ${T.gold}, ${T.pink}, ${T.purpleLight})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Crowned.</span>
        </h1>

        <p style={{
          color: T.muted, fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.8, marginBottom: 40, maxWidth: 500,
        }}>
          Upload your photo and try on any outfit with your chosen 4C hairstyle —
          rendered in editorial fashion quality, <strong style={{ color: T.cream }}>built for Black beauty.</strong>
        </p>

        {/* CTA */}
        <button onClick={onStart} style={{
          background: `linear-gradient(135deg, ${T.gold}, ${T.pink})`,
          border: "none", borderRadius: 16,
          padding: "20px 56px",
          color: "#000", fontSize: 14, letterSpacing: 3,
          textTransform: "uppercase", cursor: "pointer",
          fontFamily: "inherit", fontWeight: 800,
          boxShadow: `0 8px 40px ${T.pink}40`,
          marginBottom: 14,
          transition: "transform 0.2s",
        }}
          onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
          onMouseLeave={e => e.target.style.transform = "scale(1)"}
        >
          ✦ Try On Now — It's Free
        </button>
        <p style={{ color: T.muted, fontSize: 11, letterSpacing: 1 }}>No account needed · Results in ~45 seconds</p>

        {/* Steps */}
        <div style={{
          display: "flex", gap: 12, marginTop: 48,
          flexWrap: "wrap", justifyContent: "center", maxWidth: 580,
        }}>
          {[
            { n: "01", t: "Upload Photo", d: "Clear front-facing shot", c: T.gold },
            { n: "02", t: "Pick Your Style", d: "Hair + outfit combo", c: T.pink },
            { n: "03", t: "Get Your Look", d: "AI renders in ~45s", c: T.purpleLight },
          ].map(({ n, t, d, c }) => (
            <div key={n} style={{
              flex: "1 1 150px", minWidth: 140,
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "20px 16px", textAlign: "center",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = c;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${c}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ color: c, fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>STEP {n}</div>
              <div style={{ color: T.cream, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t}</div>
              <div style={{ color: T.muted, fontSize: 11 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div style={{
          display: "flex", gap: 12, marginTop: 32,
          flexWrap: "wrap", justifyContent: "center", maxWidth: 620,
        }}>
          {features.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                flex: "1 1 160px", minWidth: 150,
                background: hoveredFeature === i ? `${f.color}15` : T.surface,
                border: `1px solid ${hoveredFeature === i ? f.color : T.border}`,
                borderRadius: 14, padding: "16px",
                transition: "all 0.2s", cursor: "default",
                transform: hoveredFeature === i ? "translateY(-3px)" : "none",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ color: hoveredFeature === i ? f.color : T.cream, fontSize: 13, fontWeight: 700, marginBottom: 4, transition: "color 0.2s" }}>{f.title}</div>
              <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("hero");
  const [step, setStep] = useState("upload");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [personData, setPersonData] = useState(null);
  const [selectedHair, setSelectedHair] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
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
    const base = personData?.promptBase || personData?.fluxPromptBase || "A beautiful woman with rich deep brown skin,";
    const prompt = `${base} ${OUTFIT_PROMPTS[selectedOutfit]}, ${HAIR_PROMPTS[selectedHair]}, professional fashion photography, editorial lighting, luxury magazine shoot, sharp focus, photorealistic, 8k`;
    try {
      const url = await generateLook(prompt);
      setGeneratedImage(url);
      const hair = HAIRSTYLES.find(h => h.id === selectedHair);
      const outfit = OUTFITS.find(o => o.id === selectedOutfit);
      setHistory(prev => [{ url, hair: hair.label, outfit: outfit.label, id: Date.now() }, ...prev.slice(0, 5)]);
      setStep("result");
    } catch (e) {
      setError(e.message);
      setStep("configure");
    }
  };

  const reset = () => {
    setStep("upload");
    setPhotoUrl(null);
    setPersonData(null);
    setSelectedHair(null);
    setSelectedOutfit(null);
    setGeneratedImage(null);
    setError(null);
  };

  const hair = HAIRSTYLES.find(h => h.id === selectedHair);
  const outfit = OUTFITS.find(o => o.id === selectedOutfit);

  if (screen === "hero") return <Hero onStart={() => setScreen("app")} />;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.cream,
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "14px 24px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${T.bg}CC`, flexShrink: 0,
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(16px)",
      }}>
        <button onClick={() => setScreen("hero")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.gold}, ${T.pink})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>👑</div>
          <span style={{ fontSize: 16, letterSpacing: 4, fontWeight: 700, color: T.cream, fontFamily: "inherit" }}>MIRRA</span>
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            background: `${T.green}20`, border: `1px solid ${T.green}40`,
            borderRadius: 20, padding: "4px 12px",
            color: T.green, fontSize: 10, letterSpacing: 1, fontWeight: 600,
          }}>● LIVE</div>
          {step !== "upload" && (
            <button onClick={reset} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: "4px 14px", color: T.muted,
              fontSize: 10, letterSpacing: 1, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600,
            }}>New Look</button>
          )}
        </div>
      </header>

      {error && (
        <div style={{
          background: "#2A0A0A", borderBottom: `1px solid #5A1A1A`,
          padding: "10px 24px", color: "#F87171", fontSize: 12, flexShrink: 0,
        }}>⚠ {error}</div>
      )}

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>

        {/* UPLOAD */}
        {(step === "upload" || analyzing) && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "40px 24px",
            minHeight: "calc(100vh - 57px)",
          }}>
            <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `${T.gold}15`, border: `1px solid ${T.gold}40`,
                borderRadius: 40, padding: "6px 16px", marginBottom: 24,
              }}>
                <span style={{ color: T.gold, fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>
                  Step 01 · Upload
                </span>
              </div>

              <h2 style={{
                margin: "0 0 14px",
                fontSize: "clamp(28px, 5vw, 44px)",
                fontWeight: 800, lineHeight: 1.1,
                letterSpacing: "-0.5px",
              }}>
                Your Crown.<br />
                <span style={{
                  background: `linear-gradient(135deg, ${T.gold}, ${T.pink})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Your Canvas.</span>
              </h2>

              <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 32 }}>
                Drop a clear photo — AI reads your skin tone, face shape and style,
                then renders you in your chosen 4C look.
              </p>

              <div
                onClick={() => !analyzing && fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: `2px dashed ${analyzing ? T.gold : T.border}`,
                  borderRadius: 20, padding: "48px 32px",
                  cursor: analyzing ? "default" : "pointer",
                  background: analyzing ? `${T.gold}08` : T.card,
                  transition: "all 0.3s", marginBottom: 20,
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => { if (!analyzing) e.currentTarget.style.borderColor = T.purple; }}
                onMouseLeave={e => { if (!analyzing) e.currentTarget.style.borderColor = T.border; }}
              >
                {analyzing ? (
                  <div>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      border: `3px solid ${T.border}`, borderTopColor: T.gold,
                      animation: "spin 0.8s linear infinite", margin: "0 auto 20px",
                    }} />
                    <div style={{ color: T.gold, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                      Analyzing your features...
                    </div>
                    <div style={{ color: T.muted, fontSize: 12 }}>
                      Reading skin tone · Face shape · Body type
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${T.purple}30, ${T.pink}20)`,
                      border: `1px solid ${T.purple}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 20px", fontSize: 28,
                    }}>📸</div>
                    <div style={{ color: T.cream, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                      Drop your photo here
                    </div>
                    <div style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>or click to browse</div>
                    <div style={{
                      display: "inline-flex", gap: 8,
                    }}>
                      {["JPG", "PNG", "HEIC"].map(f => (
                        <span key={f} style={{
                          background: T.surface, border: `1px solid ${T.border}`,
                          borderRadius: 6, padding: "3px 10px",
                          color: T.muted, fontSize: 11, fontWeight: 600,
                        }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />

              <div style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", gap: 10, alignItems: "center",
              }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, textAlign: "left" }}>
                  Best results with a <strong style={{ color: T.cream }}>clear, well-lit front-facing photo</strong>.
                  The more visible your features, the closer the AI match.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURE */}
        {step === "configure" && (
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Person banner */}
            <div style={{
              padding: "16px 24px",
              background: `linear-gradient(135deg, ${T.purple}15, ${T.pink}10)`,
              borderBottom: `1px solid ${T.border}`,
              display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
            }}>
              <img src={photoUrl} alt="you" style={{
                width: 56, height: 70, objectFit: "cover",
                borderRadius: 10,
                border: `2px solid ${T.gold}`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: T.muted, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>
                  ✓ AI Analysis Complete
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[personData?.skinTone, personData?.bodyBuild, personData?.ageRange].filter(Boolean).map((v, i) => (
                    <span key={i} style={{
                      background: T.card, border: `1px solid ${T.border}`,
                      borderRadius: 20, padding: "3px 12px",
                      fontSize: 11, color: T.cream, fontWeight: 500,
                    }}>{v}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: T.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                Step 02 · Build Your Look
              </div>
              <h3 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Choose Hair + Outfit
              </h3>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[
                  { id: "hair", label: selectedHair ? `✓ ${hair?.label}` : "Hair Style", color: T.gold },
                  { id: "outfit", label: selectedOutfit ? `✓ ${outfit?.label}` : "Outfit", color: T.pink },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: "10px 24px", borderRadius: 40,
                    border: `1.5px solid ${activeTab === tab.id ? tab.color : T.border}`,
                    background: activeTab === tab.id ? `${tab.color}18` : T.card,
                    color: activeTab === tab.id ? tab.color : T.muted,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                    letterSpacing: 0.5,
                  }}>{tab.label}</button>
                ))}
              </div>

              {activeTab === "hair" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
                    All styles are built for <strong style={{ color: T.cream }}>4C natural hair</strong> — coily, kinky textures celebrated.
                    Click a style to select it and move to outfits.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
                    {HAIRSTYLES.map(h => (
                      <StyleCard key={h.id} item={h} selected={selectedHair === h.id} type="hair"
                        onClick={() => { setSelectedHair(h.id); setActiveTab("outfit"); }} />
                    ))}
                  </div>
                </>
              )}

              {activeTab === "outfit" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
                    Each look is tailored to <strong style={{ color: T.cream }}>your skin tone and body type</strong> from the AI analysis.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
                    {OUTFITS.map(o => (
                      <StyleCard key={o.id} item={o} selected={selectedOutfit === o.id} type="outfit"
                        onClick={() => setSelectedOutfit(o.id)} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sticky generate */}
            <div style={{
              padding: "16px 24px", borderTop: `1px solid ${T.border}`,
              background: `${T.bg}F0`, position: "sticky", bottom: 0,
              backdropFilter: "blur(16px)",
            }}>
              {selectedHair && selectedOutfit && (
                <div style={{
                  background: `linear-gradient(135deg, ${T.purple}20, ${T.pink}15)`,
                  border: `1px solid ${T.purple}40`,
                  borderRadius: 12, padding: "10px 16px", marginBottom: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>YOUR LOOK:</span>
                  <span style={{ fontSize: 13, color: T.cream, fontWeight: 700 }}>
                    {hair?.emoji} {hair?.label} + {outfit?.emoji} {outfit?.label}
                  </span>
                </div>
              )}
              <button onClick={handleGenerate} disabled={!selectedHair || !selectedOutfit} style={{
                width: "100%",
                background: selectedHair && selectedOutfit
                  ? `linear-gradient(135deg, ${T.gold}, ${T.pink})`
                  : T.card,
                border: `1px solid ${selectedHair && selectedOutfit ? "transparent" : T.border}`,
                borderRadius: 14, padding: "16px",
                color: selectedHair && selectedOutfit ? "#000" : T.muted,
                fontSize: 13, fontWeight: 800,
                cursor: selectedHair && selectedOutfit ? "pointer" : "default",
                fontFamily: "inherit", transition: "all 0.3s",
                letterSpacing: 1,
                boxShadow: selectedHair && selectedOutfit ? `0 4px 20px ${T.pink}40` : "none",
              }}>
                {!selectedHair || !selectedOutfit ? "Select Hair + Outfit First" : "✦ Generate My Look"}
              </button>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {step === "generating" && (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column",
            gap: 28, padding: 40, minHeight: "calc(100vh - 57px)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                border: `3px solid ${T.border}`, borderTopColor: T.gold,
                borderRightColor: T.pink,
                animation: "spin 1s linear infinite", margin: "0 auto 28px",
              }} />
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: `${T.gold}15`, border: `1px solid ${T.gold}40`,
                borderRadius: 40, padding: "6px 18px", marginBottom: 16,
              }}>
                <span style={{ color: T.gold, fontSize: 11, fontWeight: 700 }}>GENERATING YOUR LOOK</span>
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800 }}>
                {hair?.emoji} {hair?.label} + {outfit?.emoji} {outfit?.label}
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.8, maxWidth: 320, margin: "0 auto" }}>
                Our AI is rendering your editorial look.<br />
                This takes <strong style={{ color: T.cream }}>30–60 seconds</strong>.<br />
                Please keep this page open.
              </p>
            </div>
            {photoUrl && (
              <div style={{ position: "relative" }}>
                <img src={photoUrl} style={{
                  height: 150, borderRadius: 16,
                  border: `2px solid ${T.gold}50`,
                  objectFit: "cover", filter: "brightness(0.5)",
                  display: "block",
                }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(135deg, ${T.purple}40, ${T.pink}30)`,
                  borderRadius: 16,
                }} />
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {step === "result" && generatedImage && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "32px 24px", background: "#050305",
              minHeight: "60vh",
            }}>
              <div style={{ position: "relative", maxWidth: 400, width: "100%" }}>
                <img src={generatedImage} alt="your look" style={{
                  width: "100%", borderRadius: 20,
                  border: `1px solid ${T.border}`,
                  boxShadow: `0 40px 80px #000, 0 0 40px ${T.purple}20`,
                  display: "block",
                }} />
                <div style={{
                  position: "absolute", bottom: 14, left: 14,
                  background: `${T.bg}F0`, borderRadius: 10, padding: "8px 14px",
                  border: `1px solid ${T.border}`,
                  backdropFilter: "blur(12px)",
                }}>
                  <div style={{ fontSize: 10, color: T.gold, fontWeight: 700, letterSpacing: 2 }}>
                    {hair?.emoji} {hair?.label} · {outfit?.emoji} {outfit?.label}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 24px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button onClick={() => { setSelectedHair(null); setSelectedOutfit(null); setStep("configure"); }} style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                  border: "none", borderRadius: 12, padding: "14px",
                  color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                  fontFamily: "inherit", letterSpacing: 1,
                  boxShadow: `0 4px 20px ${T.purple}40`,
                }}>✦ Try Another Look</button>
                <a href={generatedImage} download="mirra-look.jpg" style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: "14px", color: T.cream,
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                  letterSpacing: 1,
                }}>↓ Save Look</a>
              </div>
              <button onClick={reset} style={{
                width: "100%", background: "none",
                border: `1px solid ${T.border}`, borderRadius: 12,
                padding: "12px", color: T.muted, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              }}>Upload New Photo</button>

              {history.length > 1 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                    Previous Looks
                  </div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                    {history.slice(1).map(h => (
                      <div key={h.id} onClick={() => setGeneratedImage(h.url)} style={{
                        flexShrink: 0, cursor: "pointer",
                        borderRadius: 10, overflow: "hidden",
                        border: `2px solid ${T.border}`,
                        transition: "border-color 0.2s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                      >
                        <img src={h.url} style={{ width: 60, height: 80, objectFit: "cover", display: "block" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.purple}60; border-radius: 4px; }
      `}</style>
    </div>
  );
}
