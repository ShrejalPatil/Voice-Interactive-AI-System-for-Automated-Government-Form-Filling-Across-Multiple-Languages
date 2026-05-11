import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import AdminPage from "./pages/AdminPage"; // ⬅️ We’ll create this next

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* 👩‍💻 Citizen Chat Interface */}
        <Route path="/" element={<App />} />

        {/* 🧑‍💼 Admin Dashboard */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
