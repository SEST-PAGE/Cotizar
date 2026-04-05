import { useMemo } from "react";
import { FileText, DollarSign, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { getQuotes, getQuotesByUser } from "../db/database";
import { useAuth } from "../context/AuthContext";

type Page = "dashboard" | "quotes" | "new-quote" | "materials" | "users" | "profile";

interface Props {
  onNavigate: (p: Page) => void;
}

const STATUS_COLORS: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-600",
  enviada: "bg-blue-100 text-blue-700",
  aprobada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

function formatCurrency(n: number) {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function Dashboard({ onNavigate }: Props) {
  const { user } = useAuth();

  const quotes = useMemo(() => {
    if (!user) return [];
    return user.role === "admin" ? getQuotes() : getQuotesByUser(user.id);
  }, [user]);

  const stats = useMemo(() => {
    const total = quotes.length;
    const aprobadas = quotes.filter((q) => q.status === "aprobada").length;
    const pendientes = quotes.filter((q) => q.status === "enviada").length;
    const montoTotal = quotes.reduce((s, q) => s + q.total, 0);
    const montoAprobado = quotes.filter((q) => q.status === "aprobada").reduce((s, q) => s + q.total, 0);
    return { total, aprobadas, pendientes, montoTotal, montoAprobado };
  }, [quotes]);

  const recent = useMemo(() => [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [quotes]);

  return (
    <div className="p-6 space-y-6">
      {/* Saludo */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          ¡Hola, {user?.name?.split(" ")[0]}! 👋
        </h2>
        <p className="text-slate-500 mt-1">Aquí está el resumen de tus cotizaciones eléctricas.</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Cotizaciones"
          value={stats.total.toString()}
          color="orange"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Aprobadas"
          value={stats.aprobadas.toString()}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pendientes"
          value={stats.pendientes.toString()}
          color="blue"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Monto Total"
          value={formatCurrency(stats.montoTotal)}
          color="purple"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
          <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="font-bold text-lg mb-1">Nueva Cotización</h3>
          <p className="text-orange-100 text-sm mb-4">Crea una cotización eléctrica profesional en minutos.</p>
          <button
            onClick={() => onNavigate("new-quote")}
            className="bg-white text-orange-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-orange-50 transition"
          >
            Crear ahora →
          </button>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
          <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
          <h3 className="font-bold text-lg mb-1">Monto Aprobado</h3>
          <p className="text-slate-400 text-sm mb-2">Total en cotizaciones aprobadas</p>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(stats.montoAprobado)}</p>
        </div>
      </div>

      {/* Cotizaciones recientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Cotizaciones recientes</h3>
          <button
            onClick={() => onNavigate("quotes")}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Ver todas →
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay cotizaciones aún.</p>
            <button
              onClick={() => onNavigate("new-quote")}
              className="mt-3 text-orange-500 font-medium hover:underline text-sm"
            >
              Crear primera cotización
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((q) => (
              <div key={q.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{q.projectName}</p>
                  <p className="text-slate-400 text-xs truncate">{q.clientName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-slate-800 text-sm">{formatCurrency(q.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status]}`}>
                    {STATUS_LABELS[q.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "orange" | "green" | "blue" | "purple";
}) {
  const colors = {
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-slate-500 text-xs font-medium">{label}</p>
      <p className="text-slate-800 text-xl font-bold mt-0.5 truncate">{value}</p>
    </div>
  );
}
