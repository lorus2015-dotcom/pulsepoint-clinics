import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

function getNextDays(count) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateLabel(date) {
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function toDateString(date) {
  return date.toISOString().split("T")[0];
}

function formatTimeLabel(time24) {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? "م" : "ص";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minuteStr} ${period}`;
}

export default function BookAppointment({ session, onBack }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookedTimeLabel, setBookedTimeLabel] = useState(null);

  const days = getNextDays(7);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadBookedSlots();
    }
  }, [selectedDoctor, selectedDate]);

  async function loadDoctors() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "doctor");

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setDoctors(data || []);
    }
    setLoading(false);
  }

  async function loadBookedSlots() {
    const { data, error: fetchError } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", selectedDoctor.id)
      .eq("appointment_date", toDateString(selectedDate))
      .eq("status", "confirmed");

    if (!fetchError) {
      setBookedSlots(data.map((a) => a.appointment_time.slice(0, 5)));
    }
  }

  async function handleBook(time) {
    setBooking(true);
    setError(null);

    const { error: insertError } = await supabase.from("appointments").insert({
      patient_id: session.user.id,
      doctor_id: selectedDoctor.id,
      appointment_date: toDateString(selectedDate),
      appointment_time: time,
    });

    setBooking(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("للأسف هذا الموعد تم حجزه للتو من شخص آخر. اختر موعدًا آخر.");
        loadBookedSlots();
      } else {
        setError(insertError.message);
      }
      return;
    }

    setSuccess(true);
    setBookedTimeLabel(formatTimeLabel(time));
  }

  if (success) {
    return (
      <div style={styles.page} dir="rtl">
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>تم تأكيد حجزك بنجاح</h2>
          <p style={styles.successText}>
            مع د. {selectedDoctor.full_name}
            <br />
            {formatDateLabel(selectedDate)} — الساعة {bookedTimeLabel}
          </p>
          <button style={styles.primaryBtn} onClick={onBack}>
            العودة للوحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← رجوع
        </button>
        <h1 style={styles.title}>حجز موعد جديد</h1>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {!selectedDoctor && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>اختر الطبيب</h2>
          {loading && <p style={styles.loading}>جاري تحميل الأطباء...</p>}
          {!loading && doctors.length === 0 && (
            <p style={styles.loading}>لا يوجد أطباء متاحون حاليًا.</p>
          )}
          <div style={styles.list}>
            {doctors.map((doc) => (
              <button
                key={doc.id}
                style={styles.doctorCard}
                onClick={() => setSelectedDoctor(doc)}
              >
                <div style={styles.avatar}>{doc.full_name?.charAt(0)}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={styles.doctorName}>{doc.full_name}</div>
                  <div style={styles.doctorSub}>طبيب</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDoctor && !selectedDate && (
        <div style={styles.section}>
          <button
            style={styles.changeBtn}
            onClick={() => setSelectedDoctor(null)}
          >
            تغيير الطبيب
          </button>
          <h2 style={styles.sectionTitle}>
            اختر اليوم — د. {selectedDoctor.full_name}
          </h2>
          <div style={styles.daysList}>
            {days.map((d, i) => (
              <button
                key={i}
                style={styles.dayCard}
                onClick={() => setSelectedDate(d)}
              >
                {formatDateLabel(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDoctor && selectedDate && (
        <div style={styles.section}>
          <button style={styles.changeBtn} onClick={() => setSelectedDate(null)}>
            تغيير اليوم
          </button>
          <h2 style={styles.sectionTitle}>
            اختر الموعد — {formatDateLabel(selectedDate)}
          </h2>
          <div style={styles.slotsGrid}>
            {TIME_SLOTS.map((time) => {
              const isBooked = bookedSlots.includes(time);
              return (
                <button
                  key={time}
                  style={{
                    ...styles.slotBtn,
                    ...(isBooked ? styles.slotBtnDisabled : {}),
                  }}
                  disabled={isBooked || booking}
                  onClick={() => handleBook(time)}
                >
                  {isBooked ? `${formatTimeLabel(time)} (محجوز)` : formatTimeLabel(time)}
                </button>
              );
            })}
          </div>
          {booking && <p style={styles.loading}>جاري تأكيد الحجز...</p>}
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
  header: {
    maxWidth: 480,
    margin: "0 auto 20px",
  },
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
  sectionTitle: {
    fontSize: 16,
    color: "#4A5568",
    fontWeight: 700,
    marginBottom: 14,
  },
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
  doctorCard: {
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
  doctorName: { fontSize: 16, fontWeight: 700, color: "#0B1E3D" },
  doctorSub: { fontSize: 13, color: "#8A93A3", marginTop: 2 },
  changeBtn: {
    background: "none",
    border: "none",
    color: "#E8477A",
    fontSize: 13,
    fontWeight: 700,
    padding: 0,
    marginBottom: 14,
    cursor: "pointer",
  },
  daysList: { display: "flex", flexDirection: "column", gap: 10 },
  dayCard: {
    background: "#ffffff",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 600,
    color: "#0B1E3D",
    textAlign: "right",
    cursor: "pointer",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  slotBtn: {
    background: "#ffffff",
    border: "2px solid #1B3B6F",
    borderRadius: 10,
    padding: "14px 0",
    fontSize: 15,
    fontWeight: 700,
    color: "#1B3B6F",
    cursor: "pointer",
  },
  slotBtnDisabled: {
    border: "2px solid #E2E8F0",
    color: "#C0C7D1",
    cursor: "not-allowed",
  },
  successCard: {
    maxWidth: 420,
    margin: "80px auto 0",
    background: "#ffffff",
    borderRadius: 18,
    padding: 32,
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#2ECC71",
    color: "#ffffff",
    fontSize: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  successTitle: { fontSize: 19, color: "#0B1E3D", margin: "0 0 12px" },
  successText: { fontSize: 14, color: "#4A5568", lineHeight: 1.8, marginBottom: 24 },
  primaryBtn: {
    width: "100%",
    padding: "13px 0",
    borderRadius: 10,
    border: "none",
    background: "#E8477A",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
