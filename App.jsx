import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1E3D",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        جاري التحميل...
      </div>
    );
  }

  if (!session) {
    return (
      <Auth onAuthSuccess={(newSession) => setSession(newSession)} />
    );
  }

  return <Dashboard session={session} onLogout={() => setSession(null)} />;
}
