import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import ProductGrid from "../components/ProductGrid";
import Loading from "../components/Loading";
import Pagination from "../components/Pagination";
import SEO from "../components/SEO";

const PAGE_SIZE = 12;

export default function Catalog({ mode }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const filter = mode === "offers" ? "&offer=true" : mode === "popular" ? "&demanded=true" : "";

  async function loadCategories(force = false) {
    try {
      const r = await cachedGet(api, "/categories?active=true&page=1&limit=100", { key: "categories:public:all", forceRefresh: force });
      setCategories(r.data?.items || r.data || []);
    } catch {}
  }

  async function loadProducts(force = false) {
    setLoading(true);
    const query = `/products?available=true&page=${page}&limit=${PAGE_SIZE}${filter}${q ? `&q=${encodeURIComponent(q)}` : ""}${category ? `&category=${category}` : ""}`;
    const key = `products:catalog:${mode || "all"}:${page}:${q.trim().toLowerCase()}:${category}`;
    try {
      const r = await cachedGet(api, query, { key, forceRefresh: force });
      setProducts(r.data?.items || []);
      setPagination(r.data?.pagination || { page, pages: 1, total: 0 });
    } catch {
      setProducts([]);
      setPagination({ page, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadProducts(false), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, category, page, mode]);

  useEffect(() => {
    setPage(1);
  }, [q, category, mode]);

  return <div className="container-app py-7 sm:py-10"><SEO title={`${mode === "offers" ? "Today's Offers" : mode === "popular" ? "Most Demanded" : "Search Products"} | JD COLLECTION`} description="Browse JD COLLECTION products, offers and popular picks."/>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-black sm:text-4xl">{mode === "offers" ? "Today's Offers" : mode === "popular" ? "Most Demanded" : "Browse Toys"}</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">{mode === "offers" ? "Products marked by the shop as today's offers." : mode === "popular" ? "Products marked as popular by the shop." : "Search and explore the full catalog."}</p></div>
    </div>

    <div className="card mt-6 p-3 sm:p-4">
      <div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={q} onChange={e => setQ(e.target.value)} className="w-full rounded-2xl bg-slate-100 py-3 pl-10 pr-4" placeholder="Search toys..."/></div>
      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!category ? "bg-toy-ink text-white" : "bg-slate-100"}`} onClick={() => setCategory("")}>All</button>
        {categories.map(c => <button key={c._id} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === c._id ? "bg-toy-ink text-white" : "bg-slate-100"}`} onClick={() => setCategory(c._id)}>{c.name}</button>)}
      </div>
    </div>

    <div className="mt-6">{loading ? <Loading/> : <ProductGrid products={products}/>}</div>
    {!loading && <Pagination page={pagination.page || page} pages={pagination.pages} total={pagination.total} onChange={setPage}/>}
  </div>;
}
