import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import StaffManagement from "./StaffManagement";
import BookAppointment from "./BookAppointment";
import MyPatients from "./MyPatients";

const roleLabels = {
  patient: "مريض",
  doctor: "طبيب",
  nurse: "ممرض/ة",
  admin: "إداري",
};

export default function Dashboard({ session, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showMyPatients, setShowMyPatients] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    loadProfile();
  }, [session]);

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  if (showMyPatients) {
    return (
      <MyPatients session={session} onBack={() => setShowMyPatients(false)} />
    );
  }

  if (showBooking) {
    return (
      <BookAppointment session={session} onBack={() => setShowBooking(false)} />
    );
  }

  if (showStaffManagement) {
    return (
      <div>
        <div style={styles.topBar}>
          <div style={styles.brand}>
            <span style={{ color: "#0B1E3D" }}>Pulse</span>
            <span style={{ color: "#E8477A" }}>Point</span>
          </div>
          <button
            style={styles.backBtn}
            onClick={() => setShowStaffManagement(false)}
          >
            ← رجوع للوحة الرئيسية
          </button>
        </div>
        <StaffManagement session={session} />
      </div>
    );
  }

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.topBar}>
        <div style={styles.brand}>
          <span style={{ color: "#0B1E3D" }}>Pulse</span>
          <span style={{ color: "#E8477A" }}>Point</span>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </div>

      <div style={styles.content}>
        {loading && <p>جاري تحميل بياناتك...</p>}

        {error && (
          <div style={styles.errorBox}>
            حصل خطأ أثناء تحميل البروفايل: {error}
          </div>
        )}

        {profile && (
          <div style={styles.card}>
            <div style={styles.avatar}>
              {profile.full_name?.charAt(0) || "؟"}
            </div>
            <h2 style={styles.name}>{profile.full_name}</h2>
            <span style={styles.roleBadge}>
              {roleLabels[profile.role] || profile.role}
            </span>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>البريد الإلكتروني</span>
              <span style={styles.infoValue}>{session.user.email}</span>
            </div>
            {profile.phone && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>رقم الموبايل</span>
                <span style={styles.infoValue}>{profile.phone}</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>تاريخ الانضمام</span>
              <span style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString("ar-EG")}
              </span>
            </div>

            <p style={styles.note}>
              ده Dashboard موحّد مبدئي لكل الأدوار. الخطوة الجاية هنخصص كل دور
              بشاشة وصلاحيات مختلفة (طبيب / ممرض / إداري / مريض).
            </p>

            {profile.role === "doctor" && (
              <button
                style={styles.staffBtn}
                onClick={() => setShowMyPatients(true)}
              >
                مرضاي
              </button>
            )}

            {profile.role === "patient" && (
              <button
                style={styles.staffBtn}
                onClick={() => setShowBooking(true)}
              >
                حجز موعد جديد
              </button>
            )}

            {profile.role === "admin" && (
              <button
                style={styles.staffBtn}
                onClick={() => setShowStaffManagement(true)}
              >
                إدارة الموظفين والأدوار
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F7FA",
    fontFamily: "'Segoe UI', Tahoma, system-ui, sans-serif",
  },
  topBar: {
    background: "#ffffff",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  brand: { fontSize: 20, fontWeight: 800 },
  logoutBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    background: "#ffffff",
    color: "#C0392B",
    fontWeight: 700,
    cursor: "pointer",
  },
  content: {
    maxWidth: 480,
    margin: "32px auto",
    padding: "0 16px",
  },
  card: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 28,
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#1B3B6F",
    color: "#ffffff",
    fontSize: 28,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  name: { margin: "0 0 8px", fontSize: 20, color: "#0B1E3D" },
  roleBadge: {
    display: "inline-block",
    background: "#FDE8EF",
    color: "#E8477A",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 24,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderTop: "1px solid #F0F2F5",
    fontSize: 14,
  },
  infoLabel: { color: "#8A93A3", fontWeight: 600 },
  infoValue: { color: "#2D3748", fontWeight: 700 },
  note: {
    marginTop: 20,
    fontSize: 13,
    color: "#8A93A3",
    lineHeight: 1.7,
  },
  errorBox: {
    padding: "14px 18px",
    background: "#FDECEC",
    color: "#C0392B",
    borderRadius: 10,
    fontWeight: 600,
  },
  staffBtn: {
    marginTop: 20,
    width: "100%",
    padding: "13px 0",
    borderRadius: 10,
    border: "none",
    background: "#1B3B6F",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  backBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    background: "#ffffff",
    color: "#1B3B6F",
    fontWeight: 700,
    cursor: "pointer",
  },
};
