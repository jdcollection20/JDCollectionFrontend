import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import api from "../../lib/api";
import { cacheClearPrefix } from "../../lib/cache";
import { money } from "../../lib/utils";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 20;

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export default function Returns() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [returnAmount, setReturnAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ amount: 0, cost: 0, profitImpact: 0, returns: 0 });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  async function searchProducts(value = query) {
    setSearching(true);
    try {
      const q = String(value || "").trim();
      const url = `/products/admin/list?page=1&limit=30${q ? `&q=${encodeURIComponent(q)}` : ""}`;
      const r = await api.get(url);
      setResults(r.data?.items || []);
    } catch (e) {
      setInfo({ title: "Search failed", message: e.response?.data?.message || "Could not search products." });
    } finally { setSearching(false); }
  }

  async function loadHistory() {
    try {
      const r = await api.get(`/returns?page=${page}&limit=${PAGE_SIZE}`);
      setHistory(r.data?.items || []);
      setPagination(r.data?.pagination || { page, pages: 1, total: 0 });
      setSummary(r.data?.summary || { amount: 0, cost: 0, profitImpact: 0, returns: 0 });
    } catch (e) {
      setInfo({ title: "Could not load returns", message: e.response?.data?.message || "Please try again." });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => searchProducts(query), query.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => { loadHistory(); }, [page]);

  function chooseProduct(product) {
    setSelectedProduct(product);
    setColor("");
    setSize("");
    setQuantity(1);
  }

  const selectedPrice = selectedProduct
    ? Number(selectedProduct.discountedPrice ?? selectedProduct.sellingPrice ?? 0)
    : 0;

  function changeQuantity(next) {
    const value = Math.floor(Number(next));
    setQuantity(Number.isFinite(value) ? Math.max(1, value) : 1);
  }

  function addToCart() {
    if (!selectedProduct) return;
    if (selectedProduct.colors?.length && !color) {
      return setInfo({ title: "Color required", message: "Select a color before adding this item." });
    }
    if (selectedProduct.sizes?.length && !size) {
      return setInfo({ title: "Size required", message: "Select a size before adding this item." });
    }
    const qty = Math.floor(Number(quantity));
    if (!Number.isInteger(qty) || qty < 1) {
      return setInfo({ title: "Invalid quantity", message: "Return quantity must be at least 1." });
    }
    const key = `${selectedProduct._id}|${color}|${size}`;
    setCart(current => {
      const index = current.findIndex(x => x.key === key);
      if (index < 0) return [...current, {
        key, product: selectedProduct._id, name: selectedProduct.name, sku: selectedProduct.sku,
        color, size, quantity: qty, discountedPrice: selectedPrice,
        sellingPrice: Number(selectedProduct.sellingPrice ?? 0), purchasePrice: Number(selectedProduct.purchasePrice ?? 0)
      }];
      return current.map((x, i) => i === index ? { ...x, quantity: x.quantity + qty } : x);
    });
    setSelectedProduct(null);
    setColor(""); setSize(""); setQuantity(1);
  }

  function updateQty(key, next) {
    setCart(current => current.map(item => item.key === key
      ? { ...item, quantity: Math.max(1, Math.floor(Number(next) || 1)) }
      : item));
  }

  const calculatedAmount = useMemo(() => roundMoney(cart.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0)), [cart]);
  const totalCost = useMemo(() => roundMoney(cart.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0)), [cart]);

  useEffect(() => {
    setReturnAmount(cart.length ? String(calculatedAmount) : "");
  }, [cart.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function requestReturn() {
    if (!cart.length) return setInfo({ title: "Cart is empty", message: "Add at least one item to return." });
    const total = roundMoney(Number(returnAmount));
    if (!Number.isFinite(total) || total < 0 || total > calculatedAmount) {
      return setInfo({ title: "Invalid return amount", message: `Return amount must be between ${money(0)} and ${money(calculatedAmount)}.` });
    }
    setConfirmOpen(true);
  }

  async function submitReturn() {
    const total = roundMoney(Number(returnAmount));
    setSaving(true);
    try {
      const r = await api.post("/returns", {
        items: cart.map(item => ({ product: item.product, color: item.color, size: item.size, quantity: item.quantity })),
        returnAmount: total, customerName, customerPhone, reason, notes
      });
      setConfirmOpen(false);
      setInfo({ title: `Return ${r.data.returnNumber} recorded`, message: `Stock restored: ${cart.reduce((n, x) => n + x.quantity, 0)} item(s). Revenue reduced by ${money(r.data.returnAmount)} and net profit adjusted by ${money(r.data.profitImpact)}.` });
      setCart([]); setSelectedProduct(null); setReturnAmount(""); setCustomerName(""); setCustomerPhone(""); setReason(""); setNotes("");
      await Promise.all([cacheClearPrefix("products:"), cacheClearPrefix("product:"), cacheClearPrefix("dashboard:")]);
      await loadHistory();
    } catch (e) {
      setConfirmOpen(false);
      setInfo({ title: "Return failed", message: e.response?.data?.message || "Could not record the return." });
    } finally { setSaving(false); }
  }

  const additionalAdjustment = roundMoney(Math.max(0, calculatedAmount - Number(returnAmount || 0)));

  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-black">Return Items</h1><p className="mt-1 text-sm text-slate-500">Search sold products, add returned quantities, restore stock and reverse the return amount from revenue and profit.</p></div>
      <div className="badge"><RotateCcw size={15}/> {summary.returns} returns</div>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <div className="card p-5"><div className="text-sm text-slate-500">Returned Amount</div><div className="mt-2 text-2xl font-black">{money(summary.amount)}</div></div>
      <div className="card p-5"><div className="text-sm text-slate-500">Returned Cost</div><div className="mt-2 text-2xl font-black">{money(summary.cost)}</div></div>
      <div className="card p-5"><div className="text-sm text-slate-500">Profit Reversal</div><div className="mt-2 text-2xl font-black">{money(summary.profitImpact)}</div></div>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="card p-4 sm:p-6">
        <div className="flex gap-2"><div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search product name or SKU..." className="w-full rounded-2xl bg-slate-100 py-3 pl-10 pr-3"/></div><button type="button" onClick={() => searchProducts(query)} className="btn-soft" disabled={searching}>{searching ? "Searching..." : "Search"}</button></div>
        <div className="mt-4 max-h-[430px] overflow-y-auto rounded-2xl pr-1"><div className="grid gap-2 sm:grid-cols-2">{results.map(p => <button type="button" key={p._id} onClick={() => chooseProduct(p)} className="rounded-2xl border border-slate-200 p-3 text-left hover:shadow"><div className="font-black">{p.name}</div><div className="mt-1 text-xs text-slate-500">{p.sku} · Current stock: {p.stockQuantity ?? 0}</div><div className="mt-2 font-black">{money(p.discountedPrice ?? p.sellingPrice)}</div></button>)}</div></div>
        {!searching && !results.length && <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">No products found.</div>}

        {selectedProduct && <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xl font-black">{selectedProduct.name}</div><div className="text-sm text-slate-500">{selectedProduct.sku} · Return value {money(selectedPrice)} each</div></div><button type="button" className="btn-soft" onClick={() => setSelectedProduct(null)}>Close</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{selectedProduct.colors?.length > 0 && <label className="text-sm font-bold">Color<select value={color} onChange={e => setColor(e.target.value)} className="mt-2 w-full rounded-2xl bg-white p-3"><option value="">Select color</option>{selectedProduct.colors.map(x => <option key={x}>{x}</option>)}</select></label>}{selectedProduct.sizes?.length > 0 && <label className="text-sm font-bold">Size<select value={size} onChange={e => setSize(e.target.value)} className="mt-2 w-full rounded-2xl bg-white p-3"><option value="">Select size</option>{selectedProduct.sizes.map(x => <option key={x}>{x}</option>)}</select></label>}<div><div className="text-sm font-bold">Quantity</div><div className="mt-2 flex h-[50px] items-center justify-between rounded-2xl bg-white p-1"><button type="button" onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 disabled:opacity-30"><Minus size={17}/></button><input type="number" min="1" step="1" value={quantity} onChange={e => changeQuantity(e.target.value)} className="w-14 bg-transparent text-center font-black outline-none"/><button type="button" onClick={() => changeQuantity(quantity + 1)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100"><Plus size={17}/></button></div></div></div><button type="button" onClick={addToCart} className="btn-primary mt-4">Add Return Item</button></div>}
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex items-center justify-between"><h2 className="text-xl font-black">Return Cart</h2><span className="badge">{cart.reduce((n, x) => n + x.quantity, 0)} items</span></div>
        {cart.length ? <div className="mt-4 max-h-[390px] space-y-3 overflow-y-auto pr-1">{cart.map((item, index) => { const saving = Math.max(0, item.sellingPrice - item.discountedPrice) * item.quantity; return <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-black">{index + 1}. {item.name}</div><div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500"><span>{item.sku}</span>{item.color && <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-black/5">Color: {item.color}</span>}{item.size && <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-black/5">Size: {item.size}</span>}</div><div className="mt-2 text-xs text-slate-400">{money(item.discountedPrice)} each{item.sellingPrice > item.discountedPrice ? ` · ${money(item.sellingPrice - item.discountedPrice)} saved each` : ""}</div></div><button type="button" onClick={() => setCart(c => c.filter(x => x.key !== item.key))} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-red-600 hover:bg-red-50" aria-label={`Remove ${item.name}`}><Trash2 size={17}/></button></div><div className="mt-3 flex items-center justify-between gap-3"><div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-black/5"><button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-30" disabled={item.quantity <= 1} onClick={() => updateQty(item.key, item.quantity - 1)}><Minus size={15}/></button><input value={item.quantity} onChange={e => updateQty(item.key, e.target.value)} className="w-10 bg-transparent text-center text-sm font-black outline-none" inputMode="numeric"/><button type="button" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100" onClick={() => updateQty(item.key, item.quantity + 1)}><Plus size={15}/></button></div><div className="text-right"><div className="text-xs text-slate-400 line-through">{money(item.sellingPrice * item.quantity)}</div><div className="font-black">{money(item.discountedPrice * item.quantity)}</div>{saving > 0 && <div className="text-xs font-semibold text-emerald-600">Saving {money(saving)}</div>}</div></div></div>})}</div> : <div className="mt-4 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">No return items added.</div>}

        <div className="mt-5 border-t pt-5"><div className="flex justify-between text-sm"><span>Calculated Return Amount</span><b>{money(calculatedAmount)}</b></div><label className="mt-4 block text-sm font-black">Total Return Amount<input type="number" min="0" max={calculatedAmount} step="0.01" value={returnAmount} onChange={e => setReturnAmount(e.target.value)} className="mt-2 w-full rounded-2xl bg-slate-100 p-4 text-xl font-black"/><span className="mt-1 block text-xs font-normal text-slate-500">This is the amount reversed from revenue. If you reduce it, the difference is treated as an additional return adjustment.</span></label>{additionalAdjustment > 0 && <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Additional return adjustment: <b>{money(additionalAdjustment)}</b></div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Customer Name<input value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-2 w-full rounded-2xl bg-slate-100 p-3" placeholder="Optional"/></label><label className="text-sm font-bold">Phone<input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="mt-2 w-full rounded-2xl bg-slate-100 p-3" placeholder="Optional"/></label></div>
          <label className="mt-3 block text-sm font-bold">Reason<input value={reason} onChange={e => setReason(e.target.value)} className="mt-2 w-full rounded-2xl bg-slate-100 p-3" placeholder="Damaged, customer return, wrong item..."/></label><label className="mt-3 block text-sm font-bold">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" className="mt-2 w-full rounded-2xl bg-slate-100 p-3" placeholder="Optional notes"/></label>
          <button type="button" disabled={!cart.length || saving} onClick={requestReturn} className="btn-primary mt-5 w-full justify-center">{saving ? "Recording Return..." : "Record Return"}</button>
        </div>
      </section>
    </div>

    <section className="card mt-6 overflow-hidden"><div className="p-5"><h2 className="text-xl font-black">Return History</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50"><tr>{["Return","Date","Items","Customer","Amount","Cost","Profit Reversal"].map(x => <th key={x} className="px-4 py-3 font-bold">{x}</th>)}</tr></thead><tbody className="divide-y">{history.map(r => <tr key={r._id}><td className="px-4 py-3 font-bold">{r.returnNumber}</td><td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td><td className="px-4 py-3">{r.items?.reduce((n, x) => n + x.quantity, 0)}</td><td className="px-4 py-3">{r.customerName || "—"}</td><td className="px-4 py-3 font-black">{money(r.returnAmount)}</td><td className="px-4 py-3">{money(r.totalCost)}</td><td className="px-4 py-3">{money(r.profitImpact)}</td></tr>)}</tbody></table></div><Pagination page={pagination.page || page} pages={pagination.pages} total={pagination.total} onChange={setPage}/></section>

    <ConfirmModal open={confirmOpen} title="Record this return?" message={`Restore ${cart.reduce((n, x) => n + x.quantity, 0)} item(s) to stock and reverse ${money(Number(returnAmount || 0))} from revenue? The return will also adjust profit.`} confirmText="Record Return" onConfirm={submitReturn} onClose={() => !saving && setConfirmOpen(false)} busy={saving} busyText="Recording..." danger={false}/>
    <ConfirmModal open={Boolean(info)} title={info?.title || "Information"} message={info?.message || ""} confirmText="Okay" onConfirm={() => setInfo(null)} onClose={() => setInfo(null)} showCancel={false} danger={false}/>
  </div>;
}
