import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function MyPatients({ session, onBack }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [nextDose, setNextDose] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadNotes(selectedPatient.id);
    }
  }, [selectedPatient]);

  async function loadPatients() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("appointments")
      .select("patient_id, profiles!appointments_patient_id_fkey(id, full_name, phone)")
      .eq("doctor_id", session.user.id);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const uniquePatients = [];
    const seenIds = new Set();
    for (const row of data) {
      const p = row.profiles;
      if (p && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniquePatients.push(p);
      }
    }

    setPatients(uniquePatients);
    setLoading(false);
  }

  async function loadNotes(patientId) {
    const { data, error: fetchError } = await supabase
      .from("medical_notes")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", session.user.id)
      .order("visit_date", { ascending: false });

    if (!fetchError) {
      setNotes(data || []);
    }
  }

  async function handleSaveNote(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const { error: insertError } = await supabase.from("medical_notes").insert({
      patient_id: selectedPatient.id,
      doctor_id: session.user.id,
      diagnosis: diagnosis.trim() || null,
      treatment: treatment.trim() || null,
      next_dose: nextDose.trim() || null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDiagnosis("");
    setTreatment("");
    setNextDose("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    loadNotes(selectedPatient.id);
  }

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={selectedPatient ? () => setSelectedPatient(null) : onBack}
        >
          ← {selectedPatient ? "قائمة المرضى" : "رجوع"}
        </button>
        <h1 style={styles.title}>
          {selectedPatient ? selectedPatient.full_name : "مرضاي"}
        </h1>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {!selectedPatient && (
        <div style={styles.section}>
          {loading && <p style={styles.loading}>جاري تحميل المرضى...</p>}
          {!loading && patients.length === 0 && (
            <p style={styles.loading}>لا يوجد مرضى لديك حجوزات معهم بعد.</p>
          )}
          <div style={styles.list}>
            {patients.map((p) => (
              <button
                key={p.id}
                style={styles.patientCard}
                onClick={() => setSelectedPatient(p)}
              >
                <div style={styles.avatar}>{p.full_name?.charAt(0)}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={styles.patientName}>{p.full_name}</div>
                  {p.phone && <div style={styles.patientSub}>{p.phone}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPatient && (
        <div style={styles.section}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>إضافة ملاحظة جديدة</h2>
            <form onSubmit={handleSaveNote}>
              <label style={styles.label}>التشخيص</label>
              <textarea
                style={styles.textarea}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="مثال: التهاب الحلق"
              />

              <label style={styles.label}>العلاج</label>
              <textarea
                style={styles.textarea}
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="مثال: مضاد حيوي لمدة 5 أيام"
              />

              <label style={styles.label}>الجرعة التالية / المتابعة</label>
              <input
                style={styles.input}
                type="text"
                value={nextDose}
                onChange={(e) => setNextDose(e.target.value)}
                placeholder="مثال: بعد أسبوعين"
              />

              {saveSuccess && (
                <div style={styles.successBox}>تم حفظ الملاحظة بنجاح ✓</div>
              )}

              <button style={styles.saveBtn} type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ الملاحظة"}
              </button>
            </form>
          </div>

          <h3 style={styles.historyTitle}>الزيارات السابقة</h3>
          {notes.length === 0 && (
            <p style={styles.loading}>لا توجد ملاحظات سابقة لهذا المريض.</p>
          )}
          <div style={styles.list}>
            {notes.map((note) => (
              <div key={note.id} style={styles.noteCard}>
                <div style={styles.noteDate}>
                  {new Date(note.visit_date).toLocaleDateString("ar-EG")}
                </div>
                {note.diagnosis && (
                  <div style={styles.noteRow}>
                    <span style={styles.noteLabel}>التشخيص:</span>{" "}
                    {note.diagnosis}
                  </div>
                )}
                {note.treatment && (
                  <div style={styles.noteRow}>
                    <span style={styles.noteLabel}>العلاج:</span>{" "}
                    {note.treatment}
                  </div>
                )}
                {note.next_dose && (
                  <div style={styles.noteRow}>
                    <span style={styles.noteLabel}>المتابعة:</span>{" "}
                    {note.next_dose}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F7FA",
    fontFamily: "'Segoe UI', Tahoma, system-ui, sans-serif",
    padding: "20px 16px",
  },
  header: { maxWidth: 480, margin: "0 auto 20px" },
  backBtn: {
    background: "none",
    border: "none",
    color: "#1B3B6F",
    fontSize: 14,
    fontWeight: 700,
    padding: 0,
    marginBottom: 12,
    cursor: "pointer",
  },
  title: { fontSize: 22, color: "#0B1E3D", margin: 0 },
  section: { maxWidth: 480, margin: "0 auto" },
  loading: { textAlign: "center", color: "#8A93A3", padding: "20px 0" },
  errorBox: {
    maxWidth: 480,
    margin: "0 auto 16px",
    padding: "14px 18px",
    background: "#FDECEC",
    color: "#C0392B",
    borderRadius: 10,
    fontWeight: 600,
  },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  patientCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#ffffff",
    border: "none",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    cursor: "pointer",
    textAlign: "right",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#1B3B6F",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  patientName: { fontSize: 16, fontWeight: 700, color: "#0B1E3D" },
  patientSub: { fontSize: 13, color: "#8A93A3", marginTop: 2 },
  formCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  formTitle: { fontSize: 16, color: "#0B1E3D", marginTop: 0, marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    color: "#4A5568",
    marginBottom: 6,
    marginTop: 14,
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    fontSize: 14,
    minHeight: 60,
    boxSizing: "border-box",
    fontFamily: "inherit",
    textAlign: "right",
    resize: "vertical",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    fontSize: 14,
    boxSizing: "border-box",
    textAlign: "right",
  },
  saveBtn: {
    width: "100%",
    marginTop: 18,
    padding: "12px 0",
    borderRadius: 10,
    border: "none",
    background: "#1B3B6F",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  successBox: {
    marginTop: 14,
    padding: "10px 14px",
    background: "#E8F8EF",
    color: "#2ECC71",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    textAlign: "center",
  },
  historyTitle: { fontSize: 15, color: "#4A5568", marginBottom: 12 },
  noteCard: {
    background: "#ffffff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  noteDate: {
    fontSize: 12,
    color: "#8A93A3",
    fontWeight: 700,
    marginBottom: 8,
  },
  noteRow: { fontSize: 14, color: "#2D3748", marginBottom: 4 },
  noteLabel: { fontWeight: 700, color: "#1B3B6F" },
};
