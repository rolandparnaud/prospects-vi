import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./supabase";

/* ===================== DB MAPPING ===================== */
function fromDb(row) {
  return {
    id: row.id,
    date: row.date || "",
    societe: row.societe || "",
    typeActeur: row.type_acteur || [],
    detention: row.detention || [],
    destination: row.destination || [],
    etat: row.etat || "En veille",
    localites: row.localites || [],
    commentaires: row.commentaires || "",
    surface: row.surface || "",
    contact: row.contact || "",
    numero: row.numero || "",
    email: row.email || "",
    responsable: row.responsable || "",
    notes: row.notes || [],
  };
}

function toDb(p) {
  return {
    date: p.date || null,
    societe: p.societe,
    type_acteur: p.typeActeur || [],
    detention: p.detention || [],
    destination: p.destination || [],
    etat: p.etat,
    localites: p.localites || [],
    commentaires: p.commentaires || "",
    surface: p.surface ? Number(p.surface) : null,
    contact: p.contact || "",
    numero: p.numero || "",
    email: p.email || "",
    responsable: p.responsable || "",
    notes: p.notes || [],
  };
}

/* ===================== OPTIONS ===================== */
const TAG_OPTIONS = {
  typeActeur: ["Utilisateur", "Investisseur", "Exploitant", "Bailleur social", "Collectivité", "Autre"],
  detention: ["Achat", "Location", "Bail à construction", "VEFA", "Crédit-bail", "CPI"],
  destination: ["Bureaux", "Activité", "Logistique", "Commerce", "Hôtel", "Santé", "École", "Logement", "Mixte", "Coworking", "Autre"],
  etat: ["En veille", "Actif", "Terminé", "Abandonné"],
};

const LOCALITE_SUGGESTIONS = [
  "Lyon Centre", "Lyon Part-Dieu", "Lyon Confluence", "Lyon Gerland", "Lyon Vaise",
  "Villeurbanne", "Vaulx-en-Velin", "Bron", "Vénissieux", "Saint-Priest",
  "Oullins", "Saint-Genis-Laval", "Tassin", "Écully", "Dardilly",
  "Limonest", "Caluire", "Rillieux", "Meyzieu", "Décines",
  "Ouest Lyonnais", "Est Lyonnais", "Nord Lyonnais", "Sud Lyonnais",
  "Plaine de l'Ain", "Saint-Étienne", "Villefranche-sur-Saône",
];

const ETAT_COLORS = {
  "En veille": { bg: "#f3e8ff", text: "#6b21a8", dot: "#a855f7", border: "#e9d5ff" },
  "Actif": { bg: "#dcfce7", text: "#166534", dot: "#22c55e", border: "#bbf7d0" },
  "Terminé": { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", border: "#e2e8f0" },
  "Abandonné": { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", border: "#fecaca" },
};

const TAG_COLORS = {
  typeActeur: { bg: "#ede9fe", text: "#5b21b6" },
  detention: { bg: "#fce7f3", text: "#9d174d" },
  destination: { bg: "#e0f2fe", text: "#075985" },
  localites: { bg: "#fef9c3", text: "#854d0e" },
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ===================== RICH TEXT EDITOR ===================== */
function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const isInitRef = useRef(false);
  useEffect(() => {
    if (editorRef.current && !isInitRef.current) {
      editorRef.current.innerHTML = value || "";
      isInitRef.current = true;
    }
  }, []);
  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    if (onChange) onChange(editorRef.current.innerHTML);
  };
  const btnStyle = () => ({
    border: "1px solid #e2e8f0", background: "#fff",
    borderRadius: 5, width: 30, height: 28, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 600, color: "#334155", transition: "all 0.1s",
    fontFamily: "Georgia, serif",
  });
  return (
    <div style={{ border: "1.5px solid #d1d5db", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", gap: 3, padding: "5px 8px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <button type="button" style={btnStyle()} onClick={() => exec("bold")} title="Gras"
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}><b>G</b></button>
        <button type="button" style={btnStyle()} onClick={() => exec("italic")} title="Italique"
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}><i>I</i></button>
        <button type="button" style={btnStyle()} onClick={() => exec("underline")} title="Souligné"
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}><u>S</u></button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => { if (onChange) onChange(editorRef.current.innerHTML); }}
        style={{ minHeight: 100, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", lineHeight: 1.6, color: "#334155", maxHeight: 250, overflowY: "auto" }} />
    </div>
  );
}

/* ===================== COMPONENTS ===================== */
function Tag({ label, color, onRemove, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: small ? "1px 7px" : "2px 10px", borderRadius: 20,
      fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: 0.2,
      background: color.bg, color: color.text, whiteSpace: "nowrap",
    }}>
      {label}
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ cursor: "pointer", marginLeft: 2, fontWeight: 700, fontSize: 13, lineHeight: 1 }}>×</span>
      )}
    </span>
  );
}

