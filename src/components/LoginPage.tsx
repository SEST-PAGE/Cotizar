import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Zap, Mail, Lock, User, Building2, Phone, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name || !form.company || !form.phone) throw new Error("Completa todos los campos.");
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          company: form.company,
          phone: form.phone,
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ElectroQuote</h1>
          <p className="text-orange-200/70 mt-1 text-sm">Sistema de Cotizaciones Eléctricas</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-orange-500 text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "register"
                  ? "bg-orange-500 text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
                    required
                  />
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Empresa / Taller"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
                    required
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Contraseña"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder-white/40 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 mt-2"
            >
              {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-white/40 text-xs mt-4">
              Demo: <span className="text-orange-300">admin@electroquote.com</span> / <span className="text-orange-300">admin123</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
