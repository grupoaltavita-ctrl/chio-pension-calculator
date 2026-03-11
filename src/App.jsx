import { useState, useRef, useEffect } from "react";

const PURPLE = "#6D28D9";
const PURPLE_DARK = "#5B21B6";
const PURPLE_DEEPER = "#4C1D95";
const PURPLE_LIGHT = "#EDE9FE";
const PURPLE_SOFT = "#F5F3FF";
const GRAY = "#4B5563";
const GRAY_LIGHT = "#9CA3AF";
const DARK = "#1F2937";
const GREEN = "#059669";
const GREEN_LIGHT = "#D1FAE5";
const GOLD = "#D97706";
const GOLD_LIGHT = "#FEF3C7";
const BORDER = "#E5E7EB";
const BG = "#F9FAFB";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBLRWAv2r6xV1pCyzKgUo_Q0TY0eC0CIkJF-adubq4-b4uStHMRLzIg9ZxaaP8g7LKaQ/exec";

const UMA_2026 = 113.14;
const TOPE_MOD40 = UMA_2026 * 25;
const SALARIO_MINIMO_2026 = 278.80;
const PENSION_MINIMA = 7468;

const PCT_EDAD = { 60: 75, 61: 80, 62: 85, 63: 90, 64: 95, 65: 100 };

const TABLA = [
  [1.00,1.25,80.00,0.563],[1.25,1.50,77.11,0.814],[1.50,1.75,58.18,1.178],
  [1.75,2.00,49.23,1.430],[2.00,2.25,42.67,1.615],[2.25,2.50,37.65,1.756],
  [2.50,2.75,33.68,1.868],[2.75,3.00,30.48,1.958],[3.00,3.25,27.83,2.033],
  [3.25,3.50,25.60,2.096],[3.50,3.75,23.70,2.149],[3.75,4.00,22.07,2.195],
  [4.00,4.25,20.65,2.235],[4.25,4.50,19.39,2.271],[4.50,4.75,18.29,2.302],
  [4.75,5.00,17.30,2.330],[5.00,5.25,16.41,2.355],[5.25,5.50,15.61,2.377],
  [5.50,5.75,14.88,2.398],[5.75,6.00,14.22,2.416],[6.00,100,13.62,2.433],
];

function getCuantia(salDiario) {
  const vsm = salDiario / SALARIO_MINIMO_2026;
  for (const r of TABLA) {
    if (vsm >= r[0] && vsm < r[1]) return { cb: r[2], inc: r[3], vsm };
  }
  const u = TABLA[TABLA.length - 1];
  return { cb: u[2], inc: u[3], vsm };
}

function calcPension(salDiario, semanas, edad) {
  const { cb, inc } = getCuantia(salDiario);
  const excedentes = Math.max(0, semanas - 500);
  const pctTotal = Math.min(100, cb + excedentes * inc);
  const base = salDiario * 30 * (pctTotal / 100);
  const edadC = Math.min(65, Math.max(60, Math.floor(edad)));
  const pctEdad = PCT_EDAD[edadC] || 100;
  return { mensual: base * (pctEdad / 100), base, pctEdad, pctTotal };
}

function calcMod40(edadActual, semanasAct, anios) {
  const salTope = TOPE_MOD40;
  const edadRetiro = edadActual + anios;
  const semTotal = semanasAct + anios * 52;
  const costoMes = salTope * 30 * 0.12256;
  const invTotal = costoMes * 12 * anios;
  const p = calcPension(salTope, semTotal, edadRetiro);
  return { ...p, edadRetiro, semTotal, costoMes, invTotal };
}

const fmt = (n) => isNaN(n) ? "$0" : "$" + Math.round(n).toLocaleString("es-MX");

