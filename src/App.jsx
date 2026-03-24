import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* ===================== PASSWORD ===================== */
const APP_PASSWORD = "VIRAA26";

function PasswordGate({ onSuccess }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const handleSubmit = () => {
    if (pwd === APP_PASSWORD) {
      sessionStorage.setItem("prospects-auth", "ok");
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", width: "90%", maxWidth: 400, boxShadow: "0 25px 60px rgba(0,0,0,0.3)", textAlign: "center", animation: "modalIn 0.4s ease" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#94a3b8", marginBottom: 4 }}>VINCI IMMOBILIER</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Prospects & Recherches</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Accès réservé — veuillez entrer le mot de passe</p>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="Mot de passe" autoFocus
          style={{ width: "100%", padding: "12px 16px", border: error ? "2px solid #ef4444" : "1.5px solid #d1d5db", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center", letterSpacing: 2, boxSizing: "border-box" }} />
        {error && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginTop: 8 }}>Mot de passe incorrect</div>}
        <button onClick={handleSubmit} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Accéder</button>
      </div>
    </div>
  );
}

/* ===================== COORDS ===================== */
const LOCALITE_COORDS = {
  "Albigny-sur-Saône":{lat:45.865,lng:4.833},"Bron":{lat:45.738,lng:4.907},
  "Cailloux-sur-Fontaines":{lat:45.856,lng:4.867},"Caluire-et-Cuire":{lat:45.795,lng:4.847},
  "Champagne-au-Mont-d'Or":{lat:45.797,lng:4.790},"Charbonnières-les-Bains":{lat:45.784,lng:4.747},
  "Chassieu":{lat:45.738,lng:4.961},"Collonges-au-Mont-d'Or":{lat:45.822,lng:4.839},
  "Corbas":{lat:45.668,lng:4.901},"Couzon-au-Mont-d'Or":{lat:45.843,lng:4.831},
  "Craponne":{lat:45.745,lng:4.723},"Curis-au-Mont-d'Or":{lat:45.870,lng:4.816},
  "Dardilly":{lat:45.807,lng:4.755},"Décines-Charpieu":{lat:45.770,lng:4.955},
  "Écully":{lat:45.773,lng:4.778},"Feyzin":{lat:45.672,lng:4.860},
  "Fleurieu-sur-Saône":{lat:45.867,lng:4.843},"Fontaines-Saint-Martin":{lat:45.845,lng:4.863},
  "Fontaines-sur-Saône":{lat:45.835,lng:4.847},"Francheville":{lat:45.740,lng:4.760},
  "Genay":{lat:45.893,lng:4.838},"Givors":{lat:45.590,lng:4.770},
  "Grigny":{lat:45.607,lng:4.791},"Irigny":{lat:45.674,lng:4.823},
  "Jonage":{lat:45.784,lng:5.005},"La Mulatière":{lat:45.730,lng:4.815},
  "La Tour-de-Salvagny":{lat:45.812,lng:4.718},"Limonest":{lat:45.812,lng:4.772},
  "Lissieu":{lat:45.838,lng:4.745},"Lyon":{lat:45.764,lng:4.835},
  "Lyon 1er":{lat:45.769,lng:4.830},"Lyon 2ème":{lat:45.753,lng:4.830},
  "Lyon 3ème":{lat:45.759,lng:4.858},"Lyon 4ème":{lat:45.780,lng:4.828},
  "Lyon 5ème":{lat:45.757,lng:4.815},"Lyon 6ème":{lat:45.770,lng:4.852},
  "Lyon 7ème":{lat:45.737,lng:4.840},"Lyon 8ème":{lat:45.733,lng:4.868},
  "Lyon 9ème":{lat:45.780,lng:4.806},"Marcy-l'Étoile":{lat:45.783,lng:4.717},
  "Meyzieu":{lat:45.767,lng:4.999},"Mions":{lat:45.664,lng:4.952},
  "Montanay":{lat:45.904,lng:4.866},"Neuville-sur-Saône":{lat:45.877,lng:4.842},
  "Oullins":{lat:45.714,lng:4.810},"Pierre-Bénite":{lat:45.704,lng:4.822},
  "Poleymieux-au-Mont-d'Or":{lat:45.859,lng:4.801},"Quincieux":{lat:45.913,lng:4.776},
  "Rillieux-la-Pape":{lat:45.821,lng:4.898},"Rochetaillée-sur-Saône":{lat:45.849,lng:4.838},
  "Saint-Cyr-au-Mont-d'Or":{lat:45.812,lng:4.826},"Saint-Didier-au-Mont-d'Or":{lat:45.813,lng:4.797},
  "Saint-Fons":{lat:45.709,lng:4.854},"Saint-Genis-Laval":{lat:45.694,lng:4.793},
  "Saint-Genis-les-Ollières":{lat:45.758,lng:4.727},"Saint-Germain-au-Mont-d'Or":{lat:45.884,lng:4.807},
  "Saint-Priest":{lat:45.696,lng:4.943},"Saint-Romain-au-Mont-d'Or":{lat:45.835,lng:4.826},
  "Sainte-Foy-lès-Lyon":{lat:45.735,lng:4.795},"Sathonay-Camp":{lat:45.822,lng:4.873},
  "Sathonay-Village":{lat:45.830,lng:4.877},"Solaize":{lat:45.639,lng:4.840},
  "Tassin-la-Demi-Lune":{lat:45.764,lng:4.776},"Vaulx-en-Velin":{lat:45.787,lng:4.919},
  "Vénissieux":{lat:45.697,lng:4.879},"Vernaison":{lat:45.652,lng:4.816},
  "Villeurbanne":{lat:45.772,lng:4.880},
  "Lyon Centre":{lat:45.764,lng:4.835},"Lyon Part-Dieu":{lat:45.760,lng:4.859},
  "Lyon Confluence":{lat:45.738,lng:4.818},"Lyon Gerland":{lat:45.731,lng:4.832},
  "Lyon Vaise":{lat:45.778,lng:4.805},
  "Ouest Lyonnais":{lat:45.755,lng:4.720},"Est Lyonnais":{lat:45.755,lng:4.960},
  "Nord Lyonnais":{lat:45.850,lng:4.840},"Sud Lyonnais":{lat:45.660,lng:4.840},
  "Plaine de l'Ain":{lat:45.935,lng:5.280},"Saint-Étienne":{lat:45.439,lng:4.387},
  "Villefranche-sur-Saône":{lat:45.990,lng:4.720},
  "Porte des Alpes":{lat:45.710,lng:4.920},"Techlid":{lat:45.805,lng:4.765},
  "Carré de Soie":{lat:45.765,lng:4.920},"Vallée de la Chimie":{lat:45.670,lng:4.850},
};

