import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // scheme object if editing
  const [form, setForm] = useState({
    name: "",
    type: "govt_scheme",
    description: "",
    eligibility_json: "{\"questions\":[],\"rules\":[]}",
    form_template_json: "{\"fields\":[]}",
    is_active: true,
  });
  const [jsonErrors, setJsonErrors] = useState({ eligibility: null, template: null });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/items?include_inactive=true");
      setItems(res.data.items || res.data);
    } catch (e) {
      console.error(e);
      setMsg("Failed to fetch items. See console.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      type: "govt_scheme",
      description: "",
      eligibility_json: "{\"questions\":[],\"rules\":[]}",
      form_template_json: "{\"fields\":[]}",
      is_active: true,
    });
    setJsonErrors({ eligibility: null, template: null });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || "",
      type: item.type || "govt_scheme",
      description: item.description || "",
      eligibility_json: JSON.stringify(item.eligibility_json || { questions: [], rules: [] }, null, 2),
      form_template_json: JSON.stringify(item.form_template_json || { fields: [] }, null, 2),
      is_active: item.is_active ?? true,
    });
    setJsonErrors({ eligibility: null, template: null });
    setShowModal(true);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((s) => ({ ...s, [name]: checked }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  }

  function validateJsons() {
    let ok = true;
    setJsonErrors({ eligibility: null, template: null });
    try {
      JSON.parse(form.eligibility_json);
    } catch (e) {
      setJsonErrors((s) => ({ ...s, eligibility: e.message }));
      ok = false;
    }
    try {
      JSON.parse(form.form_template_json);
    } catch (e) {
      setJsonErrors((s) => ({ ...s, template: e.message }));
      ok = false;
    }
    return ok;
  }

  async function submit() {
    if (!form.name) {
      setMsg("Name is required.");
      return;
    }
    if (!validateJsons()) return;

    const payload = {
      name: form.name,
      type: form.type,
      description: form.description,
      eligibility_json: JSON.parse(form.eligibility_json),
      form_template_json: JSON.parse(form.form_template_json),
      is_active: !!form.is_active,
    };

    try {
      if (editing) {
        const res = await api.put(`/api/admin/items/${editing.id}`, payload);
        setMsg("Updated successfully");
      } else {
        const res = await api.post("/api/admin/items", payload);
        setMsg("Created successfully");
      }
      setShowModal(false);
      await fetchItems();
    } catch (e) {
      console.error(e);
      setMsg("Failed to save. See console for details.");
    }
  }

  async function doDelete(item) {
    if (!confirm(`Delete (soft) ${item.name}?`)) return;
    try {
      await api.delete(`/api/admin/items/${item.id}`);
      setMsg("Deleted");
      fetchItems();
    } catch (e) {
      console.error(e);
      setMsg("Delete failed");
    }
  }

  async function doRestore(item) {
    try {
      await api.post(`/api/admin/items/${item.id}/restore`);
      setMsg("Restored");
      fetchItems();
    } catch (e) {
      console.error(e);
      setMsg("Restore failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Manage Schemes & Bank Forms</h2>
        <div className="space-x-2">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={openCreate}
          >
            + Create Item
          </button>
          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={fetchItems}
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-gray-700">
          {msg} <button className="ml-3 text-xs text-blue-600" onClick={() => setMsg(null)}>dismiss</button>
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {items.length === 0 && <div className="text-sm text-gray-500">No items yet</div>}
          {items.map((it) => (
            <div key={it.id} className="p-4 bg-white rounded shadow-sm flex items-start justify-between">
              <div>
                <div className="font-semibold">{it.name} <span className="text-xs text-gray-500">({it.type})</span></div>
                <div className="text-sm text-gray-600 mt-1">{it.description}</div>
                <div className="mt-2 text-xs text-gray-500">Active: {it.is_active ? "Yes" : "No"} | id: {it.id}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(it)} className="px-2 py-1 bg-yellow-400 rounded text-white">Edit</button>
                {it.is_active ? (
                  <button onClick={() => doDelete(it)} className="px-2 py-1 bg-red-500 rounded text-white">Delete</button>
                ) : (
                  <button onClick={() => doRestore(it)} className="px-2 py-1 bg-green-600 rounded text-white">Restore</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <div className="relative z-50 bg-white max-w-3xl w-full rounded shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3">{editing ? "Edit Item" : "Create Item"}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Name</label>
                <input name="name" value={form.name} onChange={handleFormChange}
                  className="w-full border p-2 rounded mt-1" />
              </div>

              <div>
                <label className="block text-sm">Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} className="w-full border p-2 rounded mt-1">
                  <option value="govt_scheme">govt_scheme</option>
                  <option value="bank_form">bank_form</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange}
                  className="w-full border p-2 rounded mt-1" rows="2" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm">Eligibility JSON</label>
                <textarea name="eligibility_json" value={form.eligibility_json} onChange={handleFormChange}
                  className="w-full border p-2 rounded mt-1 font-mono text-xs" rows="8" />
                {jsonErrors.eligibility && <div className="text-red-600 text-xs mt-1">JSON error: {jsonErrors.eligibility}</div>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm">Form Template JSON</label>
                <textarea name="form_template_json" value={form.form_template_json} onChange={handleFormChange}
                  className="w-full border p-2 rounded mt-1 font-mono text-xs" rows="8" />
                {jsonErrors.template && <div className="text-red-600 text-xs mt-1">JSON error: {jsonErrors.template}</div>}
              </div>

              <div className="flex items-center gap-2">
                <input id="is_active" type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit}>{editing ? "Save" : "Create"}</button>
            </div>

            {/* Preview parsed JSON */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Preview</h4>
              <div className="bg-gray-50 p-3 rounded text-xs">
                <div className="font-semibold">Eligibility</div>
                <pre className="whitespace-pre-wrap">{form.eligibility_json}</pre>
                <div className="font-semibold mt-2">Form Template</div>
                <pre className="whitespace-pre-wrap">{form.form_template_json}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
