import React from "react";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto py-4 px-6">
          <h1 className="text-xl font-semibold">Sakhi — Admin Panel (No Auth)</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <AdminPanel />
      </main>
    </div>
  );
}