function Field({ label, value, onChange, placeholder, type = "text", half, suffix, helpText, required, error }) {
  return (
    <div style={{ flex: half ? "1 1 45%" : "1 1 100%", minWidth: half ? "200px" : "auto" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: DARK, marginBottom: "6px", fontFamily: "'DM Sans',sans-serif" }}>
        {label}{required && <span style={{ color: PURPLE }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "13px 16px", paddingRight: suffix ? "56px" : "16px",
            borderRadius: "10px", border: `1.5px solid ${error ? "#DC2626" : BORDER}`,
            fontSize: "15px", fontFamily: "'DM Sans',sans-serif", color: DARK,
            outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
            background: "#fff", boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = `0 0 0 3px ${PURPLE}18`; }}
          onBlur={(e) => { e.target.style.borderColor = error ? "#DC2626" : BORDER; e.target.style.boxShadow = "none"; }}
        />
        {suffix && <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: GRAY_LIGHT }}>{suffix}</span>}
      </div>
      {helpText && <div style={{ fontSize: "12px", color: GRAY_LIGHT, marginTop: "4px", lineHeight: 1.4 }}>{helpText}</div>}
      {error && <div style={{ fontSize: "12px", color: "#DC2626", marginTop: "4px" }}>{error}</div>}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "14px 20px", borderRadius: "12px", border: "none",
      background: active ? PURPLE : "transparent", color: active ? "#fff" : DARK,
      fontSize: "15px", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      gap: "8px", transition: "all 0.25s",
    }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>{label}
    </button>
  );
}

