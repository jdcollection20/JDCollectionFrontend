import { Link,NavLink,Outlet } from "react-router-dom";
import { LayoutDashboard,Package,Tags,Settings,Send,LogOut,Menu,X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
const links=[["/admin","Dashboard",LayoutDashboard],["/admin/products","Products",Package],["/admin/categories","Categories",Tags],["/admin/notifications","Notifications",Send],["/admin/settings","Settings",Settings]];
export default function AdminLayout(){
  const[open,setOpen]=useState(false);
  const{logout,admin}=useAuth();

  useEffect(() => {
    let cancelled = false;
    const ping = () => {
      if (!cancelled) api.get("/health", { timeout: 10000 }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 14 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return <div className="min-h-screen bg-slate-50"><header className="sticky top-0 z-30 border-b bg-white"><div className="flex h-16 items-center justify-between px-4 md:px-6"><Link to="/admin" className="font-black">🧸 Toy Shop Admin</Link><button className="btn-soft md:hidden" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><div className="hidden items-center gap-3 md:flex"><span className="text-sm text-slate-500">{admin?.username}</span><button onClick={logout} className="btn-soft"><LogOut size={17}/> Logout</button></div></div></header><div className="flex"><aside className={`${open?"block":"hidden"} fixed inset-y-16 z-20 w-64 border-r bg-white p-3 md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)]`}>{links.map(([to,label,Icon])=><NavLink onClick={()=>setOpen(false)} key={to} to={to} end={to==="/admin"} className={({isActive})=>`mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold ${isActive?"bg-toy-yellow":"hover:bg-slate-50"}`}><Icon size={18}/>{label}</NavLink>)}<button onClick={logout} className="mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50 md:hidden"><LogOut size={18}/> Logout</button></aside><main className="min-w-0 flex-1 p-4 md:p-8"><Outlet/></main></div></div>}
