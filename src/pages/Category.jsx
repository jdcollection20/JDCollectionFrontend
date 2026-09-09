import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";

const PAGE_SIZE = 12;

export default function Category() {
  const { slug } = useParams();
  const [c, setC] = useState(null), [p, setP] = useState([]);
  const [page, setPage] = useState(1), [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  async function load(force = false) {
    setLoading(true);
    try {
      const cr = await cachedGet(api, "/categories?active=true&page=1&limit=100", { key: "categories:public:all", forceRefresh: force });
      const cats = cr.data?.items || cr.data || [];
      const x = cats.find(v => v.slug === slug);
      setC(x || null);
      if (!x) return;
      const key = `products:category:${x._id}:${page}`;
      const z = await cachedGet(api, `/products?category=${x._id}&available=true&page=${page}&limit=${PAGE_SIZE}`, { key, forceRefresh: force });
      setP(z.data?.items || []);
      setPagination(z.data?.pagination || { page, pages: 1, total: 0 });
    } catch { setC(null); setP([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { setPage(1); }, [slug]);
  useEffect(() => { load(false); }, [slug, page]);

  if (loading && !c) return <Loading/>;
  if (!c) return <div className="container-app py-20 text-center">Category not found.</div>;

  return <div className="container-app py-7 sm:py-10">
    <div><h1 className="text-3xl font-black sm:text-4xl">{c.name}</h1><p className="mt-2 text-slate-500">{c.description}</p></div>
    <div className="mt-8">{loading ? <Loading/> : <ProductGrid products={p}/>}</div>
    {!loading && <Pagination page={pagination.page || page} pages={pagination.pages} total={pagination.total} onChange={setPage}/>}
  </div>;
}
