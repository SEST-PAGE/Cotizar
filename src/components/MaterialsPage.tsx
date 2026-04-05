import { useState, useMemo } from "react";
import {
  PackageSearch, Plus, Pencil, Trash2, Search, RotateCcw, X, Check,
} from "lucide-react";
import {
  getMaterials, createMaterial, updateMaterial, deleteMaterial, resetMaterials,
} from "../db/database";
import { CATEGORIES, Material } from "../data/materials";
import { useAuth } from "../context/AuthContext";

const CATEGORY_ICONS: Record<string, string> = {
  "Conductores": "🔌",
  "Protecciones y Tableros": "⚡",
  "Cajas Eléctricas": "📦",
  "Canalizaciones": "🔧",
  "Mecanismos": "🔲",
  "Iluminación": "💡",
  "Accesorios Generales": "🛠️",
  "Herramientas Necesarias": "🔨",
};

export default function MaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>(getMaterials);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [editing, setEditing] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Material, "id">>({
    category: CATEGORIES[0],
    name: "",
    unit: "pieza",
    price: 0,
    description: "",
  });

  const refresh = () => setMaterials(getMaterials());

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchCat = activeCat === "all" || m.category === activeCat;
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [materials, search, activeCat]);

  const grouped = useMemo(() => {
    const map: Record<string, Material[]> = {};
    filtered.forEach((m) => {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    });
    return map;
  }, [filtered]);

  const openAdd = () => {
    setEditing(null);
    setForm({ category: CATEGORIES[0], name: "", unit: "pieza", price: 0, description: "" });
    setShowForm(true);
  };

  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({ category: m.category, name: m.name, unit: m.unit, price: m.price, description: m.description || "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateMaterial(editing.id, form);
    } else {
      createMaterial(form);
    }
    refresh();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteMaterial(id);
    refresh();
    setConfirm(null);
  };

  const handleReset = () => {
    resetMaterials();
    refresh();
    setConfirm(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Catálogo de Materiales</h2>
          <p className="text-slate-500 text-sm mt-0.5">{materials.length} materiales registrados</p>
        </div>
        {isAdmin && (
          <div className="sm:ml-auto flex gap-2">
            <button
              onClick={() => setConfirm("reset")}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Buscar material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCat("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeCat === "all" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                activeCat === cat ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="hidden sm:inline">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla agrupada */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <PackageSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron materiales.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, mats]) => (
            <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                <h3 className="font-semibold text-slate-800 text-sm">{cat}</h3>
                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {mats.length} ítem{mats.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-400 border-b border-slate-50">
                      <th className="px-5 py-2.5">Material</th>
                      <th className="px-3 py-2.5">Unidad</th>
                      <th className="px-3 py-2.5 text-right">Precio</th>
                      {isAdmin && <th className="px-3 py-2.5 text-center">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mats.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition group">
                        <td className="px-5 py-2.5 text-slate-700 font-medium">{m.name}</td>
                        <td className="px-3 py-2.5 text-slate-500">{m.unit}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                          ${m.price.toFixed(2)}
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => openEdit(m)}
                                className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-500 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirm(m.id)}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">{editing ? "Editar material" : "Nuevo material"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre del material</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Cable THW #14 AWG"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Unidad</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="metro, pieza..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Precio ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción (opcional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación borrar/reset */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">
              {confirm === "reset" ? "¿Restaurar materiales?" : "¿Eliminar material?"}
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              {confirm === "reset"
                ? "Se restaurarán todos los materiales predeterminados. Los materiales personalizados se perderán."
                : "Esta acción no se puede deshacer."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => (confirm === "reset" ? handleReset() : handleDelete(confirm))}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