function TagInput({ value = [], options, colorKey, onChange, allowCustom }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const available = options.filter((o) => !value.includes(o));
  const filteredAvailable = custom ? available.filter((o) => o.toLowerCase().includes(custom.toLowerCase())) : available;
  const handleAddCustom = () => {
    const v = custom.trim();
    if (v && !value.includes(v)) { onChange([...value, v]); setCustom(""); }
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 8px",
        border: "1.5px solid #d1d5db", borderRadius: 8, minHeight: 36, cursor: "pointer",
        background: "#fff", alignItems: "center",
      }}>
        {value.map((v) => (
          <Tag key={v} label={v} color={TAG_COLORS[colorKey] || { bg: "#f1f5f9", text: "#334155" }}
            onRemove={() => onChange(value.filter((x) => x !== v))} small />
        ))}
        {value.length === 0 && <span style={{ color: "#9ca3af", fontSize: 12 }}>Sélectionner...</span>}
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 8,
          marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
        }}>
          {allowCustom && (
            <div style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 4 }}>
              <input value={custom} onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
                placeholder="Ajouter..."
                style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={handleAddCustom} style={{
                border: "none", background: "#0f172a", color: "#fff", borderRadius: 6,
                padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>+</button>
            </div>
          )}
          {filteredAvailable.map((opt) => (
            <div key={opt} onClick={() => { onChange([...value, opt]); setCustom(""); }}
              style={{ padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.target.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >{opt}</div>
          ))}
          {filteredAvailable.length === 0 && !custom && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>Toutes les options sont sélectionnées</div>
          )}
        </div>
      )}
    </div>
  );
}

function MultiFilterDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };
  const displayText = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} sélectionnés`;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: 8,
        fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#fff",
        cursor: "pointer", minWidth: 150, display: "flex", alignItems: "center", gap: 6,
        color: selected.length > 0 ? "#0f172a" : "#9ca3af", userSelect: "none",
      }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayText}</span>
        <span style={{ fontSize: 10, color: "#94a3b8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60,
          background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 8,
          marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 260, overflowY: "auto",
        }}>
          {selected.length > 0 && (
            <div onClick={() => onChange([])}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#ef4444", borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.target.style.background = "#fef2f2")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >Réinitialiser les filtres</div>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <div key={opt} onClick={() => toggle(opt)}
                style={{
                  padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 8, transition: "background 0.15s",
                  background: isSelected ? "#f8fafc" : "transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: isSelected ? "none" : "1.5px solid #cbd5e1",
                  background: isSelected ? "#0f172a" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff", fontWeight: 700,
                }}>{isSelected ? "✓" : ""}</span>
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, small }) {
  const c = ETAT_COLORS[status] || ETAT_COLORS["Actif"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "2px 8px 2px 6px" : "3px 12px 3px 8px",
      borderRadius: 20, background: c.bg, color: c.text,
      fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: 0.3,
    }}>
      <span style={{ width: small ? 5 : 7, height: small ? 5 : 7, borderRadius: "50%", background: c.dot }} />
      {status}
    </span>
  );
}

function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, padding: "24px 28px", width: "90%", maxWidth: 400,
        boxShadow: "0 25px 60px rgba(0,0,0,0.2)", animation: "modalIn 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
          }}>⚠</div>
          <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{message}</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "8px 20px", borderRadius: 8, border: "1.5px solid #d1d5db",
            background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#64748b", fontFamily: "'DM Sans', sans-serif",
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#ef4444", color: "#fff", cursor: "pointer",
            fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        width: "95%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 25px 60px rgba(0,0,0,0.18)", animation: "modalIn 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
          <button onClick={onClose} style={{
            border: "none", background: "#f1f5f9", borderRadius: 8, width: 32, height: 32,
            cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldStyle = {
  width: "100%", padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: 8,
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function ResponsableInput({ value, onChange, allNames }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = custom
    ? allNames.filter((n) => n.toLowerCase().includes(custom.toLowerCase()) && n !== value)
    : allNames.filter((n) => n !== value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={value || ""} onChange={(e) => { onChange(e.target.value); setCustom(e.target.value); }}
        onFocus={() => setOpen(true)} placeholder="Nom du responsable" style={fieldStyle} />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 8,
          marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 150, overflowY: "auto",
        }}>
          {filtered.map((n) => (
            <div key={n} onClick={() => { onChange(n); setOpen(false); setCustom(""); }}
              style={{ padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.target.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProspectForm({ prospect, onSave, onCancel, allResponsables }) {
  const [form, setForm] = useState(prospect || {
    date: new Date().toISOString().split("T")[0],
    societe: "", typeActeur: [], detention: [], destination: [],
    etat: "En veille", localites: [], commentaires: "", surface: "",
    contact: "", numero: "", email: "", responsable: "", notes: [],
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const L = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };
  const R2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={R2}>
        <div><div style={L}>Société *</div><input style={fieldStyle} value={form.societe} onChange={(e) => set("societe", e.target.value)} placeholder="Nom de la société" /></div>
        <div><div style={L}>Date</div><input style={fieldStyle} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
      </div>
      <div style={R2}>
        <div><div style={L}>Type d'acteur</div><TagInput value={form.typeActeur} options={TAG_OPTIONS.typeActeur} colorKey="typeActeur" onChange={(v) => set("typeActeur", v)} /></div>
        <div><div style={L}>Détention</div><TagInput value={form.detention} options={TAG_OPTIONS.detention} colorKey="detention" onChange={(v) => set("detention", v)} /></div>
      </div>
      <div style={R2}>
        <div><div style={L}>Destination</div><TagInput value={form.destination} options={TAG_OPTIONS.destination} colorKey="destination" onChange={(v) => set("destination", v)} /></div>
        <div><div style={L}>État</div>
          <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.etat} onChange={(e) => set("etat", e.target.value)}>
            {TAG_OPTIONS.etat.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>
      <div>
        <div style={L}>Localités</div>
        <TagInput value={form.localites || []} options={LOCALITE_SUGGESTIONS} colorKey="localites" onChange={(v) => set("localites", v)} allowCustom />
      </div>
      <div style={R2}>
        <div><div style={L}>Surface (m²)</div><input style={fieldStyle} type="number" value={form.surface} onChange={(e) => set("surface", e.target.value)} placeholder="m²" /></div>
        <div><div style={L}>Responsable</div><ResponsableInput value={form.responsable} onChange={(v) => set("responsable", v)} allNames={allResponsables} /></div>
      </div>
      <div>
        <div style={L}>Commentaires</div>
        <RichTextEditor value={form.commentaires} onChange={(v) => set("commentaires", v)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div><div style={L}>Contact</div><input style={fieldStyle} value={form.contact} onChange={(e) => set("contact", e.target.value)} /></div>
        <div><div style={L}>Téléphone</div><input style={fieldStyle} value={form.numero} onChange={(e) => set("numero", e.target.value)} /></div>
        <div><div style={L}>E-mail</div><input style={fieldStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onCancel} style={{
          padding: "10px 22px", borderRadius: 10, border: "1.5px solid #d1d5db",
          background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#64748b", fontFamily: "'DM Sans', sans-serif",
        }}>Annuler</button>
        <button onClick={() => { if (!form.societe.trim()) return; onSave(form); }} style={{
          padding: "10px 28px", borderRadius: 10, border: "none",
          background: form.societe.trim() ? "#0f172a" : "#94a3b8",
          color: "#fff", cursor: form.societe.trim() ? "pointer" : "default",
          fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        }}>{prospect ? "Mettre à jour" : "Ajouter"}</button>
      </div>
    </div>
  );
}

function NotesTimeline({ notes = [], onAddNote, onDeleteNote }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onAddNote(text.trim()); setText(""); } }}
          placeholder="Ajouter une note..." style={{ ...fieldStyle, flex: 1 }} />
        <button onClick={() => { if (text.trim()) { onAddNote(text.trim()); setText(""); } }} style={{
          border: "none", background: "#0f172a", color: "#fff", borderRadius: 8,
          padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
        }}>Ajouter</button>
      </div>
      {notes.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: 20 }}>Aucune note pour l'instant</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {[...notes].reverse().map((n, i) => (
          <div key={n.id} style={{ display: "flex", gap: 12, paddingBottom: 14, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#0ea5e9" : "#cbd5e1", border: "2px solid #fff", zIndex: 1, marginTop: 3 }} />
              {i < notes.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginTop: 2 }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{formatDateTime(n.date)}</div>
                <button onClick={() => onDeleteNote(n.id)} style={{
                  border: "none", background: "transparent", cursor: "pointer",
                  color: "#cbd5e1", fontSize: 13, padding: "2px 4px", borderRadius: 4, transition: "all 0.15s", lineHeight: 1,
                }}
                  onMouseEnter={(e) => { e.target.style.color = "#ef4444"; e.target.style.background = "#fef2f2"; }}
                  onMouseLeave={(e) => { e.target.style.color = "#cbd5e1"; e.target.style.background = "transparent"; }}
                  title="Supprimer cette note"
                >🗑</button>
              </div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{n.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ prospect, onClose, onEdit, onUpdate }) {
  if (!prospect) return null;
  const S = { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3, marginTop: 14 };
  const handleAddNote = (text) => {
    const newNote = { id: Date.now(), text, date: new Date().toISOString() };
    onUpdate({ ...prospect, notes: [...(prospect.notes || []), newNote] });
  };
  const handleDeleteNote = (noteId) => {
    onUpdate({ ...prospect, notes: (prospect.notes || []).filter((n) => n.id !== noteId) });
  };
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "95vw",
      background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.1)", zIndex: 90,
      display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease",
    }}>
      <div style={{ padding: "24px 26px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{prospect.societe}</h2>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{formatDate(prospect.date)}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(prospect)} style={{
              border: "1.5px solid #e2e8f0", background: "#f8fafc", borderRadius: 8,
              padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#334155", fontFamily: "'DM Sans', sans-serif",
            }}>Modifier</button>
            <button onClick={onClose} style={{
              border: "none", background: "#f1f5f9", borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <StatusBadge status={prospect.etat} />
          {prospect.responsable && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "3px 10px", borderRadius: 20 }}>
              👤 {prospect.responsable}
            </span>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 26px 26px" }}>
        <div style={S}>Type d'acteur</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {prospect.typeActeur?.length ? prospect.typeActeur.map((t) => <Tag key={t} label={t} color={TAG_COLORS.typeActeur} />) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>}
        </div>
        <div style={S}>Détention</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {prospect.detention?.length ? prospect.detention.map((t) => <Tag key={t} label={t} color={TAG_COLORS.detention} />) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>}
        </div>
        <div style={S}>Destination</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {prospect.destination?.length ? prospect.destination.map((t) => <Tag key={t} label={t} color={TAG_COLORS.destination} />) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>}
        </div>
        <div style={S}>Localités</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {prospect.localites?.length ? prospect.localites.map((t) => <Tag key={t} label={t} color={TAG_COLORS.localites} />) : <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>}
        </div>
        <div style={S}>Surface</div>
        <div style={{ fontSize: 13, color: "#334155" }}>{prospect.surface ? `${Number(prospect.surface).toLocaleString("fr-FR")} m²` : "—"}</div>
        <div style={S}>Commentaires</div>
        <div dangerouslySetInnerHTML={{ __html: prospect.commentaires || "<span style='color:#cbd5e1'>—</span>" }}
          style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, background: "#f8fafc", padding: 14, borderRadius: 10, overflowWrap: "break-word" }} />
        <div style={{ marginTop: 16, padding: "14px 0", borderTop: "1px solid #e2e8f0" }}>
          <div style={S}>Contact</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{prospect.contact || "—"}</div>
          {prospect.numero && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{prospect.numero}</div>}
          {prospect.email && <div style={{ fontSize: 12, color: "#0369a1", marginTop: 2 }}>{prospect.email}</div>}
        </div>
        <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Historique & Notes</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: 10 }}>
              {prospect.notes?.length || 0}
            </span>
          </div>
          <NotesTimeline notes={prospect.notes || []} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />
        </div>
      </div>
    </div>
  );
}

function KanbanView({ data, onSelect, onChangeEtat }) {
  const columns = TAG_OPTIONS.etat;
  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, minHeight: 400 }}>
      {columns.map((etat) => {
        const c = ETAT_COLORS[etat];
        const items = data.filter((p) => p.etat === etat);
        return (
          <div key={etat}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = c.bg; }}
            onDragLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
            onDrop={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              const id = parseInt(e.dataTransfer.getData("text/plain"));
              if (id) onChangeEtat(id, etat);
            }}
            style={{
              flex: "1 1 0", minWidth: 220, background: "#f8fafc", borderRadius: 12,
              padding: 10, display: "flex", flexDirection: "column", transition: "background 0.15s",
            }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "6px 8px",
              borderBottom: `2px solid ${c.border}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: c.text, flex: 1 }}>{etat}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.text, background: c.bg, padding: "2px 8px", borderRadius: 10 }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
              {items.map((p) => (
                <div key={p.id} draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", p.id.toString()); e.dataTransfer.effectAllowed = "move"; }}
                  onClick={() => onSelect(p)}
                  style={{
                    background: "#fff", borderRadius: 10, padding: "12px 14px",
                    border: "1px solid #e2e8f0", cursor: "grab",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{p.societe}</div>
                  {p.responsable && <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>👤 {p.responsable}</div>}
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                    {p.destination?.map((t) => <Tag key={t} label={t} color={TAG_COLORS.destination} small />)}
                  </div>
                  {p.localites?.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                      {p.localites.map((l) => <Tag key={l} label={l} color={TAG_COLORS.localites} small />)}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.surface ? `${Number(p.surface).toLocaleString("fr-FR")} m²` : ""}</span>
                    {p.notes?.length > 0 && <span style={{ fontSize: 10, color: "#94a3b8" }}>({p.notes.length} note{p.notes.length > 1 ? "s" : ""})</span>}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ fontSize: 11, color: "#cbd5e1", textAlign: "center", padding: "30px 10px" }}>Glissez un prospect ici</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== MAIN APP ===================== */
export default function App() {
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

  /* --- SUPABASE: Fetch all prospects --- */
  const fetchData = async () => {
    const { data: rows, error } = await supabase
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && rows) setData(rows.map(fromDb));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* --- Realtime: auto-refresh when another user makes changes --- */
  useEffect(() => {
    const channel = supabase
      .channel("prospects-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "prospects" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const allResponsables = useMemo(() => {
    const names = data.map((p) => p.responsable).filter(Boolean);
    return [...new Set(names)];
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) =>
        [p.societe, p.contact, p.commentaires, p.responsable, ...(p.typeActeur || []), ...(p.detention || []), ...(p.destination || []), ...(p.localites || [])]
          .some((f) => f && f.toLowerCase().includes(s))
      );
    }
    if (filterEtats.length > 0) list = list.filter((p) => filterEtats.includes(p.etat));
    if (filterDests.length > 0) list = list.filter((p) => p.destination?.some((d) => filterDests.includes(d)));
    list.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === "surface") { va = Number(va) || 0; vb = Number(vb) || 0; }
      if (sortField === "date") { va = va || ""; vb = vb || ""; }
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, search, filterEtats, filterDests, sortField, sortDir]);

  /* --- SUPABASE: Create --- */
  const handleSave = async (form) => {
    if (editing) {
      const dbData = toDb(form);
      const { error } = await supabase.from("prospects").update(dbData).eq("id", editing.id);
      if (!error) {
        const updated = { ...form, id: editing.id, notes: editing.notes || [] };
        setData(data.map((p) => (p.id === editing.id ? updated : p)));
        setDetail(updated);
      }
    } else {
      const dbData = toDb(form);
      const { data: rows, error } = await supabase.from("prospects").insert(dbData).select();
      if (!error && rows?.[0]) {
        setData([fromDb(rows[0]), ...data]);
      }
    }
    setModalOpen(false);
    setEditing(null);
  };

  /* --- SUPABASE: Update (notes, etc.) --- */
  const handleUpdate = useCallback(async (updated) => {
    const dbData = toDb(updated);
    const { error } = await supabase.from("prospects").update(dbData).eq("id", updated.id);
    if (!error) {
      setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setDetail(updated);
    }
  }, []);

  /* --- SUPABASE: Delete --- */
  const handleDelete = async (id) => {
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (!error) {
      setData(data.filter((p) => p.id !== id));
      setDetail(null);
    }
    setConfirmDelete(null);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  /* --- SUPABASE: Change état (Kanban drag) --- */
  const handleChangeEtat = async (id, newEtat) => {
    const { error } = await supabase.from("prospects").update({ etat: newEtat }).eq("id", id);
    if (!error) {
      setData((prev) => prev.map((p) => p.id === id ? { ...p, etat: newEtat } : p));
    }
  };

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 3, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  const stats = useMemo(() => ({
    total: data.length,
    enVeille: data.filter((p) => p.etat === "En veille").length,
    actif: data.filter((p) => p.etat === "Actif").length,
    termine: data.filter((p) => p.etat === "Terminé").length,
    abandonne: data.filter((p) => p.etat === "Abandonné").length,
  }), [data]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#94a3b8" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Chargement des prospects...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        input:focus, select:focus, textarea:focus { border-color: #0f172a !important; }
        tr:hover td { background: #f1f5f9 !important; }
      `}</style>

      <div style={{ background: "#0f172a", padding: "22px 32px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1500, margin: "0 auto" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 2 }}>VINCI IMMOBILIER</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Prospects & Recherches</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: 3 }}>
              {[{ key: "table", icon: "☰", label: "Tableau" }, { key: "kanban", icon: "◫", label: "Kanban" }].map((v) => (
                <button key={v.key} onClick={() => setView(v.key)} style={{
                  border: "none", borderRadius: 6, padding: "6px 14px",
                  background: view === v.key ? "rgba(255,255,255,0.2)" : "transparent",
                  color: view === v.key ? "#fff" : "#94a3b8",
                  cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}><span style={{ fontSize: 14 }}>{v.icon}</span>{v.label}</button>
              ))}
            </div>
            <button onClick={() => { setEditing(null); setModalOpen(true); }} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "#fff", color: "#0f172a", cursor: "pointer",
              fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            ><span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nouveau prospect</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "20px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total prospects", val: stats.total, color: "#0f172a" },
            { label: "En veille", val: stats.enVeille, color: "#a855f7" },
            { label: "Actif", val: stats.actif, color: "#22c55e" },
            { label: "Terminé", val: stats.termine, color: "#94a3b8" },
            { label: "Abandonné", val: stats.abandonne, color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 12, padding: "16px 20px",
              border: "1px solid #e2e8f0", animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher société, localité, contact, responsable..."
              style={{ ...fieldStyle, paddingLeft: 36, background: "#fff", border: "1.5px solid #e2e8f0" }} />
          </div>
          <MultiFilterDropdown label="Filtrer par état" options={TAG_OPTIONS.etat} selected={filterEtats} onChange={setFilterEtats} />
          <MultiFilterDropdown label="Filtrer par destination" options={TAG_OPTIONS.destination} selected={filterDests} onChange={setFilterDests} />
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {view === "kanban" ? (
          <KanbanView data={filtered} onSelect={setDetail} onChangeEtat={handleChangeEtat} />
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      { key: "date", label: "Date", w: 95 },
                      { key: "societe", label: "Société", w: 155 },
                      { key: "responsable", label: "Resp.", w: 80 },
                      { key: "typeActeur", label: "Type", w: 110 },
                      { key: "detention", label: "Détention", w: 110 },
                      { key: "destination", label: "Destination", w: 125 },
                      { key: "etat", label: "État", w: 100 },
                      { key: "localites", label: "Localités", w: 160 },
                      { key: "surface", label: "Surface", w: 80 },
                      { key: "contact", label: "Contact", w: 120 },
                    ].map((col) => (
                      <th key={col.key} onClick={() => handleSort(col.key)} style={{
                        padding: "12px 10px", textAlign: "left", fontWeight: 700, fontSize: 10,
                        textTransform: "uppercase", letterSpacing: 0.6, color: "#64748b",
                        borderBottom: "1.5px solid #e2e8f0", cursor: "pointer",
                        whiteSpace: "nowrap", minWidth: col.w, userSelect: "none",
                      }}>{col.label}<SortIcon field={col.key} /></th>
                    ))}
                    <th style={{ padding: "12px 8px", borderBottom: "1.5px solid #e2e8f0", width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ cursor: "pointer", animation: `fadeUp 0.2s ease ${i * 0.02}s both` }}
                      onClick={() => setDetail(p)}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: 11 }}>{formatDate(p.date)}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", fontWeight: 700 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {p.societe}
                          {p.notes?.length > 0 && <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>({p.notes.length})</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#475569" }}>{p.responsable || "—"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {p.typeActeur?.map((t) => <Tag key={t} label={t} color={TAG_COLORS.typeActeur} small />)}
                        </div>
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {p.detention?.map((t) => <Tag key={t} label={t} color={TAG_COLORS.detention} small />)}
                        </div>
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {p.destination?.map((t) => <Tag key={t} label={t} color={TAG_COLORS.destination} small />)}
                        </div>
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}><StatusBadge status={p.etat} small /></td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {p.localites?.map((l) => <Tag key={l} label={l} color={TAG_COLORS.localites} small />)}
                        </div>
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                        {p.surface ? `${Number(p.surface).toLocaleString("fr-FR")} m²` : "—"}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: 11 }}>
                        <div style={{ fontWeight: 600 }}>{p.contact}</div>
                        {p.numero && <div style={{ color: "#94a3b8", fontSize: 10 }}>{p.numero}</div>}
                      </td>
                      <td style={{ padding: "10px 8px", borderBottom: "1px solid #f1f5f9" }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setConfirmDelete(p)} style={{
                          border: "none", background: "transparent", cursor: "pointer",
                          color: "#cbd5e1", fontSize: 14, padding: 4, borderRadius: 6, transition: "all 0.15s",
                        }}
                          onMouseEnter={(e) => { e.target.style.color = "#ef4444"; e.target.style.background = "#fef2f2"; }}
                          onMouseLeave={(e) => { e.target.style.color = "#cbd5e1"; e.target.style.background = "transparent"; }}
                          title="Supprimer"
                        >🗑</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Aucun prospect trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Modifier le prospect" : "Nouveau prospect"}>
        <ProspectForm prospect={editing} onSave={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); }} allResponsables={allResponsables} />
      </Modal>

      {detail && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.1)" }} onClick={() => setDetail(null)} />
          <DetailPanel prospect={detail} onClose={() => setDetail(null)}
            onEdit={(p) => { setEditing(p); setModalOpen(true); setDetail(null); }}
            onUpdate={handleUpdate} />
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        message={confirmDelete ? `Supprimer le prospect "${confirmDelete.societe}" ? Cette action est irréversible.` : ""}
        onConfirm={() => handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
