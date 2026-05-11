// src/components/HeaderBar.js
import React from "react";

export default function HeaderBar({
  selectedLanguage,
  handleLanguageChange,
  setShowApplications,
  hasPreviewButton,
  onPreviewClick,
}) {
  // 🌐 Translations for all supported languages
  const translations = {
    en: {
      title: "Govt Assisted Auto Form Filling",
      applications: "Applications",
      preview: "Preview Application",
    },
    hi: {
      title: "सरकारी सहायता प्राप्त स्वचालित फॉर्म भरना",
      applications: "आवेदन",
      preview: "आवेदन देखें",
    },
    kn: {
      title: "ಸರ್ಕಾರಿ ಸಹಾಯಿತ ಸ್ವಯಂ ಫಾರ್ಮ್ ಭರ್ತಿ",
      applications: "ಅರ್ಜಿ",
      preview: "ಅರ್ಜಿ ಪೂರ್ವವೀಕ್ಷಣೆ",
    },
  };

  const { title, applications, preview } =
    translations[selectedLanguage] || translations.en;

  return (
    <div
      className="header"
      style={{
        width: "98%",
        padding: "1rem",
        background: "#0ea5e9",
        borderBottom: "1px solid #7a7a7aff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* Logo + Dynamic Title */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontWeight: 700,
          fontSize: 30,
          color: "#ffffff",
          transition: "0.3s ease",
        }}
      >
        <img src="/weblion.svg" alt="Logo" style={{ width: 45 }} />
        {title}
      </span>

      {/* Right side buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Applications Button */}
        <button
          style={{
            background: "#e3f2fd",
            color: "#1976d2",
            border: "1px solid #1976d2",
            borderRadius: 6,
            padding: "6px 16px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            transition: "background 0.2s",
          }}
          onClick={() => setShowApplications(true)}
        >
          {applications}
        </button>

        {/* ✅ Conditionally show Preview Application Button */}
        {hasPreviewButton && (
          <button
            style={{
              background: "#ffffff",
              color: "#1976d2",
              border: "1px dashed #1976d2",
              borderRadius: 6,
              padding: "6px 16px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
            onClick={onPreviewClick}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#e3f2fd")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#ffffff")
            }
          >
            {preview}
          </button>
        )}

        {/* 🌍 Language Dropdown */}
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#f9f9f9",
            fontWeight: 500,
            cursor: "pointer",
            outline: "none",
            color: "#333",
          }}
        >
          <option value="en">English</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>
    </div>
  );
}
