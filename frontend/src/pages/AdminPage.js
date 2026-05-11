import React, { useEffect, useState } from "react";

export default function AdminPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  // 🔹 Fetch all applications from backend
  async function fetchApplications() {
    try {
      const res = await fetch("http://localhost:5000/api/get-applications");
      const data = await res.json();
      setApplications(data.applications || []);
      setLoading(false);
    } catch (e) {
      console.error("Error loading applications:", e);
      setLoading(false);
    }
  }

  // 🔹 Update Application Status
  async function updateStatus(appId, status) {
    setStatusUpdating(true);
    try {
      const res = await fetch("http://localhost:5000/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Application ${appId} marked as ${status}`);
        fetchApplications();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 80, fontSize: 18 }}>
        Loading applications...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", background: "#f5f6fa", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center", color: "#1976d2" }}>🧑‍💼 Admin Dashboard</h2>

      {applications.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          No applications found.
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 30,
            background: "#fff",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <thead>
            <tr style={{ background: "#1976d2", color: "#fff" }}>
              <th style={{ padding: "10px" }}>Application ID</th>
              <th style={{ padding: "10px" }}>Scheme</th>
              <th style={{ padding: "10px" }}>Applicant</th>
              <th style={{ padding: "10px" }}>Phone</th>
              <th style={{ padding: "10px" }}>Address</th>
              <th style={{ padding: "10px" }}>Status</th>
              <th style={{ padding: "10px" }}>Submitted</th>
              <th style={{ padding: "10px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, i) => (
              <tr
                key={app.application_id}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#f9f9f9",
                  textAlign: "center",
                }}
              >
                <td>{app.application_id}</td>
                <td>{app.scheme_name}</td>
                <td>{app.applicant_name}</td>
                <td>{app.phone}</td>
                <td>{app.address}</td>
                <td
                  style={{
                    color:
                      app.status === "Approved"
                        ? "green"
                        : app.status === "Rejected"
                        ? "red"
                        : "orange",
                    fontWeight: 600,
                  }}
                >
                  {app.status}
                </td>
                <td>{new Date(app.timestamp).toLocaleString()}</td>
                <td>
                  {app.status === "Approved" ? (
                    <span style={{ color: "green", fontWeight: 600 }}>Approved</span>
                  ) : (
                    <button
                      onClick={() => updateStatus(app.application_id, "Approved")}
                      disabled={statusUpdating}
                      style={{
                        background: "#4caf50",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
