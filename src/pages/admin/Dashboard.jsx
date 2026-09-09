import { useEffect,useState } from "react";
import { Package,CheckCircle,AlertCircle,Tag,Flame,Tags,Send } from "lucide-react";
import api from "../../lib/api";
import { cachedGet, cacheRemove } from "../../lib/cache";
import { money } from "../../lib/utils";
import RefreshButton from "../../components/RefreshButton";

export default function Dashboard(){
  const[d,setD]=useState(null),[refreshing,setRefreshing]=useState(false);
  async function load(force=false){try{const r=await cachedGet(api,"/admin/dashboard",{key:"dashboard:admin",forceRefresh:force});setD(r.data)}catch(error){console.error("Failed to load dashboard:",error)}}
  useEffect(()=>{load(false)},[]);
  async function refresh(){
    setRefreshing(true);
    try {
      await cacheRemove("dashboard:admin");
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }
  if(!d)return <div>Loading...</div>;
  const cards=[["Total Products",d.counts.totalProducts,Package],["Available",d.counts.availableProducts,CheckCircle],["Out of Stock",d.counts.outOfStock,AlertCircle],["Today's Offers",d.counts.todaysOffers,Tag],["Most Demanded",d.counts.mostDemanded,Flame],["Categories",d.counts.totalCategories,Tags],["Notifications Sent",d.counts.notificationsSent,Send]];
  return <div><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-black">Dashboard</h1><p className="mt-1 text-slate-500">Quick overview of the shop. Cached for fast loading.</p></div><RefreshButton onClick={refresh} busy={refreshing}/></div><div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(([label,v,Icon])=><div className="card p-5" key={label}><Icon size={20}/><div className="mt-4 text-2xl font-black">{v}</div><div className="text-sm text-slate-500">{label}</div></div>)}</div><div className="mt-7 grid gap-4 md:grid-cols-2"><div className="card p-6"><h2 className="font-black">Inventory purchase value</h2><div className="mt-2 text-3xl font-black">{money(d.financial.inventoryPurchaseValue)}</div><p className="text-sm text-slate-500">Available stock at purchase cost.</p></div><div className="card p-6"><h2 className="font-black">Potential sales value</h2><div className="mt-2 text-3xl font-black">{money(d.financial.potentialSalesValue)}</div><p className="text-sm text-slate-500">Available stock at normal selling prices.</p></div><div className="card p-6"><h2 className="font-black">Estimated normal profit</h2><div className="mt-2 text-3xl font-black">{money(d.financial.normalProfit)}</div></div><div className="card p-6"><h2 className="font-black">Estimated discounted profit</h2><div className="mt-2 text-3xl font-black">{money(d.financial.discountedProfit)}</div></div></div></div>;
}