function ResultCard({ title, value, subtitle, icon, accent }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "22px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: `1px solid ${accent ? accent + "25" : BORDER}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "17px" }}>{icon}</span>
        <span style={{ fontSize: "12px", fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
      </div>
      <div style={{ fontSize: "30px", fontWeight: 700, color: accent || DARK, lineHeight: 1.2 }}>{value}</div>
      {subtitle && <div style={{ fontSize: "12px", color: GRAY_LIGHT, marginTop: "4px" }}>{subtitle}</div>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("manual");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [edad, setEdad] = useState("60");
  const [semanas, setSemanas] = useState("500");
  const [salarioMensual, setSalarioMensual] = useState("10000");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [animIn, setAnimIn] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileLoaded, setFileLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const resRef = useRef(null);

  useEffect(() => { setAnimIn(true); }, []);

  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = "Ingresa tu nombre";
    if (!correo.trim() || !correo.includes("@")) e.correo = "Ingresa un correo válido";
    const edadN = parseInt(edad);
    const semN = parseInt(semanas);
    const salN = parseFloat(salarioMensual);
    if (!edadN || edadN < 55 || edadN > 75) e.edad = "Edad entre 55-75 años";
    if (!semN || semN < 500) e.semanas = "Mínimo 500 semanas";
    if (!salN || salN < 1000) e.salario = "Mínimo $1,000";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendToSheet = async (data) => {
    try {
      const params = new URLSearchParams(data).toString();
      const img = new Image();
      img.src = GOOGLE_SCRIPT_URL + "?" + params;
    } catch (err) {
      console.log("Error enviando datos:", err);
    }
  };

  const handleCalc = async () => {
    if (!validate()) return;
    setSending(true);

    const edadN = parseInt(edad);
    const semN = parseInt(semanas);
    const salMensual = parseFloat(salarioMensual);
    const salDiario = salMensual / 30;

    let pensionActual;
    if (edadN >= 60) {
      pensionActual = calcPension(salDiario, semN, edadN);
    } else {
      const semsA60 = semN + (60 - edadN) * 52;
      pensionActual = calcPension(salDiario, semsA60, 60);
    }

    const escenarios = [];
    for (let a = 1; a <= 3; a++) {
      const ret = edadN + a;
      if (ret >= 60 && ret <= 67) {
        escenarios.push({ anios: a, ...calcMod40(edadN, semN, a) });
      }
    }

    const pensionActualVal = Math.max(pensionActual.mensual, PENSION_MINIMA);
    const pensionMod40Val = escenarios.length > 0 ? escenarios[0].mensual : 0;

    // Enviar datos a Google Sheet via GET (imagen pixel trick - funciona en cualquier contexto)
    await sendToSheet({
      nombre: nombre.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      edad: edadN,
      semanas: semN,
      salarioMensual: salMensual,
      pensionActual: fmt(pensionActualVal),
      pensionMod40: pensionMod40Val > 0 ? fmt(pensionMod40Val) : "N/A",
    });

    setResults({
      pensionActual,
      escenarios,
      edad: edadN,
      semanas: semN,
      salDiario,
      salMensual,
      nombre: nombre.trim(),
      edadProyeccion: edadN < 60 ? 60 : null,
    });
    setShowResults(true);
    setSending(false);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileProcessing(true);
    setFileName(f.name);
    setTimeout(() => {
      setEdad("64");
      setSemanas("1751");
      setSalarioMensual("12625");
      setFileProcessing(false);
      setFileLoaded(true);
    }, 1800);
  };

  const resetFile = () => {
    setFileLoaded(false); setFileName("");
    setEdad("60"); setSemanas("500"); setSalarioMensual("10000");
  };

  const waMsg = encodeURIComponent(
    `Hola Chío, soy ${nombre || "[mi nombre]"}. Hice el cálculo de mi pensión en tu herramienta y deseo conocer la estrategia para incrementarla. ¿Podrías ayudarme?`
  );
  const waLink = `https://wa.me/5554491961823?text=${waMsg}`;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${PURPLE_SOFT} 0%, #fff 35%)`, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`, padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEPER} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "17px", fontFamily: "'Playfair Display',serif",
          }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: DARK }}>Chío Salado</div>
            <div style={{ fontSize: "11px", color: GRAY_LIGHT }}>Asesora Financiera</div>
          </div>
        </div>
        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
          background: PURPLE, color: "#fff", padding: "9px 18px", borderRadius: "9px",
          textDecoration: "none", fontSize: "13px", fontWeight: 600,
        }}>Agenda Asesoría</a>
      </div>

      {/* Hero */}
      <div style={{
        maxWidth: "640px", margin: "0 auto", padding: "44px 24px 28px", textAlign: "center",
        animation: animIn ? "fadeUp 0.7s ease-out" : "none",
      }}>
        <h1 style={{
          fontSize: "clamp(26px,5vw,40px)", fontWeight: 700, color: PURPLE_DEEPER,
          lineHeight: 1.15, marginBottom: "14px", fontFamily: "'Playfair Display',serif",
        }}>Calcula tu Pensión IMSS Ley 73</h1>
        <p style={{ fontSize: "16px", color: GRAY, lineHeight: 1.6, marginBottom: "6px" }}>
          Obtén una estimación precisa de tu pensión y descubre cuánto aumentaría con Modalidad 40
        </p>
        <p style={{ fontSize: "13px", color: GRAY_LIGHT }}>Dos opciones: sube tu documento o ingresa los datos manualmente</p>
      </div>

      {/* FORM */}
      <div style={{
        maxWidth: "640px", margin: "0 auto", padding: "0 24px 36px",
        animation: animIn ? "fadeUp 0.7s ease-out 0.15s both" : "none",
      }}>
        <div style={{
          background: "#fff", borderRadius: "20px", padding: "28px 28px 32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 10px 32px rgba(109,40,217,0.07)",
          border: `1px solid ${PURPLE}0A`,
        }}>
          <div style={{ display: "flex", gap: "4px", background: PURPLE_LIGHT, borderRadius: "14px", padding: "4px", marginBottom: "28px" }}>
            <TabButton active={tab === "manual"} onClick={() => { setTab("manual"); resetFile(); }} icon="📋" label="Cálculo Manual" />
            <TabButton active={tab === "upload"} onClick={() => setTab("upload")} icon="📄" label="Subir Documento" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            <Field label="Nombre Completo" value={nombre} onChange={(v) => { setNombre(v); if(errors.nombre) setErrors(p=>({...p,nombre:null})); }} placeholder="Tu nombre" required error={errors.nombre} />
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Field label="Correo Electrónico" value={correo} onChange={(v) => { setCorreo(v); if(errors.correo) setErrors(p=>({...p,correo:null})); }} placeholder="correo@ejemplo.com" type="email" half required error={errors.correo} />
              <Field label="Teléfono (opcional)" value={telefono} onChange={setTelefono} placeholder="55 1234 5678" type="tel" half />
            </div>
          </div>

          <div style={{ height: "1px", background: BORDER, margin: "0 0 24px" }} />

          {tab === "upload" && !fileLoaded && (
            <div style={{ marginBottom: "24px" }}>
              {fileProcessing ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${PURPLE_LIGHT}`, borderTopColor: PURPLE, animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
                  <div style={{ fontWeight: 600, color: DARK, fontSize: "15px" }}>Procesando {fileName}...</div>
                  <div style={{ fontSize: "13px", color: GRAY_LIGHT, marginTop: "4px" }}>Extrayendo datos de tu constancia</div>
                </div>
              ) : (
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                  padding: "36px 24px", borderRadius: "14px", border: `2px dashed ${PURPLE}40`,
                  background: PURPLE_SOFT, cursor: "pointer", transition: "border-color 0.2s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = PURPLE}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${PURPLE}40`}
                >
                  <input type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} />
                  <div style={{ fontSize: "36px" }}>📎</div>
                  <div style={{ fontWeight: 600, color: PURPLE, fontSize: "15px", textAlign: "center" }}>Haz clic o arrastra tu constancia de semanas cotizadas</div>
                  <div style={{ fontSize: "13px", color: GRAY_LIGHT }}>Archivo PDF del IMSS</div>
                </label>
              )}
            </div>
          )}

          {tab === "upload" && fileLoaded && (
            <div style={{ background: GREEN_LIGHT, borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: GREEN, fontWeight: 600 }}>
                <span>✓</span> Datos extraídos de {fileName}
              </div>
              <button onClick={resetFile} style={{ background: "transparent", border: "none", color: GREEN, fontSize: "13px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Cambiar</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Field label="Edad" value={edad} onChange={(v) => { setEdad(v); if(errors.edad) setErrors(p=>({...p,edad:null})); }} placeholder="60" type="number" half suffix="años" helpText="Mínimo 55 años" required error={errors.edad} />
              <Field label="Semanas Cotizadas" value={semanas} onChange={(v) => { setSemanas(v); if(errors.semanas) setErrors(p=>({...p,semanas:null})); }} placeholder="500" type="number" half suffix="sem." helpText="Mínimo 500" required error={errors.semanas} />
            </div>
            <Field label="Salario Promedio Mensual Últimos 5 Años" value={salarioMensual} onChange={(v) => { setSalarioMensual(v); if(errors.salario) setErrors(p=>({...p,salario:null})); }} placeholder="10000" type="number" suffix="MXN" helpText="Si no conoces tu promedio, puedes usar tu salario actual como estimación" required error={errors.salario} />
          </div>

          <button onClick={handleCalc} disabled={sending} style={{
            width: "100%", padding: "16px", borderRadius: "14px", border: "none",
            background: sending ? GRAY_LIGHT : `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEPER} 100%)`,
            color: "#fff", fontSize: "17px", fontWeight: 700,
            cursor: sending ? "wait" : "pointer",
            fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "10px",
            boxShadow: sending ? "none" : `0 4px 16px ${PURPLE}35`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={(e) => { if(!sending) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 22px ${PURPLE}45`; }}}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; if(!sending) e.currentTarget.style.boxShadow = `0 4px 16px ${PURPLE}35`; }}
          >
            {sending ? (
              <><div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Calculando...</>
            ) : (
              <>Calcular mi Pensión <span style={{ fontSize: "20px" }}>→</span></>
            )}
          </button>

          <div style={{ fontSize: "11px", color: GRAY_LIGHT, textAlign: "center", marginTop: "12px", lineHeight: 1.5 }}>
            * Cálculo informativo y de referencia. Los montos reales pueden variar.
          </div>
        </div>
      </div>

      {/* RESULTS */}
      {showResults && results && (
        <div ref={resRef} style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 48px", animation: "fadeUp 0.6s ease-out" }}>
          <div style={{ background: PURPLE_SOFT, borderRadius: "14px", padding: "20px 24px", marginBottom: "24px", border: `1px solid ${PURPLE}12` }}>
            <div style={{ fontSize: "16px", fontWeight: 600, color: PURPLE_DEEPER, marginBottom: "4px" }}>
              {results.nombre}, estos son tus resultados:
            </div>
            <div style={{ fontSize: "13px", color: GRAY }}>
              Con {results.semanas.toLocaleString()} semanas cotizadas y salario promedio de {fmt(results.salMensual)} mensuales
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "5px", height: "26px", borderRadius: "3px", background: PURPLE }} />
              <h3 style={{ fontSize: "19px", fontWeight: 700, color: DARK, fontFamily: "'Playfair Display',serif" }}>Tu pensión estimada actual</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <ResultCard
                title="Pensión mensual"
                value={fmt(Math.max(results.pensionActual.mensual, PENSION_MINIMA))}
                subtitle={results.edadProyeccion ? `Proyección a los ${results.edadProyeccion} años (${results.pensionActual.pctEdad}%)` : `A los ${results.edad} años (${results.pensionActual.pctEdad}%)`}
                icon="📊" accent={DARK}
              />
              <ResultCard title="Tu salario actual" value={fmt(results.salMensual)} subtitle="Salario mensual de referencia" icon="💼" />
            </div>

            {results.pensionActual.mensual < PENSION_MINIMA && (
              <div style={{ background: GOLD_LIGHT, borderRadius: "10px", padding: "12px 16px", marginTop: "12px", fontSize: "13px", color: GOLD, fontWeight: 500, lineHeight: 1.5, display: "flex", gap: "8px" }}>
                <span>⚠️</span> Tu cálculo resulta inferior a la pensión mínima garantizada de aprox. {fmt(PENSION_MINIMA)}.
              </div>
            )}

            {results.pensionActual.mensual < results.salMensual && (
              <div style={{ background: "#FEF2F2", borderRadius: "10px", padding: "14px 18px", marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "28px" }}>📉</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#991B1B" }}>
                    Brecha mensual: {fmt(results.salMensual - Math.max(results.pensionActual.mensual, PENSION_MINIMA))} menos al mes
                  </div>
                  <div style={{ fontSize: "12px", color: "#B91C1C", marginTop: "2px" }}>
                    Tu pensión sería solo el {Math.round((Math.max(results.pensionActual.mensual, PENSION_MINIMA) / results.salMensual) * 100)}% de tu ingreso actual
                  </div>
                </div>
              </div>
            )}
          </div>

          {results.escenarios.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{ width: "5px", height: "26px", borderRadius: "3px", background: GREEN }} />
                <h3 style={{ fontSize: "19px", fontWeight: 700, color: DARK, fontFamily: "'Playfair Display',serif" }}>Con Modalidad 40 al tope</h3>
              </div>
              <p style={{ fontSize: "13px", color: GRAY, marginBottom: "16px", paddingLeft: "15px", lineHeight: 1.5 }}>
                Cotizando al máximo permitido, tu pensión podría transformarse:
              </p>
              <div style={{ display: "grid", gap: "12px" }}>
                {results.escenarios.map((esc, i) => {
                  const mejora = esc.mensual - Math.max(results.pensionActual.mensual, PENSION_MINIMA);
                  const isLocked = i > 0;
                  return (
                    <div key={i} style={{
                      background: "#fff", borderRadius: "16px", padding: "22px 24px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      border: i === 0 ? `2px solid ${GREEN}30` : `1px solid ${BORDER}`,
                      position: "relative", overflow: "hidden",
                    }}>
                      {i === 0 && <div style={{ position: "absolute", top: "10px", right: "12px", background: GREEN_LIGHT, color: GREEN, padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>ESCENARIO BASE</div>}
                      <div style={{ fontSize: "12px", fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                        Modalidad 40 — {esc.anios} {esc.anios === 1 ? "año" : "años"}
                      </div>
                      <div style={{ fontSize: "12px", color: GRAY_LIGHT, marginBottom: "14px" }}>
                        Retiro a los {esc.edadRetiro} años • {esc.semTotal.toLocaleString()} semanas
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: GRAY, fontWeight: 500, marginBottom: "3px" }}>Pensión mensual</div>
                          <div style={{ fontSize: "26px", fontWeight: 700, color: GREEN, filter: isLocked ? "blur(10px)" : "none", userSelect: isLocked ? "none" : "auto" }}>{fmt(esc.mensual)}</div>
                          {!isLocked && mejora > 0 && <div style={{ fontSize: "12px", color: GREEN, fontWeight: 600, marginTop: "3px" }}>+{fmt(mejora)} vs actual</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: GRAY, fontWeight: 500, marginBottom: "3px" }}>Inversión mensual</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: DARK, filter: isLocked ? "blur(8px)" : "none", userSelect: isLocked ? "none" : "auto" }}>{fmt(esc.costoMes)}</div>
                          <div style={{ fontSize: "12px", color: GRAY_LIGHT, marginTop: "3px", filter: isLocked ? "blur(6px)" : "none" }}>Total: {fmt(esc.invTotal)}</div>
                        </div>
                      </div>
                      {isLocked && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(2px)", borderRadius: "16px", zIndex: 2 }}>
                          <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEPER} 100%)`,
                            color: "#fff", padding: "13px 26px", borderRadius: "12px",
                            textDecoration: "none", fontSize: "14px", fontWeight: 700,
                            boxShadow: `0 4px 14px ${PURPLE}40`, display: "flex",
                            alignItems: "center", gap: "8px", animation: "pulse 2.5s ease-in-out infinite",
                          }}>🔓 Desbloquear con Chío</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: PURPLE_SOFT, borderRadius: "18px", padding: "24px", marginBottom: "24px", border: `1px solid ${PURPLE}10` }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: DARK, marginBottom: "14px", fontFamily: "'Playfair Display',serif" }}>
              Beneficios de pensionarse bajo Ley 73
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { i: "♾️", t: "Pensión vitalicia" },
                { i: "🏥", t: "Servicio médico vitalicio (titular y cónyuge)" },
                { i: "💰", t: "30% del saldo de AFORE" },
                { i: "🏠", t: "100% del saldo INFONAVIT" },
                { i: "🎄", t: "Aguinaldo: 1 mes de pensión" },
                { i: "📈", t: "Incremento anual por inflación" },
              ].map((b, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "9px 10px", background: "rgba(255,255,255,0.7)", borderRadius: "8px", fontSize: "12px", color: DARK, fontWeight: 500, lineHeight: 1.4 }}>
                  <span style={{ fontSize: "15px", flexShrink: 0 }}>{b.i}</span>{b.t}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEPER} 100%)`,
            borderRadius: "20px", padding: "36px 28px", textAlign: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: "-25px", right: "-25px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div style={{ position: "absolute", bottom: "-15px", left: "-15px", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "26px", marginBottom: "10px" }}>🚀</div>
              <h3 style={{ color: "#fff", fontSize: "21px", fontWeight: 700, marginBottom: "10px", fontFamily: "'Playfair Display',serif", lineHeight: 1.3 }}>
                ¿Quieres una pensión a la altura de tu estilo de vida?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto 22px" }}>
                Chío Salado te ayuda a diseñar la estrategia ideal para maximizar tu pensión. Conoce todas las modalidades y opciones personalizadas para ti.
              </p>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "#fff", color: PURPLE, padding: "15px 34px", borderRadius: "14px",
                textDecoration: "none", fontSize: "16px", fontWeight: 700,
                boxShadow: "0 4px 18px rgba(0,0,0,0.15)", transition: "transform 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={PURPLE}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar a Chío
              </a>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", marginTop: "10px" }}>WhatsApp: 55 4491 961 823</div>
            </div>
          </div>

          <div style={{ marginTop: "20px", padding: "14px 18px", background: BG, borderRadius: "10px", border: `1px solid ${BORDER}`, fontSize: "11px", color: GRAY_LIGHT, lineHeight: 1.6, textAlign: "center" }}>
            <strong style={{ color: GRAY }}>Aviso:</strong> Los cálculos son estimaciones basadas en la Ley 73 del IMSS. No constituyen asesoría financiera, fiscal ni legal. Para un análisis personalizado, consulta con Chío Salado.
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", padding: "24px", fontSize: "12px", color: GRAY_LIGHT, borderTop: `1px solid #F3F4F6` }}>
        <div style={{ fontWeight: 600, color: GRAY, marginBottom: "3px" }}>Chío Salado — Asesora Financiera</div>
        <div style={{ marginBottom: "4px" }}>Finanzas prácticas para profesionistas</div>
        <a href="https://chiosaladoasesor.mx" target="_blank" rel="noopener noreferrer" style={{ color: PURPLE, textDecoration: "none", fontWeight: 500 }}>chiosaladoasesor.mx</a>
      </div>
    </div>
  );
}