const LOCALITE_SUGGESTIONS = [
  "Albigny-sur-Saône","Bron","Cailloux-sur-Fontaines","Caluire-et-Cuire",
  "Champagne-au-Mont-d'Or","Charbonnières-les-Bains","Chassieu","Collonges-au-Mont-d'Or",
  "Corbas","Couzon-au-Mont-d'Or","Craponne","Curis-au-Mont-d'Or","Dardilly",
  "Décines-Charpieu","Écully","Feyzin","Fleurieu-sur-Saône","Fontaines-Saint-Martin",
  "Fontaines-sur-Saône","Francheville","Genay","Givors","Grigny","Irigny","Jonage",
  "La Mulatière","La Tour-de-Salvagny","Limonest","Lissieu","Lyon",
  "Lyon 1er","Lyon 2ème","Lyon 3ème","Lyon 4ème","Lyon 5ème","Lyon 6ème",
  "Lyon 7ème","Lyon 8ème","Lyon 9ème","Marcy-l'Étoile","Meyzieu","Mions",
  "Montanay","Neuville-sur-Saône","Oullins","Pierre-Bénite","Poleymieux-au-Mont-d'Or",
  "Quincieux","Rillieux-la-Pape","Rochetaillée-sur-Saône","Saint-Cyr-au-Mont-d'Or",
  "Saint-Didier-au-Mont-d'Or","Saint-Fons","Saint-Genis-Laval","Saint-Genis-les-Ollières",
  "Saint-Germain-au-Mont-d'Or","Saint-Priest","Saint-Romain-au-Mont-d'Or",
  "Sainte-Foy-lès-Lyon","Sathonay-Camp","Sathonay-Village","Solaize",
  "Tassin-la-Demi-Lune","Vaulx-en-Velin","Vénissieux","Vernaison","Villeurbanne",
  "Lyon Centre","Lyon Part-Dieu","Lyon Confluence","Lyon Gerland","Lyon Vaise",
  "Ouest Lyonnais","Est Lyonnais","Nord Lyonnais","Sud Lyonnais",
  "Carré de Soie","Porte des Alpes","Techlid","Vallée de la Chimie",
  "Plaine de l'Ain","Saint-Étienne","Villefranche-sur-Saône",
];

/* ===================== DB MAPPING ===================== */
function fromDb(row) {
  return {
    id: row.id, date: row.date || "", societe: row.societe || "",
    typeActeur: row.type_acteur || [], detention: row.detention || [],
    destination: row.destination || [], etat: row.etat || "En veille",
    localites: row.localites || [], commentaires: row.commentaires || "",
    surfaceMin: row.surface_min || "", surfaceMax: row.surface_max || "",
    contact: row.contact || "", numero: row.numero || "",
    email: row.email || "", responsable: row.responsable || "",
    notes: row.notes || [],
  };
}
function toDb(p) {
  return {
    date: p.date || null, societe: p.societe, type_acteur: p.typeActeur || [],
    detention: p.detention || [], destination: p.destination || [],
    etat: p.etat, localites: p.localites || [], commentaires: p.commentaires || "",
    surface_min: p.surfaceMin ? Number(p.surfaceMin) : null,
    surface_max: p.surfaceMax ? Number(p.surfaceMax) : null,
    contact: p.contact || "", numero: p.numero || "",
    email: p.email || "", responsable: p.responsable || "",
    notes: p.notes || [],
  };
}

/* ===================== OPTIONS ===================== */
const TAG_OPTIONS = {
  typeActeur: ["Utilisateur","Investisseur","Exploitant","Bailleur social","Collectivité","Autre"],
  detention: ["Achat","Location","Bail à construction","VEFA","Crédit-bail","CPI"],
  destination: ["Bureaux","Activité","Logistique","Commerce","Hôtel","Santé","École","Logement","Mixte","Coworking","Autre"],
  etat: ["En veille","Actif","Terminé","Abandonné"],
};
const ETAT_COLORS = {
  "En veille": { bg:"#f3e8ff", text:"#6b21a8", dot:"#a855f7", border:"#e9d5ff" },
  "Actif": { bg:"#dcfce7", text:"#166534", dot:"#22c55e", border:"#bbf7d0" },
  "Terminé": { bg:"#f1f5f9", text:"#475569", dot:"#94a3b8", border:"#e2e8f0" },
  "Abandonné": { bg:"#fee2e2", text:"#991b1b", dot:"#ef4444", border:"#fecaca" },
};
const TAG_COLORS = {
  typeActeur: { bg:"#ede9fe", text:"#5b21b6" }, detention: { bg:"#fce7f3", text:"#9d174d" },
  destination: { bg:"#e0f2fe", text:"#075985" }, localites: { bg:"#fef9c3", text:"#854d0e" },
};
const fieldStyle = { width:"100%", padding:"8px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, fontFamily:"'DM Sans', sans-serif", outline:"none", boxSizing:"border-box" };

function formatDate(d) { return d ? new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : ""; }
function formatDateTime(d) { return d ? new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""; }
function formatSurface(mn, mx) {
  const a = mn !== "" && mn != null, b = mx !== "" && mx != null;
  if (a && b && mn !== mx) return `${Number(mn).toLocaleString("fr-FR")} — ${Number(mx).toLocaleString("fr-FR")} m²`;
  if (b) return `${Number(mx).toLocaleString("fr-FR")} m²`;
  if (a) return `${Number(mn).toLocaleString("fr-FR")} m²`;
  return "—";
}

/* ===================== UI COMPONENTS ===================== */
function Tag({ label, color, onRemove, small }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:small?"1px 7px":"2px 10px", borderRadius:20, fontSize:small?10:11, fontWeight:600, background:color.bg, color:color.text, whiteSpace:"nowrap" }}>
      {label}{onRemove && <span onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ cursor:"pointer", marginLeft:2, fontWeight:700, fontSize:13, lineHeight:1 }}>×</span>}
    </span>
  );
}

