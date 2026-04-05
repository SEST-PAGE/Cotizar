import { Zap, LayoutDashboard, FileText, PackageSearch, Users, Settings, LogOut, ChevronRight, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Page = "dashboard" | "quotes" | "new-quote" | "materials" | "users" | "profile";

interface Props {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  open: boolean;
  onClose: () => void;
}

const MENU = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "quotes", label: "Cotizaciones", icon: FileText },
  { id: "new-quote", label: "Nueva Cotización", icon: FileText },
  { id: "materials", label: "Materiales", icon: PackageSearch },
] as const;

const ADMIN_MENU = [{ id: "users", label: "Usuarios", icon: Users }] as const;

export default function Sidebar({ currentPage, onNavigate, open, onClose }: Props) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/5 z-40 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ElectroQuote</p>
            <p className="text-white/40 text-xs">v1.0</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Principal</p>
          {MENU.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id as Page); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                currentPage === id
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {currentPage === id && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}

          {user?.role === "admin" && (
            <>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-2 mt-4 mb-2">Administración</p>
              {ADMIN_MENU.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { onNavigate(id as Page); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    currentPage === id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Usuario */}
        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => { onNavigate("profile"); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 ${
              currentPage === "profile" ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-white/30" />
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
