import React, { useState } from "react";

export default function ApplicationsModal({ showApplications, setShowApplications }) {
  const [appId, setAppId] = useState("");
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");

  if (!showApplications) return null;

  const fetchApplicationById = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/get-applications");
      const data = await res.json();
      const found = data.applications.find((a) => a.application_id === appId);
      if (found) {
        setApplication(found);
        setError("");
      } else {
        setError("❌ No application found with this ID");
      }
    } catch {
      setError("⚠️ Server error. Please try again later.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.25)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          width: 600,
          boxShadow: "0 4px 32px #0002",
          position: "relative",
        }}
      >
        <button
          onClick={() => setShowApplications(false)}
          style={{
            position: "absolute",
            top: 18,
            right: 24,
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#888",
          }}
        >
          ×
        </button>

        <h2 style={{ marginTop: 0, color: "#1976d2" }}>🔎 Track Your Application</h2>

        <input
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="Enter your Application ID"
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <button
          onClick={fetchApplicationById}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

        {application && (
          <table
            style={{
              width: "100%",
              marginTop: 20,
              borderCollapse: "collapse",
              border: "1px solid #eee",
            }}
          >
            <tbody>
              <tr><th>Application ID</th><td>{application.application_id}</td></tr>
              <tr><th>Scheme Name</th><td>{application.scheme_name}</td></tr>
              <tr><th>Applicant Name</th><td>{application.applicant_name}</td></tr>
              <tr><th>Phone</th><td>{application.phone}</td></tr>
              <tr><th>Address</th><td>{application.address}</td></tr>
              <tr><th>Status</th><td>{application.status}</td></tr>
              {application.approved_date && (
                <tr>
                  <th>Approved On</th>
                  <td>{new Date(application.approved_date).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
