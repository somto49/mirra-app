import { useState, useRef, useCallback } from "react";

const API_URL = "https://mirra-backend-b1c7.onrender.com";

const T = {
  bg: "#08060F",
  surface: "#0F0B1A",
  card: "#150F22",
  border: "#2A1E45",
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDim: "#7A5E2A",
  purple: "#9B5DE5",
  purpleLight: "#C084FC",
  purpleDim: "#4A2A7A",
  pink: "#F72585",
  pinkLight: "#FF6BA8",
  cream: "#F5EDD8",
  muted: "#7A6A90",
  green: "#4CAF7A",
};

const HAIRSTYLES = [
  { id: "twa", label: "TWA", desc: "Teeny Weeny Afro", color: T.purple },
  { id: "afro", label: "Full Afro", desc: "Big crown energy", color: T.pink },
  { id: "bantu", label: "Bantu Knots", desc: "Sculptural & regal", color: T.gold },
  { id: "braids", label: "Box Braids", desc: "Long & protective", color: T.purple },
  { id: "locs", label: "Faux Locs", desc: "Boho goddess", color: T.pink },
  { id: "sisterlocks", label: "Sisterlocks", desc: "Refined & elegant", color: T.gold },
  { id: "halo", label: "Halo Braid", desc: "Crowned royalty", color: T.purple },
  { id: "puff", label: "Afro Puff", desc: "High & proud", color: T.pink },
  { id: "flattwist", label: "Flat Twists", desc: "Sleek & defined", color: T.gold },
  { id: "cornrows", label: "Cornrows", desc: "Classic & sharp", color: T.purple },
];

const OUTFITS = [
  { id: "gala", label: "Black Tie Gala", desc: "Floor-length elegance", category: "Formal", color: T.gold },
  { id: "editorial", label: "Editorial", desc: "High fashion shoot", category: "Fashion", color: T.purple },
  { id: "street", label: "Street Luxe", desc: "Designer streetwear", category: "Casual", color: T.pink },
  { id: "business", label: "Power Suit", desc: "Boardroom authority", category: "Professional", color: T.gold },
  { id: "resort", label: "Resort Wear", desc: "Coastal luxury", category: "Vacation", color: T.purple },
  { id: "cocktail", label: "Cocktail", desc: "Evening chic", category: "Formal", color: T.pink },
  { id: "afrofusion", label: "Afro Fusion", desc: "Bold prints & cuts", category: "Cultural", color: T.gold },
  { id: "athleisure", label: "Athleisure", desc: "Elevated activewear", category: "Casual", color: T.purple },
  { id: "boho", label: "Boho Luxe", desc: "Flowing & free", category: "Casual", color: T.pink },
  { id: "monochrome", label: "Monochrome", desc: "One-color power", category: "Fashion", color: T.gold },
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

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.purpleDim})` }} />
      <span style={{ color: T.purpleDim, fontSize: 8, letterSpacing: 4 }}>✦ ✦ ✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${T.purpleDim})` }} />
    </div>
  );
}

