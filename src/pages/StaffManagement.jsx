import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const roleLabels = {
  patient: "مريض",
  doctor: "طبيب",
  nurse: "ممرض/ة",
  admin: "إداري",
};

const roleOptions = ["patient", "doctor", "nurse", "admin"];

export default function StaffManagement({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [successId, setSuccessId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setUsers(data);
    }
    setLoading(false);
  }

  async function handleRoleChange(userId, newRole) {
    setSavingId(userId);
    setError(null);
    setSuccessId(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    setSavingId(null);

    if (updateError) {
      setError(`فشل تحديث الدور: ${updateError.message}`);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setSuccessId(userId);
    setTimeout(() => setSuccessId(null), 2000);
  }

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة الموظفين والأدوار</h1>
        <p style={styles.subtitle}>
          حدد دور كل مستخدم: طبيب، ممرض/ة، إداري، أو مريض.
        </p>
      </div>

      {loading && <p style={styles.loading}>جاري تحميل المستخدمين...</p>}

      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && users.length === 0 && (
        <p style={styles.loading}>لا يوجد مستخدمون مسجلون بعد.</p>
      )}

      <div style={styles.list}>
        {users.map((u) => (
          <div key={u.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.avatar}>
                {u.full_name?.charAt(0) || "؟"}
              </div>
              <div style={styles.cardInfo}>
                <div style={styles.name}>{u.full_name || "بدون اسم"}</div>
                {u.phone && <div style={styles.phone}>{u.phone}</div>}
              </div>
            </div>

            <div style={styles.roleRow}>
              <span style={styles.roleLabel}>الدور الحالي:</span>
              <span style={styles.currentBadge}>
                {roleLabels[u.role] || u.role}
              </span>
            </div>

            <div style={styles.roleRow}>
              <span style={styles.roleLabel}>تغيير الدور إلى:</span>
              <select
                style={styles.select}
                value={u.role}
                disabled={savingId === u.id || u.id === session.user.id}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
            </div>

            {u.id === session.user.id && (
              <div style={styles.selfNote}>هذا حسابك — لا يمكن تعديله من هنا</div>
            )}
            {savingId === u.id && (
              <div style={styles.savingNote}>جاري الحفظ...</div>
            )}
            {successId === u.id && (
              <div style={styles.successNote}>تم التحديث بنجاح ✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F7FA",
    fontFamily: "'Segoe UI', Tahoma, system-ui, sans-serif",
    padding: "24px 16px",
  },
  header: { maxWidth: 560, margin: "0 auto 24px" },
  title: { fontSize: 22, color: "#0B1E3D", margin: "0 0 6px" },
  subtitle: { fontSize: 14, color: "#8A93A3", margin: 0 },
  loading: { textAlign: "center", color: "#8A93A3", padding: "24px 0" },
  errorBox: {
    maxWidth: 560,
    margin: "0 auto 16px",
    padding: "14px 18px",
    background: "#FDECEC",
    color: "#C0392B",
    borderRadius: 10,
    fontWeight: 600,
  },
  list: {
    maxWidth: 560,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
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
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 700, color: "#0B1E3D" },
  phone: { fontSize: 13, color: "#8A93A3", marginTop: 2 },
  roleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
  },
  roleLabel: { fontSize: 14, color: "#4A5568", fontWeight: 600 },
  currentBadge: {
    background: "#FDE8EF",
    color: "#E8477A",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
  },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    fontSize: 14,
    background: "#ffffff",
  },
  selfNote: {
    marginTop: 8,
    fontSize: 12,
    color: "#8A93A3",
    fontStyle: "italic",
  },
  savingNote: {
    marginTop: 8,
    fontSize: 13,
    color: "#1B3B6F",
    fontWeight: 600,
  },
  successNote: {
    marginTop: 8,
    fontSize: 13,
    color: "#2ECC71",
    fontWeight: 700,
  },
};