function StatusBadge({ status, small }) {
  const c = ETAT_COLORS[status] || ETAT_COLORS["Actif"];
  return (<span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:small?"2px 8px 2px 6px":"3px 12px 3px 8px", borderRadius:20, background:c.bg, color:c.text, fontSize:small?10:11, fontWeight:700 }}><span style={{ width:small?5:7, height:small?5:7, borderRadius:"50%", background:c.dot }} />{status}</span>);
}

function TagInput({ value=[], options, colorKey, onChange, allowCustom }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef();
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const available = options.filter((o) => !value.includes(o));
  const fa = custom ? available.filter((o) => o.toLowerCase().includes(custom.toLowerCase())) : available;
  const addC = () => { const v = custom.trim(); if (v && !value.includes(v)) { onChange([...value, v]); setCustom(""); } };
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={() => setOpen(!open)} style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"6px 8px", border:"1.5px solid #d1d5db", borderRadius:8, minHeight:36, cursor:"pointer", background:"#fff", alignItems:"center" }}>
        {value.map((v) => <Tag key={v} label={v} color={TAG_COLORS[colorKey]||{bg:"#f1f5f9",text:"#334155"}} onRemove={() => onChange(value.filter((x)=>x!==v))} small />)}
        {value.length === 0 && <span style={{ color:"#9ca3af", fontSize:12 }}>Sélectionner...</span>}
      </div>
      {open && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:"#fff", border:"1.5px solid #d1d5db", borderRadius:8, marginTop:4, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", maxHeight:220, overflowY:"auto" }}>
          {allowCustom && (
            <div style={{ padding:"6px 8px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:4 }}>
              <input value={custom} onChange={(e)=>setCustom(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addC();}}} placeholder="Rechercher / ajouter..." style={{ flex:1, border:"1px solid #e2e8f0", borderRadius:6, padding:"5px 8px", fontSize:12, outline:"none", fontFamily:"'DM Sans', sans-serif" }} />
              <button onClick={addC} style={{ border:"none", background:"#0f172a", color:"#fff", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>+</button>
            </div>
          )}
          {fa.slice(0,30).map((opt) => <div key={opt} onClick={()=>{onChange([...value,opt]);setCustom("");}} style={{ padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:500 }} onMouseEnter={(e)=>(e.target.style.background="#f8fafc")} onMouseLeave={(e)=>(e.target.style.background="transparent")}>{opt}</div>)}
          {fa.length > 30 && <div style={{ padding:"8px 12px", fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>Tapez pour filtrer ({fa.length})...</div>}
          {fa.length === 0 && !custom && <div style={{ padding:"10px 12px", fontSize:12, color:"#94a3b8" }}>Toutes sélectionnées</div>}
        </div>
      )}
    </div>
  );
}

function MultiFilterDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const toggle = (opt) => selected.includes(opt) ? onChange(selected.filter((s)=>s!==opt)) : onChange([...selected, opt]);
  const dt = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} sélectionnés`;
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={()=>setOpen(!open)} style={{ padding:"8px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, fontFamily:"'DM Sans', sans-serif", background:"#fff", cursor:"pointer", minWidth:150, display:"flex", alignItems:"center", gap:6, color:selected.length>0?"#0f172a":"#9ca3af" }}>
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dt}</span>
        <span style={{ fontSize:10, color:"#94a3b8", transform:open?"rotate(180deg)":"none", transition:"transform 0.15s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:60, background:"#fff", border:"1.5px solid #d1d5db", borderRadius:8, marginTop:4, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", maxHeight:260, overflowY:"auto" }}>
          {selected.length > 0 && <div onClick={()=>onChange([])} style={{ padding:"8px 12px", cursor:"pointer", fontSize:11, fontWeight:700, color:"#ef4444", borderBottom:"1px solid #f1f5f9" }} onMouseEnter={(e)=>(e.target.style.background="#fef2f2")} onMouseLeave={(e)=>(e.target.style.background="transparent")}>Réinitialiser</div>}
          {options.map((opt) => { const sel = selected.includes(opt); return (
            <div key={opt} onClick={()=>toggle(opt)} style={{ padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:8, background:sel?"#f8fafc":"transparent" }} onMouseEnter={(e)=>{if(!sel)e.currentTarget.style.background="#f8fafc";}} onMouseLeave={(e)=>{if(!sel)e.currentTarget.style.background="transparent";}}>
              <span style={{ width:16, height:16, borderRadius:4, border:sel?"none":"1.5px solid #cbd5e1", background:sel?"#0f172a":"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:700, flexShrink:0 }}>{sel?"✓":""}</span>{opt}
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)" }} onClick={onCancel}>
      <div onClick={(e)=>e.stopPropagation()} style={{ background:"#fff", borderRadius:14, padding:"24px 28px", width:"90%", maxWidth:400, boxShadow:"0 25px 60px rgba(0,0,0,0.2)", animation:"modalIn 0.2s ease" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚠</div>
          <div style={{ fontSize:14, color:"#334155", lineHeight:1.5 }}>{message}</div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ padding:"8px 20px", borderRadius:8, border:"1.5px solid #d1d5db", background:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, color:"#64748b", fontFamily:"'DM Sans', sans-serif" }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"#ef4444", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans', sans-serif" }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(15,23,42,0.45)", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div onClick={(e)=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:"28px 32px", width:"95%", maxWidth:700, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 25px 60px rgba(0,0,0,0.18)", animation:"modalIn 0.25s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ border:"none", background:"#f1f5f9", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, fontWeight:700, color:"#64748b", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const isInitRef = useRef(false);
  useEffect(() => { if (editorRef.current && !isInitRef.current) { editorRef.current.innerHTML = value || ""; isInitRef.current = true; } }, []);
  const exec = (cmd) => { document.execCommand(cmd, false, null); editorRef.current?.focus(); if (onChange) onChange(editorRef.current.innerHTML); };
  const bs = { border:"1px solid #e2e8f0", background:"#fff", borderRadius:5, width:30, height:28, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:"#334155", fontFamily:"Georgia, serif" };
  return (
    <div style={{ border:"1.5px solid #d1d5db", borderRadius:8, overflow:"hidden", background:"#fff" }}>
      <div style={{ display:"flex", gap:3, padding:"5px 8px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" }}>
        <button type="button" style={bs} onClick={()=>exec("bold")}><b>G</b></button>
        <button type="button" style={bs} onClick={()=>exec("italic")}><i>I</i></button>
        <button type="button" style={bs} onClick={()=>exec("underline")}><u>S</u></button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={()=>{if(onChange)onChange(editorRef.current.innerHTML);}}
        style={{ minHeight:100, padding:"10px 12px", fontSize:13, fontFamily:"'DM Sans', sans-serif", outline:"none", lineHeight:1.6, color:"#334155", maxHeight:250, overflowY:"auto" }} />
    </div>
  );
}

function ResponsableInput({ value, onChange, allNames }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef();
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const filtered = custom ? allNames.filter((n)=>n.toLowerCase().includes(custom.toLowerCase())&&n!==value) : allNames.filter((n)=>n!==value);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <input value={value||""} onChange={(e)=>{onChange(e.target.value);setCustom(e.target.value);}} onFocus={()=>setOpen(true)} placeholder="Nom du responsable" style={fieldStyle} />
      {open && filtered.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:"#fff", border:"1.5px solid #d1d5db", borderRadius:8, marginTop:4, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", maxHeight:150, overflowY:"auto" }}>
          {filtered.map((n)=><div key={n} onClick={()=>{onChange(n);setOpen(false);setCustom("");}} style={{ padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:500 }} onMouseEnter={(e)=>(e.target.style.background="#f8fafc")} onMouseLeave={(e)=>(e.target.style.background="transparent")}>{n}</div>)}
        </div>
      )}
    </div>
  );
}

/* ===================== FORM ===================== */
function ProspectForm({ prospect, onSave, onCancel, allResponsables }) {
  const [form, setForm] = useState(prospect || { date:new Date().toISOString().split("T")[0], societe:"", typeActeur:[], detention:[], destination:[], etat:"En veille", localites:[], commentaires:"", surfaceMin:"", surfaceMax:"", contact:"", numero:"", email:"", responsable:"", notes:[] });
  const set = (k,v) => setForm((f)=>({...f,[k]:v}));
  const L = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 };
  const R2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={R2}><div><div style={L}>Société *</div><input style={fieldStyle} value={form.societe} onChange={(e)=>set("societe",e.target.value)} /></div><div><div style={L}>Date</div><input style={fieldStyle} type="date" value={form.date} onChange={(e)=>set("date",e.target.value)} /></div></div>
      <div style={R2}><div><div style={L}>Type d'acteur</div><TagInput value={form.typeActeur} options={TAG_OPTIONS.typeActeur} colorKey="typeActeur" onChange={(v)=>set("typeActeur",v)} /></div><div><div style={L}>Détention</div><TagInput value={form.detention} options={TAG_OPTIONS.detention} colorKey="detention" onChange={(v)=>set("detention",v)} /></div></div>
      <div style={R2}><div><div style={L}>Destination</div><TagInput value={form.destination} options={TAG_OPTIONS.destination} colorKey="destination" onChange={(v)=>set("destination",v)} /></div><div><div style={L}>État</div><select style={{...fieldStyle,cursor:"pointer"}} value={form.etat} onChange={(e)=>set("etat",e.target.value)}>{TAG_OPTIONS.etat.map((e)=><option key={e}>{e}</option>)}</select></div></div>
      <div><div style={L}>Localités</div><TagInput value={form.localites||[]} options={LOCALITE_SUGGESTIONS} colorKey="localites" onChange={(v)=>set("localites",v)} allowCustom /></div>
      <div style={R2}><div><div style={L}>Surface (m²)</div><div style={{ display:"flex", gap:8, alignItems:"center" }}><input style={{...fieldStyle,textAlign:"center"}} type="number" value={form.surfaceMin} onChange={(e)=>set("surfaceMin",e.target.value)} placeholder="Min" /><span style={{ color:"#94a3b8", fontWeight:700, flexShrink:0 }}>—</span><input style={{...fieldStyle,textAlign:"center"}} type="number" value={form.surfaceMax} onChange={(e)=>set("surfaceMax",e.target.value)} placeholder="Max" /></div></div><div><div style={L}>Responsable</div><ResponsableInput value={form.responsable} onChange={(v)=>set("responsable",v)} allNames={allResponsables} /></div></div>
      <div><div style={L}>Commentaires</div><RichTextEditor value={form.commentaires} onChange={(v)=>set("commentaires",v)} /></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}><div><div style={L}>Contact</div><input style={fieldStyle} value={form.contact} onChange={(e)=>set("contact",e.target.value)} /></div><div><div style={L}>Téléphone</div><input style={fieldStyle} value={form.numero} onChange={(e)=>set("numero",e.target.value)} /></div><div><div style={L}>E-mail</div><input style={fieldStyle} type="email" value={form.email} onChange={(e)=>set("email",e.target.value)} /></div></div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
        <button onClick={onCancel} style={{ padding:"10px 22px", borderRadius:10, border:"1.5px solid #d1d5db", background:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, color:"#64748b", fontFamily:"'DM Sans', sans-serif" }}>Annuler</button>
        <button onClick={()=>{if(!form.societe.trim())return;onSave(form);}} style={{ padding:"10px 28px", borderRadius:10, border:"none", background:form.societe.trim()?"#0f172a":"#94a3b8", color:"#fff", cursor:form.societe.trim()?"pointer":"default", fontWeight:700, fontSize:13, fontFamily:"'DM Sans', sans-serif" }}>{prospect?"Mettre à jour":"Ajouter"}</button>
      </div>
    </div>
  );
}

/* ===================== NOTES ===================== */
function NotesTimeline({ notes=[], onAddNote, onDeleteNote, onEditNote }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&text.trim()){onAddNote(text.trim());setText("");}}} placeholder="Ajouter une note..." style={{...fieldStyle,flex:1}} />
        <button onClick={()=>{if(text.trim()){onAddNote(text.trim());setText("");}}} style={{ border:"none", background:"#0f172a", color:"#fff", borderRadius:8, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans', sans-serif", whiteSpace:"nowrap" }}>Ajouter</button>
      </div>
      {notes.length === 0 && <div style={{ fontSize:12, color:"#94a3b8", textAlign:"center", padding:20 }}>Aucune note</div>}
      {[...notes].reverse().map((n,i) => (
        <div key={n.id} style={{ display:"flex", gap:12, paddingBottom:14 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:20, flexShrink:0 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:i===0?"#0ea5e9":"#cbd5e1", border:"2px solid #fff", zIndex:1, marginTop:3 }} />
            {i < notes.length - 1 && <div style={{ width:2, flex:1, background:"#e2e8f0", marginTop:2 }} />}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, marginBottom:2 }}>{formatDateTime(n.date)}</div>
              <div style={{ display:"flex", gap:2 }}>
                <button onClick={()=>{setEditingId(n.id);setEditText(n.text);}} style={{ border:"none", background:"transparent", cursor:"pointer", color:"#cbd5e1", fontSize:11, padding:"2px 4px", borderRadius:4, transition:"all 0.15s", lineHeight:1 }}
                  onMouseEnter={(e)=>{e.target.style.color="#64748b";e.target.style.background="#f1f5f9";}} onMouseLeave={(e)=>{e.target.style.color="#cbd5e1";e.target.style.background="transparent";}}>✎</button>
                <button onClick={()=>onDeleteNote(n.id)} style={{ border:"none", background:"transparent", cursor:"pointer", color:"#cbd5e1", fontSize:11, padding:"2px 4px", borderRadius:4, transition:"all 0.15s", lineHeight:1 }}
                  onMouseEnter={(e)=>{e.target.style.color="#ef4444";e.target.style.background="#fef2f2";}} onMouseLeave={(e)=>{e.target.style.color="#cbd5e1";e.target.style.background="transparent";}}>✕</button>
              </div>
            </div>
            {editingId === n.id ? (
              <div style={{ display:"flex", gap:6, marginTop:2 }}>
                <input value={editText} onChange={(e)=>setEditText(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&editText.trim()){onEditNote(n.id,editText.trim());setEditingId(null);}if(e.key==="Escape")setEditingId(null);}} autoFocus style={{...fieldStyle,flex:1,fontSize:12,padding:"5px 8px"}} />
                <button onClick={()=>{if(editText.trim())onEditNote(n.id,editText.trim());setEditingId(null);}} style={{ border:"none", background:"#0f172a", color:"#fff", borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>OK</button>
                <button onClick={()=>setEditingId(null)} style={{ border:"1px solid #d1d5db", background:"#fff", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", color:"#64748b" }}>✕</button>
              </div>
            ) : (<div style={{ fontSize:13, color:"#334155", lineHeight:1.5 }}>{n.text}</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================== DETAIL PANEL ===================== */
function DetailPanel({ prospect, onClose, onEdit, onUpdate }) {
  if (!prospect) return null;
  const S = { fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:3, marginTop:14 };
  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:460, maxWidth:"95vw", background:"#fff", boxShadow:"-8px 0 40px rgba(0,0,0,0.1)", zIndex:90, display:"flex", flexDirection:"column", animation:"slideIn 0.25s ease" }}>
      <div style={{ padding:"24px 26px 0", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", marginBottom:6 }}>
          <div><h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#0f172a" }}>{prospect.societe}</h2><div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{formatDate(prospect.date)}</div></div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>onEdit(prospect)} style={{ border:"1.5px solid #e2e8f0", background:"#f8fafc", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:700, color:"#334155", fontFamily:"'DM Sans', sans-serif" }}>Modifier</button>
            <button onClick={onClose} style={{ border:"none", background:"#f1f5f9", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, fontWeight:700, color:"#64748b", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
          <StatusBadge status={prospect.etat} />
          {prospect.responsable && <span style={{ fontSize:11, fontWeight:700, color:"#475569", background:"#f1f5f9", padding:"3px 10px", borderRadius:20 }}>👤 {prospect.responsable}</span>}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 26px 26px" }}>
        {[{label:"Type d'acteur",items:prospect.typeActeur,ck:"typeActeur"},{label:"Détention",items:prospect.detention,ck:"detention"},{label:"Destination",items:prospect.destination,ck:"destination"},{label:"Localités",items:prospect.localites,ck:"localites"}].map((sec)=>(
          <div key={sec.label}><div style={S}>{sec.label}</div><div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{sec.items?.length ? sec.items.map((t)=><Tag key={t} label={t} color={TAG_COLORS[sec.ck]} />) : <span style={{ fontSize:12, color:"#cbd5e1" }}>—</span>}</div></div>
        ))}
        <div style={S}>Surface</div><div style={{ fontSize:13, color:"#334155" }}>{formatSurface(prospect.surfaceMin, prospect.surfaceMax)}</div>
        <div style={S}>Commentaires</div><div dangerouslySetInnerHTML={{ __html:prospect.commentaires||"<span style='color:#cbd5e1'>—</span>" }} style={{ fontSize:13, color:"#334155", lineHeight:1.6, background:"#f8fafc", padding:14, borderRadius:10 }} />
        <div style={{ marginTop:16, padding:"14px 0", borderTop:"1px solid #e2e8f0" }}><div style={S}>Contact</div><div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{prospect.contact||"—"}</div>{prospect.numero&&<div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{prospect.numero}</div>}{prospect.email&&<div style={{ fontSize:12, color:"#0369a1", marginTop:2 }}>{prospect.email}</div>}</div>
        <div style={{ marginTop:8, paddingTop:16, borderTop:"1px solid #e2e8f0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}><span style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>Historique & Notes</span><span style={{ fontSize:10, fontWeight:700, color:"#94a3b8", background:"#f1f5f9", padding:"2px 8px", borderRadius:10 }}>{prospect.notes?.length||0}</span></div>
          <NotesTimeline notes={prospect.notes||[]}
            onAddNote={(t)=>onUpdate({...prospect, notes:[...(prospect.notes||[]),{id:Date.now(),text:t,date:new Date().toISOString()}]})}
            onDeleteNote={(id)=>onUpdate({...prospect, notes:(prospect.notes||[]).filter((n)=>n.id!==id)})}
            onEditNote={(id,t)=>onUpdate({...prospect, notes:(prospect.notes||[]).map((n)=>n.id===id?{...n,text:t}:n)})}
          />
        </div>
      </div>
    </div>
  );
}

/* ===================== KANBAN ===================== */
function KanbanView({ data, onSelect, onChangeEtat }) {
  return (
    <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:8, minHeight:400 }}>
      {TAG_OPTIONS.etat.map((etat) => {
        const c = ETAT_COLORS[etat]; const items = data.filter((p)=>p.etat===etat);
        return (
          <div key={etat} onDragOver={(e)=>{e.preventDefault();e.currentTarget.style.background=c.bg;}} onDragLeave={(e)=>{e.currentTarget.style.background="#f8fafc";}} onDrop={(e)=>{e.currentTarget.style.background="#f8fafc";const id=parseInt(e.dataTransfer.getData("text/plain"));if(id)onChangeEtat(id,etat);}}
            style={{ flex:"1 1 0", minWidth:220, background:"#f8fafc", borderRadius:12, padding:10, display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, padding:"6px 8px", borderBottom:`2px solid ${c.border}` }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:c.dot }} /><span style={{ fontSize:12, fontWeight:800, color:c.text, flex:1 }}>{etat}</span>
              <span style={{ fontSize:10, fontWeight:700, color:c.text, background:c.bg, padding:"2px 8px", borderRadius:10 }}>{items.length}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1, overflowY:"auto" }}>
              {items.map((p)=>(
                <div key={p.id} draggable onDragStart={(e)=>e.dataTransfer.setData("text/plain",p.id.toString())} onClick={()=>onSelect(p)}
                  style={{ background:"#fff", borderRadius:10, padding:"12px 14px", border:"1px solid #e2e8f0", cursor:"grab", boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"all 0.15s" }}
                  onMouseEnter={(e)=>{e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={(e)=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";e.currentTarget.style.transform="none";}}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:4 }}>{p.societe}</div>
                  {p.responsable&&<div style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>👤 {p.responsable}</div>}
                  <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:4 }}>{p.destination?.map((t)=><Tag key={t} label={t} color={TAG_COLORS.destination} small />)}</div>
                  {p.localites?.length>0&&<div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:4 }}>{p.localites.map((l)=><Tag key={l} label={l} color={TAG_COLORS.localites} small />)}</div>}
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{formatSurface(p.surfaceMin,p.surfaceMax)}</div>
                </div>
              ))}
              {items.length===0&&<div style={{ fontSize:11, color:"#cbd5e1", textAlign:"center", padding:"30px 10px" }}>Glissez ici</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== LEAFLET MAP ===================== */
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30], maxZoom: 13 });
    }
  }, [positions, map]);
  return null;
}

function MapView({ data }) {
  const grouped = useMemo(() => {
    const map = {};
    data.forEach((p) => {
      (p.localites || []).forEach((loc) => {
        const coords = LOCALITE_COORDS[loc];
        if (!coords) return;
        const key = `${coords.lat.toFixed(3)}-${coords.lng.toFixed(3)}`;
        if (!map[key]) map[key] = { lat: coords.lat, lng: coords.lng, prospects: [p], localites: [loc] };
        else {
          if (!map[key].prospects.find((x) => x.id === p.id)) map[key].prospects.push(p);
          if (!map[key].localites.includes(loc)) map[key].localites.push(loc);
        }
      });
    });
    return Object.values(map);
  }, [data]);

  const positions = grouped.map((g) => [g.lat, g.lng]);

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <MapContainer center={[45.764, 4.835]} zoom={11} style={{ width: "100%", height: 500 }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds positions={positions} />
        {grouped.map((g, i) => {
          const count = g.prospects.length;
          const radius = Math.min(7 + count * 3, 20);
          return (
            <CircleMarker key={i} center={[g.lat, g.lng]} radius={radius}
              pathOptions={{ fillColor: "#334155", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.85 }}>
              <Tooltip sticky direction="top" offset={[0, -radius]}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 180 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{g.localites.join(", ")}</div>
                  {g.prospects.map((p) => (
                    <div key={p.id} style={{ padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.societe}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{(p.destination || []).join(", ")} · {formatSurface(p.surfaceMin, p.surfaceMax)}</div>
                    </div>
                  ))}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/* ===================== MAIN APP ===================== */
function MainApp() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterEtats, setFilterEtats] = useState([]);
  const [filterDests, setFilterDests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    const { data: rows, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
    if (!error && rows) setData(rows.map(fromDb));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const channel = supabase.channel("prospects-changes").on("postgres_changes", { event: "*", schema: "public", table: "prospects" }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const allResponsables = useMemo(() => [...new Set(data.map((p) => p.responsable).filter(Boolean))], [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) { const s = search.toLowerCase(); list = list.filter((p) => [p.societe,p.contact,p.commentaires,p.responsable,...(p.typeActeur||[]),...(p.detention||[]),...(p.destination||[]),...(p.localites||[])].some((f) => f && f.toLowerCase().includes(s))); }
    if (filterEtats.length > 0) list = list.filter((p) => filterEtats.includes(p.etat));
    if (filterDests.length > 0) list = list.filter((p) => p.destination?.some((d) => filterDests.includes(d)));
    list.sort((a, b) => { let va = a[sortField], vb = b[sortField]; if (sortField === "surfaceMax") { va = Number(va)||0; vb = Number(vb)||0; } if (sortField === "date") { va = va||""; vb = vb||""; } if (typeof va === "string") { va = va.toLowerCase(); vb = (vb||"").toLowerCase(); } return va < vb ? (sortDir==="asc"?-1:1) : va > vb ? (sortDir==="asc"?1:-1) : 0; });
    return list;
  }, [data, search, filterEtats, filterDests, sortField, sortDir]);

  const handleExport = () => {
    const rows = filtered.map((p) => ({
      "Date": formatDate(p.date), "Société": p.societe, "Responsable": p.responsable || "",
      "Type d'acteur": (p.typeActeur||[]).join(", "), "Détention": (p.detention||[]).join(", "),
      "Destination": (p.destination||[]).join(", "), "État": p.etat,
      "Localités": (p.localites||[]).join(", "),
      "Surface min (m²)": p.surfaceMin || "", "Surface max (m²)": p.surfaceMax || "",
      "Contact": p.contact || "", "Téléphone": p.numero || "", "E-mail": p.email || "",
      "Commentaires": (p.commentaires||"").replace(/<[^>]*>/g, ""),
      "Nb notes": (p.notes||[]).length,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [12,25,15,22,20,22,12,30,14,14,20,16,28,50,8].map((w)=>({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prospects");
    XLSX.writeFile(wb, `Prospects_VI_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleSave = async (form) => {
    if (editing) {
      const dbData = toDb(form);
      const { error } = await supabase.from("prospects").update(dbData).eq("id", editing.id);
      if (!error) { const u = { ...form, id:editing.id, notes:editing.notes||[] }; setData(data.map((p)=>p.id===editing.id?u:p)); setDetail(u); }
    } else {
      const dbData = toDb(form);
      const { data: rows, error } = await supabase.from("prospects").insert(dbData).select();
      if (!error && rows?.[0]) setData([fromDb(rows[0]), ...data]);
    }
    setModalOpen(false); setEditing(null);
  };
  const handleUpdate = useCallback(async (updated) => {
    const dbData = toDb(updated);
    const { error } = await supabase.from("prospects").update(dbData).eq("id", updated.id);
    if (!error) { setData((prev)=>prev.map((p)=>p.id===updated.id?updated:p)); setDetail(updated); }
  }, []);
  const handleDelete = async (id) => {
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (!error) { setData(data.filter((p)=>p.id!==id)); setDetail(null); }
    setConfirmDelete(null);
  };
  const handleSort = (field) => { if (sortField===field) setSortDir(sortDir==="asc"?"desc":"asc"); else { setSortField(field); setSortDir("asc"); } };
  const handleChangeEtat = async (id, ne) => {
    const { error } = await supabase.from("prospects").update({ etat: ne }).eq("id", id);
    if (!error) setData((prev)=>prev.map((p)=>p.id===id?{...p,etat:ne}:p));
  };
  const SortIcon = ({ field }) => <span style={{ marginLeft:3, opacity:sortField===field?1:0.3, fontSize:10 }}>{sortField===field?(sortDir==="asc"?"▲":"▼"):"▲"}</span>;
  const stats = useMemo(() => ({ total:data.length, enVeille:data.filter((p)=>p.etat==="En veille").length, actif:data.filter((p)=>p.etat==="Actif").length, termine:data.filter((p)=>p.etat==="Terminé").length, abandonne:data.filter((p)=>p.etat==="Abandonné").length }), [data]);

  if (loading) return (<div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"'DM Sans', sans-serif", color:"#94a3b8" }}><div style={{ textAlign:"center" }}><div style={{ fontSize:24, marginBottom:8 }}>⏳</div><div style={{ fontSize:14, fontWeight:600 }}>Chargement...</div></div></div>);

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; } ::-webkit-scrollbar { width:6px; height:6px; } ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
        input:focus, select:focus { border-color:#0f172a !important; } tr:hover td { background:#f1f5f9 !important; }
        .leaflet-tooltip { border-radius:10px !important; padding:12px 16px !important; box-shadow:0 8px 30px rgba(0,0,0,0.12) !important; border:1px solid #e2e8f0 !important; }
      `}</style>

      <div style={{ background:"#0f172a", padding:"22px 32px", color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", maxWidth:1500, margin:"0 auto" }}>
          <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#64748b", marginBottom:2 }}>VINCI IMMOBILIER</div><h1 style={{ margin:0, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Prospects & Recherches</h1></div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ display:"flex", background:"rgba(255,255,255,0.1)", borderRadius:8, padding:3 }}>
              {[{key:"table",icon:"☰",label:"Tableau"},{key:"kanban",icon:"◫",label:"Kanban"},{key:"map",icon:"◎",label:"Carte"}].map((v) => (
                <button key={v.key} onClick={()=>setView(v.key)} style={{ border:"none", borderRadius:6, padding:"6px 14px", background:view===v.key?"rgba(255,255,255,0.2)":"transparent", color:view===v.key?"#fff":"#94a3b8", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans', sans-serif", display:"flex", alignItems:"center", gap:5 }}><span style={{ fontSize:14 }}>{v.icon}</span>{v.label}</button>
              ))}
            </div>
            <button onClick={()=>{setEditing(null);setModalOpen(true);}} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"#fff", color:"#0f172a", cursor:"pointer", fontWeight:800, fontSize:13, fontFamily:"'DM Sans', sans-serif", display:"flex", alignItems:"center", gap:6 }}
              onMouseEnter={(e)=>(e.currentTarget.style.background="#e2e8f0")} onMouseLeave={(e)=>(e.currentTarget.style.background="#fff")}><span style={{ fontSize:18, lineHeight:1 }}>+</span> Nouveau prospect</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1500, margin:"0 auto", padding:"20px 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:14, marginBottom:20 }}>
          {[{label:"Total prospects",val:stats.total,color:"#0f172a"},{label:"En veille",val:stats.enVeille,color:"#a855f7"},{label:"Actif",val:stats.actif,color:"#22c55e"},{label:"Terminé",val:stats.termine,color:"#94a3b8"},{label:"Abandonné",val:stats.abandonne,color:"#ef4444"}].map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:"1px solid #e2e8f0", animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5 }}>{s.label}</div>
              <div style={{ fontSize:28, fontWeight:800, color:s.color, marginTop:2 }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:14 }}>🔍</span>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Rechercher..." style={{...fieldStyle,paddingLeft:36,background:"#fff",border:"1.5px solid #e2e8f0"}} />
          </div>
          <MultiFilterDropdown label="Filtrer par état" options={TAG_OPTIONS.etat} selected={filterEtats} onChange={setFilterEtats} />
          <MultiFilterDropdown label="Filtrer par destination" options={TAG_OPTIONS.destination} selected={filterDests} onChange={setFilterDests} />
          <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>{filtered.length} résultat{filtered.length!==1?"s":""}</div>
          <button onClick={handleExport} style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #d1d5db", background:"#fff", cursor:"pointer", fontWeight:700, fontSize:12, color:"#334155", fontFamily:"'DM Sans', sans-serif", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}
            onMouseEnter={(e)=>(e.currentTarget.style.background="#f1f5f9")} onMouseLeave={(e)=>(e.currentTarget.style.background="#fff")}>📥 Export Excel</button>
        </div>

        {view === "kanban" ? <KanbanView data={filtered} onSelect={setDetail} onChangeEtat={handleChangeEtat} />
          : view === "map" ? <MapView data={filtered} />
          : (
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"#f8fafc" }}>
                  {[{key:"date",label:"Date",w:95},{key:"societe",label:"Société",w:155},{key:"responsable",label:"Resp.",w:80},{key:"typeActeur",label:"Type",w:110},{key:"detention",label:"Détention",w:110},{key:"destination",label:"Destination",w:125},{key:"etat",label:"État",w:100},{key:"localites",label:"Localités",w:160},{key:"surfaceMax",label:"Surface",w:120},{key:"contact",label:"Contact",w:120}].map((col)=>(
                    <th key={col.key} onClick={()=>handleSort(col.key)} style={{ padding:"12px 10px", textAlign:"left", fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:0.6, color:"#64748b", borderBottom:"1.5px solid #e2e8f0", cursor:"pointer", whiteSpace:"nowrap", minWidth:col.w, userSelect:"none" }}>{col.label}<SortIcon field={col.key} /></th>
                  ))}<th style={{ padding:"12px 8px", borderBottom:"1.5px solid #e2e8f0", width:36 }} />
                </tr></thead>
                <tbody>
                  {filtered.map((p,i)=>(
                    <tr key={p.id} style={{ cursor:"pointer", animation:`fadeUp 0.2s ease ${i*0.02}s both` }} onClick={()=>setDetail(p)}>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9", color:"#64748b", fontSize:11 }}>{formatDate(p.date)}</td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9", fontWeight:700 }}><div style={{ display:"flex", alignItems:"center", gap:5 }}>{p.societe}{p.notes?.length>0&&<span style={{ fontSize:9, color:"#94a3b8" }}>({p.notes.length})</span>}</div></td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9", fontSize:12, color:"#475569" }}>{p.responsable||"—"}</td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9" }}><div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>{p.typeActeur?.map((t)=><Tag key={t} label={t} color={TAG_COLORS.typeActeur} small />)}</div></td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9" }}><div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>{p.detention?.map((t)=><Tag key={t} label={t} color={TAG_COLORS.detention} small />)}</div></td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9" }}><div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>{p.destination?.map((t)=><Tag key={t} label={t} color={TAG_COLORS.destination} small />)}</div></td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9" }}><StatusBadge status={p.etat} small /></td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9" }}><div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>{p.localites?.map((l)=><Tag key={l} label={l} color={TAG_COLORS.localites} small />)}</div></td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9", textAlign:"right", fontWeight:600, fontVariantNumeric:"tabular-nums", fontSize:11 }}>{formatSurface(p.surfaceMin,p.surfaceMax)}</td>
                      <td style={{ padding:"10px", borderBottom:"1px solid #f1f5f9", fontSize:11 }}><div style={{ fontWeight:600 }}>{p.contact}</div>{p.numero&&<div style={{ color:"#94a3b8", fontSize:10 }}>{p.numero}</div>}</td>
                      <td style={{ padding:"10px 8px", borderBottom:"1px solid #f1f5f9" }} onClick={(e)=>e.stopPropagation()}>
                        <button onClick={()=>setConfirmDelete(p)} style={{ border:"none", background:"transparent", cursor:"pointer", color:"#cbd5e1", fontSize:14, padding:4, borderRadius:6 }}
                          onMouseEnter={(e)=>{e.target.style.color="#ef4444";e.target.style.background="#fef2f2";}}
                          onMouseLeave={(e)=>{e.target.style.color="#cbd5e1";e.target.style.background="transparent";}}>🗑</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length===0&&<tr><td colSpan={11} style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>Aucun prospect trouvé</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} title={editing?"Modifier le prospect":"Nouveau prospect"}>
        <ProspectForm prospect={editing} onSave={handleSave} onCancel={()=>{setModalOpen(false);setEditing(null);}} allResponsables={allResponsables} />
      </Modal>
      {detail && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:80, background:"rgba(0,0,0,0.1)" }} onClick={()=>setDetail(null)} />
          <DetailPanel prospect={detail} onClose={()=>setDetail(null)} onEdit={(p)=>{setEditing(p);setModalOpen(true);setDetail(null);}} onUpdate={handleUpdate} />
        </>
      )}
      <ConfirmDialog open={!!confirmDelete} message={confirmDelete?`Supprimer "${confirmDelete.societe}" ?`:""} onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />
    </div>
  );
}

/* ===================== ROOT ===================== */
export default function App() {
  const [authed, setAuthed] = useState(sessionStorage.getItem("prospects-auth") === "ok");
  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;
  return <MainApp />;
}
