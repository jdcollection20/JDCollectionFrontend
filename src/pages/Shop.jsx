import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import Loading from "../components/Loading";
import SEO from "../components/SEO";

export default function Shop() {
  const [s, setS] = useState(null);
  async function load(force = false) {
    try { setS((await cachedGet(api, "/settings", { key: "settings:public", forceRefresh: force })).data); }
    catch { setS({}); }
  }
  useEffect(() => { load(false); }, []);
  if (!s) return <Loading/>;
  return <div className="container-app py-7 sm:py-10"><SEO title={`${s.shopName || "Shop Details"} | JD COLLECTION`} description={s.description || "Contact and visit JD COLLECTION."}/><div><h1 className="text-3xl font-black sm:text-4xl">Shop Details</h1></div><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="card p-5 sm:p-7"><h2 className="text-2xl font-black">{s.shopName||"JD COLLECTION"}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{s.description||""}</p><dl className="mt-6 grid gap-4 text-sm"><div><dt className="font-bold">Address</dt><dd className="text-slate-500">{s.address||"—"}</dd></div><div><dt className="font-bold">Opening hours</dt><dd className="text-slate-500">{s.openingHours||"—"}</dd></div><div><dt className="font-bold">Phone</dt><dd className="text-slate-500">{s.phone||"—"}</dd></div></dl><div className="mt-6 flex flex-wrap gap-2">{s.googleMapsUrl&&<a className="btn-primary" href={s.googleMapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={17}/> Directions</a>}{s.whatsapp&&<a className="btn-soft" href={`https://wa.me/${s.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"><MessageCircle size={17}/> WhatsApp</a>}{s.phone&&<a className="btn-soft" href={`tel:${s.phone}`}><Phone size={17}/> Call</a>}</div></div><div className="card flex min-h-64 items-center justify-center p-7 text-center"><div><div className="text-6xl">🧸</div><h2 className="mt-4 text-2xl font-black">Come visit us</h2><p className="mt-2 text-slate-500">Browse the collection online, then visit the shop for your purchase.</p></div></div></div></div>
}
