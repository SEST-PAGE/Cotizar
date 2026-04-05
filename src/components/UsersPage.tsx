import { useState } from "react";
import { Plus, Trash2, Shield, User, X, Check } from "lucide-react";
import { getUsers, createUser, deleteUser, updateUser, User as UserType } from "../db/database";
import { useAuth } from "../context/AuthContext";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>(getUsers);
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
  });

  const refresh = () => setUsers(getUsers());

  const handleCreate = () => {
    setError("");
    try {
      if (!form.name || !form.email || !form.password || !form.company || !form.phone) {
        setError("Completa todos los campos.");
        return;
      }
      createUser(form);
      refresh();
      setShowForm(false);
      setForm({ name: "", email: "", password: "", company: "", phone: "" });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    refresh();
    setConfirmDel(null);
  };

  const toggleRole = (u: UserType) => {
    updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" });
    refresh();
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Acceso restringido a administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Usuarios</h2>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition"
        >
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3">Usuario</th>
              <th className="px-3 py-3 hidden md:table-cell">Empresa</th>
              <th className="px-3 py-3 hidden sm:table-cell">Teléfono</th>
              <th className="px-3 py-3">Rol</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                      <span className="text-orange-500 font-bold text-sm">{u.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{u.name}</p>
                      <p className="text-slate-400 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-600 hidden md:table-cell">{u.company}</td>
                <td className="px-3 py-3 text-slate-600 hidden sm:table-cell">{u.phone}</td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => u.id !== currentUser?.id && toggleRole(u)}
                    disabled={u.id === currentUser?.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      u.role === "admin"
                        ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } ${u.id === currentUser?.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {u.role === "admin" ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    {u.role === "admin" ? "Admin" : "Usuario"}
                  </button>
                </td>
                <td className="px-3 py-3">
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => setConfirmDel(u.id)}
                      className="p-1.5 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">Nuevo usuario</h3>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: "name", label: "Nombre completo", type: "text", ph: "Juan Pérez" },
                { key: "email", label: "Correo electrónico", type: "email", ph: "correo@ejemplo.com" },
                { key: "password", label: "Contraseña", type: "password", ph: "••••••••" },
                { key: "company", label: "Empresa", type: "text", ph: "Empresa Eléctrica S.A." },
                { key: "phone", label: "Teléfono", type: "tel", ph: "555-0000" },
              ].map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
                  <input
                    type={type}
                    placeholder={ph}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              ))}
              {error && (
                <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrar */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">¿Eliminar usuario?</h3>
            <p className="text-slate-500 text-sm mb-5">Esta acción eliminará al usuario y no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDel)} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm transition">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
