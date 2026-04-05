import { useState, useMemo } from "react";
import {
  FileText, Search, Trash2, Download, CheckCircle,
  XCircle, Edit3, Send,
} from "lucide-react";
import {
  getQuotes, getQuotesByUser, deleteQuote, updateQuote, getQuoteById, getUserById, Quote,
} from "../db/database";
import { useAuth } from "../context/AuthContext";
import { generateQuotePDF } from "../utils/pdf";

const STATUS_COLORS: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-600",
  enviada: "bg-blue-100 text-blue-700",
  aprobada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-600",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  borrador: <Edit3 className="w-3 h-3" />,
  enviada: <Send className="w-3 h-3" />,
  aprobada: <CheckCircle className="w-3 h-3" />,
  rechazada: <XCircle className="w-3 h-3" />,
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

export default function QuotesPage({ onNew }: { onNew: () => void }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>(() =>
    user?.role === "admin" ? getQuotes() : getQuotesByUser(user!.id)
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Quote | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const refresh = () => {
    setQuotes(user?.role === "admin" ? getQuotes() : getQuotesByUser(user!.id));
  };

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const matchStatus = filterStatus === "all" || q.status === filterStatus;
      const matchSearch =
        q.clientName.toLowerCase().includes(search.toLowerCase()) ||
        q.projectName.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [quotes, search, filterStatus]);

  const handleDelete = (id: string) => {
    deleteQuote(id);
    refresh();
    setConfirmDel(null);
    if (selected?.id === id) setSelected(null);
  };

  const handleStatusChange = (id: string, status: Quote["status"]) => {
    updateQuote(id, { status });
    refresh();
    if (selected?.id === id) setSelected(getQuoteById(id) || null);
  };

  const handlePDF = (q: Quote) => {
    const issuer = getUserById(q.userId);
    if (issuer) generateQuotePDF(q, issuer);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Lista */}
      <div className={`flex flex-col ${selected ? "hidden lg:flex lg:w-80 xl:w-96" : "w-full"} border-r border-slate-100`}>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Cotizaciones</h2>
            <button
              onClick={onNew}
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl transition"
            >
              + Nueva
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all", "borrador", "enviada", "aprobada", "rechazada"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  filterStatus === s ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "Todas" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay cotizaciones.</p>
              <button onClick={onNew} className="mt-2 text-orange-500 text-sm hover:underline">
                Crear una ahora
              </button>
            </div>
          ) : (
            filtered.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelected(q)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition ${
                  selected?.id === q.id ? "bg-orange-50 border-r-2 border-r-orange-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 text-sm truncate">{q.projectName}</p>
                      <span
                        className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status]}`}
                      >
                        {STATUS_ICONS[q.status]}
                        {STATUS_LABELS[q.status]}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{q.clientName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">{formatDate(q.createdAt)}</span>
                      <span className="text-sm font-bold text-orange-500">{formatCurrency(q.total)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detalle */}
      {selected && (
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
            <button
              onClick={() => setSelected(null)}
              className="lg:hidden text-slate-500 hover:text-slate-700 p-1"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate">{selected.projectName}</p>
              <p className="text-slate-500 text-xs">{selected.clientName} · COT-{selected.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selected.status}
                onChange={(e) => handleStatusChange(selected.id, e.target.value as Quote["status"])}
                className={`text-xs font-medium px-2 py-1.5 rounded-xl border-0 focus:ring-2 focus:ring-orange-400 focus:outline-none cursor-pointer ${STATUS_COLORS[selected.status]}`}
              >
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>
              <button
                onClick={() => handlePDF(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                onClick={() => setConfirmDel(selected.id)}
                className="p-1.5 hover:bg-red-100 text-red-500 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Cliente", value: selected.clientName },
                { label: "Teléfono", value: selected.clientPhone || "—" },
                { label: "Correo", value: selected.clientEmail || "—" },
                { label: "Validez", value: `${selected.validityDays} días` },
                { label: "Fecha", value: formatDate(selected.createdAt) },
                { label: "Dirección", value: selected.clientAddress || "—" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="font-medium text-slate-800 text-sm mt-0.5 break-words">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Materiales agrupados */}
            {Array.from(new Set(selected.items.map((i) => i.category))).map((cat) => {
              const catItems = selected.items.filter((i) => i.category === cat);
              return (
                <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-orange-50 px-4 py-2 border-b border-orange-100">
                    <span className="font-semibold text-slate-800 text-sm">
                      {CATEGORY_ICONS[cat] || "📌"} {cat}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs font-semibold text-slate-400 border-b border-slate-50">
                          <th className="px-4 py-2 text-left">Material</th>
                          <th className="px-2 py-2 text-center">Cant.</th>
                          <th className="px-2 py-2 text-right">P.U.</th>
                          <th className="px-2 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {catItems.map((i) => (
                          <tr key={i.materialId} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-700">{i.materialName}</td>
                            <td className="px-2 py-2 text-center text-slate-500">{i.quantity} {i.unit}</td>
                            <td className="px-2 py-2 text-right text-slate-600">{formatCurrency(i.unitPrice)}</td>
                            <td className="px-2 py-2 text-right font-semibold text-slate-800">
                              {formatCurrency(i.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Mano de obra */}
            {selected.laborCost > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex justify-between">
                <span className="font-medium text-slate-700">🔨 Mano de obra</span>
                <span className="font-bold text-slate-800">{formatCurrency(selected.laborCost)}</span>
              </div>
            )}

            {/* Totales */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selected.subtotal)}</span>
                </div>
                {selected.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({selected.discountPercent}%)</span>
                    <span>- {formatCurrency(selected.discountAmount)}</span>
                  </div>
                )}
                {selected.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({selected.taxPercent}%)</span>
                    <span>{formatCurrency(selected.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-100 pt-2">
                  <span>TOTAL</span>
                  <span className="text-orange-500">{formatCurrency(selected.total)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            {selected.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 mb-1">📝 Notas</p>
                <p className="text-sm text-amber-800">{selected.notes}</p>
              </div>
            )}
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
            <h3 className="font-bold text-slate-800 mb-2">¿Eliminar cotización?</h3>
            <p className="text-slate-500 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