function Pill({ active, onClick, children, color }) {
  const c = color || T.purple;
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 40,
      border: `1px solid ${active ? c : T.border}`,
      background: active ? `${c}22` : "transparent",
      color: active ? c : T.muted,
      fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
      cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function SelectCard({ item, selected, onClick }) {
  const c = item.color || T.purple;
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? `${c}18` : hovered ? `${c}10` : T.card,
        border: `1px solid ${selected ? c : hovered ? `${c}60` : T.border}`,
        borderRadius: 12, padding: "14px 18px",
        cursor: "pointer", textAlign: "left",
        transition: "all 0.2s", fontFamily: "inherit", position: "relative",
        transform: hovered && !selected ? "translateY(-2px)" : "none",
        boxShadow: selected ? `0 0 16px ${c}30` : hovered ? `0 4px 16px ${c}20` : "none",
      }}>
      {selected && <div style={{ position: "absolute", top: 8, right: 10, color: c, fontSize: 10 }}>✦</div>}
      <div style={{ color: selected ? c : T.cream, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
        {item.label}
      </div>
      <div style={{ color: T.muted, fontSize: 11 }}>{item.desc || item.category}</div>
    </button>
  );
}

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

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
    setAnalyzing(true);
    setError(null);
    setStep("upload");
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
    setStep("hero");
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

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.cream,
      fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
      display: "flex", flexDirection: "column",
    }}>
      <header style={{
        padding: "18px 28px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `linear-gradient(to bottom, #0A0614, transparent)`, flexShrink: 0,
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
      }}>
        <div onClick={reset} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{
              margin: 0, fontSize: 22, letterSpacing: 8, fontWeight: 400,
              background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>MIRRA</h1>
            <span style={{ color: T.gold, fontSize: 10, letterSpacing: 5, textTransform: "uppercase" }}>by Aya</span>
          </div>
          <p style={{ margin: 0, fontSize: 9, letterSpacing: 4, color: T.muted, textTransform: "uppercase" }}>
            AI Virtual Try-On · 4C Hair Specialist
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            border: `1px solid ${T.purple}`, borderRadius: 8, padding: "5px 12px",
            color: T.purple, fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
          }}>✦ Connected</div>
          {step !== "hero" && (
            <button onClick={reset} style={{
              background: "none", border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "5px 12px", color: T.muted,
              fontSize: 9, letterSpacing: 2, cursor: "pointer",
              fontFamily: "inherit", textTransform: "uppercase",
            }}>New Look</button>
          )}
        </div>
      </header>

      {error && (
        <div style={{
          background: "#2A0A0A", borderBottom: `1px solid #5A1A1A`,
          padding: "10px 28px", color: "#E87070", fontSize: 12, flexShrink: 0,
        }}>⚠ {error}</div>
      )}

      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* HERO */}
        {step === "hero" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "flex-start",
              padding: "32px 24px 48px", textAlign: "center",
              position: "relative", zIndex: 1,
            }}>
              <div style={{
                display: "inline-block", background: `${T.purple}22`,
                border: `1px solid ${T.purpleDim}`, borderRadius: 40,
                padding: "6px 18px", fontSize: 10, letterSpacing: 4,
                color: T.purpleLight, textTransform: "uppercase", marginBottom: 20,
              }}>✦ 4C Hair Specialist · AI Virtual Try-On</div>

              <h2 style={{
                margin: "0 0 16px", fontWeight: 400, letterSpacing: 2, lineHeight: 1.15,
                fontSize: "clamp(32px, 6vw, 56px)",
              }}>
                See Yourself in Every
                <span style={{
                  display: "block",
                  background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Look You've Imagined.</span>
              </h2>

              <p style={{ color: T.muted, fontSize: "clamp(13px, 2vw, 16px)", lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
                Upload your photo. Pick a 4C hairstyle and outfit.
                Our AI renders a fashion-editorial version of you — styled, lit, and shot to perfection.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
                {[
                  { icon: "✦", label: "No account needed" },
                  { icon: "⚡", label: "Results in under a minute" },
                  { icon: "👑", label: "4C hair first" },
                  { icon: "🎨", label: "10 hairstyles · 10 outfits" },
                ].map(f => (
                  <div key={f.label} style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 40, padding: "6px 16px",
                    fontSize: 11, color: T.cream, letterSpacing: 1,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ color: T.purple }}>{f.icon}</span> {f.label}
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setStep("upload"); setTimeout(() => fileRef.current?.click(), 100); }}
                style={{
                  background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                  border: "none", borderRadius: 50, padding: "16px 40px",
                  color: "#fff", fontSize: 13, letterSpacing: 4,
                  textTransform: "uppercase", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, marginBottom: 48,
                  boxShadow: `0 8px 32px ${T.purple}50`,
                }}>✦ Try On Now — Free</button>

              <GoldDivider />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 800, width: "100%", marginTop: 32 }}>
                {[
                  { step: "01", title: "Upload Your Photo", desc: "Drop a clear front-facing photo. Our AI reads your skin tone, face shape and features.", icon: "📷" },
                  { step: "02", title: "Pick Your Style", desc: "Choose from 10 4C hairstyles and 10 curated fashion looks. Hair and outfit work together.", icon: "✦" },
                  { step: "03", title: "See Your Look", desc: "Our AI generates an editorial-quality fashion image of you in under 60 seconds.", icon: "🖼️" },
                ].map(s => (
                  <div key={s.step} style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 16, padding: "24px 20px", textAlign: "left",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontSize: 9, letterSpacing: 4, color: T.purple, textTransform: "uppercase", marginBottom: 6 }}>Step {s.step}</div>
                    <div style={{ fontSize: 15, color: T.cream, marginBottom: 8, fontWeight: 500 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {(step === "upload" || analyzing) && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 6, color: T.purple, textTransform: "uppercase", marginBottom: 14 }}>
                Step 01 · Upload
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: 36, fontWeight: 400, letterSpacing: 2, lineHeight: 1.15 }}>
                Your Crown.<br />Your Canvas.
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
                Drop a clear photo — our AI analyzes your features and renders you in your chosen 4C look.
              </p>
              <div
                onClick={() => !analyzing && fileRef.current.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                style={{
                  border: `1px dashed ${analyzing ? T.purple : T.purpleDim}`,
                  borderRadius: 20, padding: "56px 40px",
                  cursor: analyzing ? "default" : "pointer",
                  background: analyzing ? `${T.purple}06` : T.card,
                  transition: "all 0.3s",
                }}
              >
                {analyzing ? (
                  <div>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: `2px solid ${T.purpleDim}`, borderTopColor: T.pink,
                      animation: "spin 1s linear infinite", margin: "0 auto 18px",
                    }} />
                    <div style={{ color: T.purple, fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>
                      Analyzing your features...
                    </div>
                    <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Reading skin tone, face shape & style</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 14, color: T.purpleDim }}>✦</div>
                    <div style={{ color: T.purpleLight, fontSize: 15, letterSpacing: 2, marginBottom: 6 }}>Drop your photo here</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>or click to browse · JPG, PNG, HEIC</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
              <GoldDivider />
              <p style={{ color: T.muted, fontSize: 11 }}>Best results with a clear, well-lit front-facing photo.</p>
            </div>
          </div>
        )}

        {/* CONFIGURE */}
        {step === "configure" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{
              width: 260, flexShrink: 0, borderRight: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", background: T.surface, overflow: "auto",
            }}>
              <div style={{ padding: "18px 18px 0" }}>
                <div style={{ fontSize: 9, letterSpacing: 4, color: T.purpleDim, textTransform: "uppercase", marginBottom: 8 }}>Your Photo</div>
                <img src={photoUrl} alt="uploaded" style={{
                  width: "100%", borderRadius: 12, border: `1px solid ${T.border}`,
                  objectFit: "cover", maxHeight: 260,
                }} />
              </div>
              {personData && (
                <div style={{ padding: "10px 18px" }}>
                  <GoldDivider />
                  <div style={{ fontSize: 9, letterSpacing: 4, color: T.purpleDim, textTransform: "uppercase", marginBottom: 8 }}>AI Analysis</div>
                  {[["Skin Tone", personData.skinTone], ["Build", personData.bodyBuild], ["Style", personData.currentStyle]].map(([k, v]) => v && (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: T.purpleDim, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 11, color: T.cream, lineHeight: 1.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ flex: 1 }} />
              <div style={{ padding: 18, borderTop: `1px solid ${T.border}` }}>
                {selectedHair && selectedOutfit && (
                  <div style={{ background: T.card, borderRadius: 8, padding: "8px 12px", border: `1px solid ${T.border}`, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, marginBottom: 3 }}>YOUR LOOK</div>
                    <div style={{ fontSize: 12, color: T.purpleLight }}>{hair?.label} + {outfit?.label}</div>
                  </div>
                )}
                <button onClick={handleGenerate} disabled={!selectedHair || !selectedOutfit} style={{
                  width: "100%",
                  background: selectedHair && selectedOutfit ? `linear-gradient(135deg, ${T.purple}, ${T.pink})` : T.card,
                  border: `1px solid ${selectedHair && selectedOutfit ? T.purple : T.border}`,
                  borderRadius: 10, padding: "14px",
                  color: selectedHair && selectedOutfit ? "#fff" : T.muted,
                  fontSize: 10, letterSpacing: 4, textTransform: "uppercase",
                  cursor: selectedHair && selectedOutfit ? "pointer" : "default",
                  fontFamily: "inherit", fontWeight: 700, transition: "all 0.3s",
                  boxShadow: selectedHair && selectedOutfit ? `0 4px 20px ${T.purple}40` : "none",
                }}>
                  {!selectedHair || !selectedOutfit ? "Select Hair + Outfit" : "✦ Generate My Look"}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "22px 24px" }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: T.purpleDim, textTransform: "uppercase", marginBottom: 4 }}>Step 02 · Style</div>
              <h3 style={{ margin: "0 0 18px", fontSize: 22, fontWeight: 400, letterSpacing: 2 }}>Build Your Look</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <Pill active={activeTab === "hair"} onClick={() => setActiveTab("hair")} color={T.purple}>
                  {selectedHair ? `✦ ${hair?.label}` : "Hair Style"}
                </Pill>
                <Pill active={activeTab === "outfit"} onClick={() => setActiveTab("outfit")} color={T.pink}>
                  {selectedOutfit ? `✦ ${outfit?.label}` : "Outfit"}
                </Pill>
              </div>
              {activeTab === "hair" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>
                    All styles celebrate 4C natural hair — coily, tight curl patterns front and centre.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                    {HAIRSTYLES.map(h => (
                      <SelectCard key={h.id} item={h} selected={selectedHair === h.id}
                        onClick={() => { setSelectedHair(h.id); setActiveTab("outfit"); }} />
                    ))}
                  </div>
                </>
              )}
              {activeTab === "outfit" && (
                <>
                  <p style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>
                    Each look is tailored to your skin tone and body type from the AI analysis.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
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
        {step === "generating" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, padding: 40 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: `2px solid ${T.purpleDim}`, borderTopColor: T.pink,
                animation: "spin 1.5s linear infinite", margin: "0 auto 24px",
              }} />
              <div style={{ fontSize: 10, letterSpacing: 6, color: T.purple, textTransform: "uppercase", marginBottom: 8 }}>Generating</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 400, letterSpacing: 2 }}>
                {hair?.label} + {outfit?.label}
              </h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }}>
                Our AI is rendering your editorial look.<br />This takes 45–90 seconds — hang tight!
              </p>
            </div>
            {photoUrl && (
              <img src={photoUrl} style={{
                height: 140, borderRadius: 12, border: `1px solid ${T.border}`,
                objectFit: "cover", filter: "brightness(0.4)",
              }} />
            )}
          </div>
        )}

        {/* RESULT */}
        {step === "result" && generatedImage && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, background: "#050302" }}>
              <div style={{ position: "relative", maxWidth: 440, width: "100%" }}>
                <img src={generatedImage} alt="generated look" style={{
                  width: "100%", borderRadius: 18, border: `1px solid ${T.border}`,
                  boxShadow: `0 40px 80px #000`,
                }} />
                <div style={{
                  position: "absolute", bottom: 14, left: 14,
                  background: `${T.bg}E8`, borderRadius: 8, padding: "8px 14px",
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontSize: 9, color: T.purple, letterSpacing: 3, textTransform: "uppercase" }}>
                    {hair?.label} · {outfit?.label}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ width: 270, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface }}>
              <div style={{ padding: "20px 20px 0", flex: 1, overflow: "auto" }}>
                <div style={{ fontSize: 9, letterSpacing: 4, color: T.purpleDim, textTransform: "uppercase", marginBottom: 8 }}>Your Look</div>
                <h3 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 400 }}>{hair?.label}</h3>
                <p style={{ margin: "0 0 4px", color: T.muted, fontSize: 11 }}>{hair?.desc}</p>
                <GoldDivider />
                <h3 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 400 }}>{outfit?.label}</h3>
                <p style={{ margin: "0 0 4px", color: T.muted, fontSize: 11 }}>{outfit?.desc}</p>
                {history.length > 1 && (
                  <>
                    <GoldDivider />
                    <div style={{ fontSize: 9, letterSpacing: 4, color: T.purpleDim, textTransform: "uppercase", marginBottom: 8 }}>Previous</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {history.slice(1).map(h => (
                        <div key={h.id} onClick={() => setGeneratedImage(h.url)} style={{
                          display: "flex", gap: 8, alignItems: "center",
                          cursor: "pointer", padding: 7, borderRadius: 8,
                          border: `1px solid ${T.border}`, background: T.card,
                          transition: "all 0.2s",
                        }}>
                          <img src={h.url} style={{ width: 36, height: 46, objectFit: "cover", borderRadius: 5 }} />
                          <div>
                            <div style={{ fontSize: 10, color: T.cream }}>{h.hair}</div>
                            <div style={{ fontSize: 9, color: T.muted }}>{h.outfit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{ padding: 18, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { setSelectedHair(null); setSelectedOutfit(null); setStep("configure"); }} style={{
                  background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                  border: "none", borderRadius: 10, padding: "13px",
                  color: "#fff", fontSize: 10, letterSpacing: 3, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, textTransform: "uppercase",
                  boxShadow: `0 4px 16px ${T.purple}40`,
                }}>✦ Try Another Look</button>
                <a href={generatedImage} download="mirra-look.jpg" style={{
                  display: "block", background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "11px", color: T.cream,
                  fontSize: 10, letterSpacing: 3, textDecoration: "none",
                  textAlign: "center", textTransform: "uppercase",
                }}>↓ Download</a>
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
        ::-webkit-scrollbar-thumb { background: ${T.purpleDim}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
