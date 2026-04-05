import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { initDB } from "./db/database";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import MaterialsPage from "./components/MaterialsPage";
import NewQuotePage from "./components/NewQuotePage";
import QuotesPage from "./components/QuotesPage";
import UsersPage from "./components/UsersPage";
import ProfilePage from "./components/ProfilePage";
import { Menu } from "lucide-react";

// Inicializar BD al cargar
initDB();

type Page = "dashboard" | "quotes" | "new-quote" | "materials" | "users" | "profile";

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  quotes: "Cotizaciones",
  "new-quote": "Nueva Cotización",
  materials: "Catálogo de Materiales",
  users: "Usuarios",
  profile: "Mi Perfil",
};

function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = `ElectroQuote – ${PAGE_TITLES[page]}`;
  }, [page]);

  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
              {PAGE_TITLES[page]}
            </h1>
            <p className="text-slate-400 text-xs hidden sm:block">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {page !== "new-quote" && (
            <button
              onClick={() => setPage("new-quote")}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-orange-200"
            >
              <span className="hidden sm:inline">+ Nueva Cotización</span>
              <span className="sm:hidden">+</span>
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && <Dashboard onNavigate={setPage} />}
          {page === "quotes" && <QuotesPage onNew={() => setPage("new-quote")} />}
          {page === "new-quote" && (
            <NewQuotePage onDone={() => setPage("quotes")} />
          )}
          {page === "materials" && <MaterialsPage />}
          {page === "users" && <UsersPage />}
          {page === "profile" && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
