import React, { useEffect, useState } from "react";

export default function SchemesPanel({ applyForScheme, viewSchemeDetails }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch all schemes from backend with stats
  useEffect(() => {
    fetchSchemesWithStats();
  }, []);

  async function fetchSchemesWithStats() {
    try {
      const res = await fetch("http://localhost:5000/api/all-schemes-with-stats");
      const data = await res.json();
      setSchemes(data.schemes || []);
    } catch (e) {
      console.error("Failed to load schemes:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1.2, padding: 24, textAlign: "center", color: "#888" }}>
        Loading schemes...
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1.2,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 20,
        padding: 24,
      }}
    >
      {schemes.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", gridColumn: "1/-1" }}>
          No schemes available
        </p>
      ) : (
        schemes.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 8px", color: "#1976d2" }}>{s.name}</h3>
              <p style={{ color: "#555", fontSize: 14, marginBottom: 12 }}>
                {s.description}
              </p>

              <div
                style={{
                  background: "#e3f2fd",
                  borderRadius: 6,
                  padding: "8px 12px",
                  marginBottom: 8,
                }}
              >
                <strong>Total Applications:</strong> {s.total_applications}
              </div>

              <div style={{ marginTop: 8 }}>
  <div style={{ fontSize: 13, marginBottom: 4 }}>
    Applied: {s.applied_percentage}%
  </div>
  <div
    style={{
      background: "#e0e0e0",
      borderRadius: 6,
      height: 8,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${s.applied_percentage}%`,
        height: "100%",
        background: "#4caf50",
      }}
    ></div>
  </div>
</div>

            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => viewSchemeDetails(s.name)}
                style={{
                  flex: 1,
                  background: "#fff",
                  color: "#1976d2",
                  border: "1px solid #1976d2",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Details
              </button>
              <button
                onClick={() => applyForScheme(s)}
                style={{
                  flex: 1,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
