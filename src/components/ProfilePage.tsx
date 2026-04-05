import { useState } from "react";
import { User, Building2, Phone, Mail, Lock, Save, CheckCircle } from "lucide-react";
import { updateUser } from "../db/database";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    company: user?.company || "",
    phone: user?.phone || "",
    password: "",
    newPassword: "",
  });

  const handleSave = () => {
    if (!user) return;
    const updates: any = {
      name: form.name,
      company: form.company,
      phone: form.phone,
    };
    if (form.newPassword) {
      if (form.password !== user.password) {
        alert("La contraseña actual es incorrecta.");
        return;
      }
      updates.password = form.newPassword;
    }
    updateUser(user.id, updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Mi Perfil</h2>
        <p className="text-slate-500 text-sm mt-0.5">Administra tu información de cuenta.</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
            <span className="text-white font-bold text-2xl">{user?.name?.charAt(0)}</span>
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{user?.name}</p>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                user?.role === "admin"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {user?.role === "admin" ? "⚡ Administrador" : "👤 Usuario"}
            </span>
          </div>
        </div>
      </div>

      {/* Información */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" /> Información personal
        </h3>
        <div className="space-y-4">
          <FormField label="Nombre completo" icon={<User className="w-4 h-4" />}>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </FormField>
          <FormField label="Empresa / Taller" icon={<Building2 className="w-4 h-4" />}>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="input"
            />
          </FormField>
          <FormField label="Teléfono" icon={<Phone className="w-4 h-4" />}>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input"
            />
          </FormField>
          <FormField label="Correo electrónico" icon={<Mail className="w-4 h-4" />}>
            <input
              value={user?.email}
              disabled
              className="input opacity-60 cursor-not-allowed"
            />
          </FormField>
        </div>
      </div>

      {/* Contraseña */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-orange-500" /> Cambiar contraseña
        </h3>
        <div className="space-y-4">
          <FormField label="Contraseña actual" icon={<Lock className="w-4 h-4" />}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input"
            />
          </FormField>
          <FormField label="Nueva contraseña" icon={<Lock className="w-4 h-4" />}>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              placeholder="••••••••"
              className="input"
            />
          </FormField>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
          saved
            ? "bg-green-500 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {saved ? (
          <>
            <CheckCircle className="w-4 h-4" /> ¡Guardado correctamente!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Guardar cambios
          </>
        )}
      </button>
    </div>
  );
}

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
