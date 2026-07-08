import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignUp(e) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("من فضلك املأ الاسم والبريد الإلكتروني وكلمة المرور.");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور لازم تكون 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(translateError(signUpError.message));
      return;
    }

    onAuthSuccess(data.session, data.user);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("من فضلك أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (loginError) {
      setError(translateError(loginError.message));
      return;
    }

    onAuthSuccess(data.session, data.user);
  }

  function translateError(msg) {
    if (msg.includes("Invalid login credentials")) {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    if (msg.includes("User already registered")) {
      return "يوجد حساب بالفعل بهذا البريد الإلكتروني. جرب تسجيل الدخول.";
    }
    if (msg.includes("Failed to fetch")) {
      return "تعذر الاتصال بالسيرفر. تأكد من اتصال الإنترنت وحاول مرة أخرى.";
    }
    return msg;
  }

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.headerRow} dir="ltr">
        <span style={styles.heart}>♥</span>
        <span style={styles.brandNavy}>Pulse</span>
        <span style={styles.brandPink}>Point</span>
        <span style={styles.brandNavy}> Clinics</span>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button
            style={mode === "signup" ? styles.tabActive : styles.tabInactive}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            حساب جديد
          </button>
          <button
            style={mode === "login" ? styles.tabActive : styles.tabInactive}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            تسجيل الدخول
          </button>
        </div>

        <form onSubmit={mode === "signup" ? handleSignUp : handleLogin}>
          {mode === "signup" && (
            <>
              <label style={styles.label}>الاسم بالكامل</label>
              <input
                style={styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="د. محمد فهمي أبورية"
              />

              <label style={styles.label}>رقم الموبايل (اختياري)</label>
              <input
                style={styles.input}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
              />
            </>
          )}

          <label style={styles.label}>البريد الإلكتروني</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />

          <label style={styles.label}>كلمة المرور</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <div style={styles.errorBox}>{error}</div>}

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading
              ? "جاري التنفيذ..."
              : mode === "signup"
              ? "إنشاء الحساب"
              : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0B1E3D 0%, #1B3B6F 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px",
    fontFamily: "'Segoe UI', Tahoma, system-ui, sans-serif",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
    fontSize: 30,
    fontWeight: 800,
  },
  brandNavy: { color: "#ffffff" },
  brandPink: { color: "#E8477A" },
  heart: {
    background: "#ffffff",
    color: "#E8477A",
    borderRadius: "50%",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    marginRight: 4,
  },
  card: {
    background: "#ffffff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  },
  tabs: {
    display: "flex",
    background: "#F0F2F5",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabActive: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    border: "none",
    background: "#ffffff",
    color: "#1B3B6F",
    fontWeight: 700,
    fontSize: 15,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    cursor: "pointer",
  },
  tabInactive: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#8A93A3",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  label: {
    display: "block",
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 6,
    marginTop: 16,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 10,
    border: "1px solid #E2E8F0",
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
    textAlign: "right",
  },
  errorBox: {
    marginTop: 16,
    padding: "10px 14px",
    background: "#FDECEC",
    color: "#C0392B",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
  },
  submitBtn: {
    width: "100%",
    marginTop: 24,
    padding: "15px 0",
    borderRadius: 12,
    border: "none",
    background: "#E8477A",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
};
