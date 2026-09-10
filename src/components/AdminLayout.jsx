import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Settings,
  Send,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePwaInstall } from "../hooks/usePwaInstall";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
const links = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/products", "Products", Package],
  ["/admin/orders/new", "Create Order", ShoppingCart],
  ["/admin/returns", "Return Items", RotateCcw],
  ["/admin/categories", "Categories", Tags],
  ["/admin/notifications", "Notifications", Send],
  ["/admin/settings", "Settings", Settings],
];
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { logout, admin } = useAuth();
  const { canInstall, install } = usePwaInstall();

  // useEffect(() => {
  //   const manifest = document.createElement("link");
  //   manifest.rel = "manifest";
  //   manifest.href = "/admin-manifest.webmanifest";
  //   manifest.dataset.adminManifest = "true";
  //   document.head.appendChild(manifest);
  //   const icon = document.createElement("link");
  //   icon.rel = "apple-touch-icon";
  //   icon.href = "/icon-192.png";
  //   icon.dataset.adminIcon = "true";
  //   document.head.appendChild(icon);
  //   return () => {
  //     manifest.remove();
  //     icon.remove();
  //   };
  // }, []);

  useEffect(() => {
    // Remove any existing manifest links
    document
      .querySelectorAll('link[rel="manifest"]')
      .forEach((el) => el.remove());

    // Add admin manifest
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/admin-manifest.webmanifest";
    manifest.dataset.adminManifest = "true";

    document.head.appendChild(manifest);

    // Admin icon for Android/iOS Home Screen
    document
      .querySelectorAll('link[data-admin-icon="true"]')
      .forEach((el) => el.remove());

    const icon = document.createElement("link");
    icon.rel = "apple-touch-icon";
    icon.href = "/icon-192.png";
    icon.dataset.adminIcon = "true";

    document.head.appendChild(icon);

    return () => {
      manifest.remove();
      icon.remove();
    };
  }, []);

  useEffect(() => {
    if (!admin) return;
    const ping = () => {
      api.get("/health", { timeout: 10000 }).catch(() => {});
    };
    ping();
    const timer = window.setInterval(ping, 14 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [admin]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/admin" className="font-black">
            🧸 JD COLLECTION Admin
          </Link>
          <button className="btn-soft md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <div className="hidden items-center gap-2 md:flex">
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="btn-yellow px-3 py-2.5"
              >
                Add Admin App
              </button>
            )}
            <span className="text-sm text-slate-500">{admin?.username}</span>
            <button onClick={logout} className="btn-soft">
              <LogOut size={17} /> Logout
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside
          className={`${open ? "block" : "hidden"} fixed inset-y-16 z-20 w-64 border-r bg-white p-3 md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)]`}
        >
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="btn-yellow mb-3 w-full"
            >
              Add Admin App to Home
            </button>
          )}
          {links.map(([to, label, Icon]) => (
            <NavLink
              onClick={() => setOpen(false)}
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold ${isActive ? "bg-toy-yellow" : "hover:bg-slate-50"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50 md:hidden"
          >
            <LogOut size={18} /> Logout
          </button>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
