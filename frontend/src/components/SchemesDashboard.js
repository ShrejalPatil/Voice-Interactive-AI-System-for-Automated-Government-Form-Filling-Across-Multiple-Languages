import React, { useEffect, useState } from "react";

export default function SchemesDashboard({
  eligibleSchemes,
  showEligibleOnly,
  viewSchemeDetails,
  applyForScheme,
  selectedLanguage,
}) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Localized labels
  const labels = {
    en: {
      dashboardTitle: "📊 Government Schemes Dashboard",
      eligibleTitle: "🎯 Eligible Schemes for You",
      applications: "Applications",
      apply: "Apply",
      details: "Details",
      loading: "Loading dashboard...",
    },
    hi: {
      dashboardTitle: "📊 सरकारी योजनाओं का डैशबोर्ड",
      eligibleTitle: "🎯 आपके लिए योग्य योजनाएं",
      applications: "आवेदन",
      apply: "आवेदन करें",
      details: "विवरण",
      loading: "डैशबोर्ड लोड हो रहा है...",
    },
    kn: {
      dashboardTitle: "📊 ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      eligibleTitle: "🎯 ನಿಮಗೆ ಅರ್ಹವಾದ ಯೋಜನೆಗಳು",
      applications: "ಅರ್ಜಿ",
      apply: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
      details: "ವಿವರಗಳು",
      loading: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    },
  };

  const t = labels[selectedLanguage] || labels.en;

  // 🔹 Fetch schemes again when language changes
  useEffect(() => {
    fetchAllSchemes();
  }, [selectedLanguage]);

  async function fetchAllSchemes() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/all-schemes-with-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selectedLanguage }),
      });

      const data = await res.json();

      // ensure translated data is applied
      if (data && Array.isArray(data.schemes)) {
        setSchemes(data.schemes);
      } else {
        setSchemes([]);
      }
    } catch (err) {
      console.error("❌ Error loading schemes:", err);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Choose what to display
  const displaySchemes = showEligibleOnly ? eligibleSchemes : schemes;

  // 🔹 Translate eligibleSchemes dynamically (if backend returns only English)
  const translatedSchemes = displaySchemes.map((s) => {
    if (!s.translations) return s; // backend has already translated

    const langText = s.translations[selectedLanguage];
    return {
      ...s,
      name: langText?.name || s.name,
      description: langText?.description || s.description,
    };
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, fontSize: 18, color: "#555" }}>
        {t.loading}
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <h2
        style={{
          fontSize: 30,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 30,
          color: "#222",
        }}
      >
        {showEligibleOnly ? t.eligibleTitle : t.dashboardTitle}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 15,
          justifyItems: "center",
        }}
      >
        {translatedSchemes.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              padding: 15,
              width: 260,
              textAlign: "center",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            }}
          >
            {/* Scheme Name */}
            <h3 style={{ color: "#1976d2", marginBottom: 8, fontWeight: 600 }}>
              {s.name || "—"}
            </h3>

            {/* Description */}
            <p style={{ color: "#555", fontSize: 13, marginBottom: 16, minHeight: 38 }}>
              {s.description || ""}
            </p>

            {/* Show progress only for full dashboard */}
            {!showEligibleOnly && (
              <div
                style={{
                  position: "relative",
                  width: 90,
                  height: 90,
                  margin: "auto",
                  marginBottom: 10,
                }}
              >
                <svg width="90" height="90">
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    stroke="#eee"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    stroke={
                      s.applied_percentage >= 75
                        ? "#6f42c1"
                        : s.applied_percentage >= 50
                        ? "#28a745"
                        : "#ff9800"
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(s.applied_percentage / 100) * 251} 251`}
                    transform="rotate(-90 45 45)"
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "35%",
                    left: 0,
                    right: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  {s.applied_percentage || 0}%
                </div>
              </div>
            )}

            {/* Applications count */}
            <h4 style={{ margin: 0, fontSize: 18, color: "#222" }}>
              {s.total_applications || 0}
            </h4>
            <p style={{ color: "#777", fontSize: 13, marginBottom: 14 }}>
              {t.applications}
            </p>

            {/* Eligible-only buttons */}
            {showEligibleOnly && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button
                  onClick={() => viewSchemeDetails(s.name)}
                  style={{
                    background: "#fff",
                    color: "#1976d2",
                    border: "1px solid #1976d2",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {t.details}
                </button>
                <button
                  onClick={() => applyForScheme(s)}
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {t.apply}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
