import { useState, useMemo } from "react";
import {
  Search, Plus, Minus, Trash2,
  Save, Send, FileText, User, Briefcase, Calculator,
} from "lucide-react";
import { getMaterials, createQuote, QuoteItem } from "../db/database";
import { CATEGORIES } from "../data/materials";
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

function formatCurrency(n: number) {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

type Step = "client" | "materials" | "summary";

export default function NewQuotePage({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const allMaterials = useMemo(() => getMaterials(), []);
  const [step, setStep] = useState<Step>("client");

  // Client info
  const [client, setClient] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    projectName: "",
    projectDescription: "",
    validityDays: 30,
    notes: "",
  });

  // Items
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>(CATEGORIES[0]);


  // Financial
  const [laborCost, setLaborCost] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(16);
  const [status, setStatus] = useState<"borrador" | "enviada">("borrador");

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((m) => {
      const matchCat = m.category === activeCat;
      const matchSearch = search
        ? m.name.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchCat && matchSearch;
    });
  }, [allMaterials, activeCat, search]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    return allMaterials.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);
  }, [allMaterials, search]);

  const totals = useMemo(() => {
    const matSubtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const subtotal = matSubtotal + laborCost;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * taxPercent) / 100;
    const total = taxable + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  }, [items, laborCost, discountPercent, taxPercent]);

  const addItem = (matId: string) => {
    const mat = allMaterials.find((m) => m.id === matId);
    if (!mat) return;
    const existing = items.find((i) => i.materialId === matId);
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.materialId === matId
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          materialId: mat.id,
          materialName: mat.name,
          category: mat.category,
          unit: mat.unit,
          quantity: 1,
          unitPrice: mat.price,
          subtotal: mat.price,
          notes: "",
        },
      ]);
    }
  };

  const updateQty = (matId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.materialId !== matId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.materialId === matId
            ? { ...i, quantity: qty, subtotal: qty * i.unitPrice }
            : i
        )
      );
    }
  };

  const updatePrice = (matId: string, price: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.materialId === matId
          ? { ...i, unitPrice: price, subtotal: i.quantity * price }
          : i
      )
    );
  };

  const getQty = (matId: string) => items.find((i) => i.materialId === matId)?.quantity || 0;

  const handleSave = () => {
    if (!client.clientName || !client.projectName) {
      alert("Completa el nombre del cliente y del proyecto.");
      return;
    }
    createQuote({
      userId: user!.id,
      ...client,
      items,
      laborCost,
      discountPercent,
      taxPercent,
      ...totals,
      status,
    });
    onDone();
  };

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "client", label: "Cliente", icon: <User className="w-4 h-4" /> },
    { id: "materials", label: "Materiales", icon: <Briefcase className="w-4 h-4" /> },
    { id: "summary", label: "Resumen", icon: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Steps */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Nueva Cotización</h2>
        <div className="flex gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                step === s.id
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => { setStatus("borrador"); handleSave(); }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition"
            >
              <Save className="w-4 h-4" /> Borrador
            </button>
            <button
              onClick={() => { setStatus("enviada"); handleSave(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* STEP 1: CLIENTE */}
        {step === "client" && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" /> Datos del cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre del cliente *" required>
                  <input
                    value={client.clientName}
                    onChange={(e) => setClient((c) => ({ ...c, clientName: e.target.value }))}
                    placeholder="Juan Pérez"
                    className="input"
                  />
                </Field>
                <Field label="Correo electrónico">
                  <input
                    type="email"
                    value={client.clientEmail}
                    onChange={(e) => setClient((c) => ({ ...c, clientEmail: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="input"
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    value={client.clientPhone}
                    onChange={(e) => setClient((c) => ({ ...c, clientPhone: e.target.value }))}
                    placeholder="555-0000"
                    className="input"
                  />
                </Field>
                <Field label="Dirección">
                  <input
                    value={client.clientAddress}
                    onChange={(e) => setClient((c) => ({ ...c, clientAddress: e.target.value }))}
                    placeholder="Calle, Ciudad, País"
                    className="input"
                  />
                </Field>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" /> Datos del proyecto
              </h3>
              <div className="space-y-4">
                <Field label="Nombre del proyecto *" required>
                  <input
                    value={client.projectName}
                    onChange={(e) => setClient((c) => ({ ...c, projectName: e.target.value }))}
                    placeholder="Instalación eléctrica residencial"
                    className="input"
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    value={client.projectDescription}
                    onChange={(e) => setClient((c) => ({ ...c, projectDescription: e.target.value }))}
                    rows={3}
                    placeholder="Detalles del alcance del proyecto..."
                    className="input resize-none"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Validez (días)">
                    <input
                      type="number"
                      min={1}
                      value={client.validityDays}
                      onChange={(e) => setClient((c) => ({ ...c, validityDays: parseInt(e.target.value) || 30 }))}
                      className="input"
                    />
                  </Field>
                </div>
                <Field label="Notas / Condiciones">
                  <textarea
                    value={client.notes}
                    onChange={(e) => setClient((c) => ({ ...c, notes: e.target.value }))}
                    rows={3}
                    placeholder="Garantías, formas de pago, condiciones especiales..."
                    className="input resize-none"
                  />
                </Field>
              </div>
            </div>

            <button
              onClick={() => setStep("materials")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Continuar → Agregar materiales
            </button>
          </div>
        )}

        {/* STEP 2: MATERIALES */}
        {step === "materials" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Catálogo */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Buscar material en todo el catálogo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Resultados de búsqueda global */}
                {search && searchResults.length > 0 && (
                  <div className="border border-slate-100 rounded-xl overflow-hidden mb-3">
                    <p className="text-xs font-semibold text-slate-400 px-4 py-2 bg-slate-50">
                      Resultados de búsqueda
                    </p>
                    {searchResults.map((m) => (
                      <MaterialRow key={m.id} mat={m} qty={getQty(m.id)} onAdd={addItem} onUpdateQty={updateQty} />
                    ))}
                  </div>
                )}

                {/* Categorías */}
                {!search && (
                  <div className="flex gap-1.5 flex-wrap">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                          activeCat === cat
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {CATEGORY_ICONS[cat]}
                        <span className="hidden sm:inline">{cat}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!search && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      {CATEGORY_ICONS[activeCat]} {activeCat}
                    </span>
                    <span className="text-xs text-slate-400">{filteredMaterials.length} materiales</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[450px] overflow-y-auto">
                    {filteredMaterials.map((m) => (
                      <MaterialRow key={m.id} mat={m} qty={getQty(m.id)} onAdd={addItem} onUpdateQty={updateQty} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lista seleccionada */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm sticky top-0">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Materiales seleccionados
                  </h3>
                  <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Agrega materiales del catálogo</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.materialId} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 leading-tight">{item.materialName}</p>
                            <p className="text-xs text-slate-400">{item.unit}</p>
                          </div>
                          <button
                            onClick={() => updateQty(item.materialId, 0)}
                            className="text-red-400 hover:text-red-600 transition flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 border border-slate-200 rounded-lg">
                            <button
                              onClick={() => updateQty(item.materialId, item.quantity - 1)}
                              className="p-1 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Minus className="w-3 h-3 text-slate-600" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateQty(item.materialId, parseFloat(e.target.value) || 1)}
                              className="w-12 text-center text-xs font-semibold text-slate-800 border-none outline-none bg-transparent"
                            />
                            <button
                              onClick={() => updateQty(item.materialId, item.quantity + 1)}
                              className="p-1 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Plus className="w-3 h-3 text-slate-600" />
                            </button>
                          </div>
                          <span className="text-xs text-slate-400">×</span>
                          <div className="flex items-center border border-slate-200 rounded-lg px-2 py-1">
                            <span className="text-xs text-slate-400">$</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(item.materialId, parseFloat(e.target.value) || 0)}
                              className="w-16 text-xs font-medium text-slate-700 border-none outline-none bg-transparent"
                            />
                          </div>
                          <span className="ml-auto text-xs font-bold text-slate-800 flex-shrink-0">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 rounded-b-2xl">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Subtotal materiales</span>
                    <span>{formatCurrency(items.reduce((s, i) => s + i.subtotal, 0))}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-slate-500 flex-1">Mano de obra ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={laborCost}
                      onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep("summary")}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-3 rounded-b-2xl transition"
                >
                  Ver resumen →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RESUMEN */}
        {step === "summary" && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">📋 Resumen del proyecto</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Cliente</span>
                  <p className="font-medium text-slate-800">{client.clientName || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Proyecto</span>
                  <p className="font-medium text-slate-800">{client.projectName || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Teléfono</span>
                  <p className="font-medium text-slate-800">{client.clientPhone || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Validez</span>
                  <p className="font-medium text-slate-800">{client.validityDays} días</p>
                </div>
              </div>
            </div>

            {/* Items agrupados */}
            {CATEGORIES.filter((c) => items.some((i) => i.category === c)).map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              return (
                <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-orange-50 px-5 py-2.5 border-b border-orange-100">
                    <span className="font-semibold text-slate-800 text-sm">
                      {CATEGORY_ICONS[cat]} {cat}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-slate-400 border-b border-slate-50">
                        <th className="px-5 py-2 text-left">Material</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-right">Precio Unit.</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {catItems.map((i) => (
                        <tr key={i.materialId}>
                          <td className="px-5 py-2.5 text-slate-700">{i.materialName}</td>
                          <td className="px-3 py-2.5 text-center text-slate-500">
                            {i.quantity} {i.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{formatCurrency(i.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                            {formatCurrency(i.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Mano de obra */}
            {laborCost > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex justify-between items-center">
                <span className="font-medium text-slate-700">🔨 Mano de obra</span>
                <span className="font-bold text-slate-800">{formatCurrency(laborCost)}</span>
              </div>
            )}

            {/* Totales */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">💰 Totales y ajustes</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Descuento (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">IVA / Impuesto (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento ({discountPercent}%)</span>
                    <span>- {formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>IVA ({taxPercent}%)</span>
                    <span>{formatCurrency(totals.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
                  <span>TOTAL</span>
                  <span className="text-orange-500">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStatus("borrador"); handleSave(); }}
                className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar como borrador
              </button>
              <button
                onClick={() => { setStatus("enviada"); handleSave(); }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Enviar cotización
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function MaterialRow({
  mat,
  qty,
  onAdd,
  onUpdateQty,
}: {
  mat: { id: string; name: string; unit: string; price: number };
  qty: number;
  onAdd: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 font-medium leading-tight">{mat.name}</p>
        <p className="text-xs text-slate-400">{mat.unit} · ${mat.price.toFixed(2)}</p>
      </div>
      {qty === 0 ? (
        <button
          onClick={() => onAdd(mat.id)}
          className="flex-shrink-0 p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onUpdateQty(mat.id, qty - 1)}
            className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Minus className="w-3 h-3 text-slate-600" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-orange-500">{qty}</span>
          <button
            onClick={() => onUpdateQty(mat.id, qty + 1)}
            className="p-1 bg-orange-100 hover:bg-orange-200 rounded-lg transition text-orange-600"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
