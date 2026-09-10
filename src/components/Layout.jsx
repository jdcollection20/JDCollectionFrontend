import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, Bell, Search, Download } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { usePwaInstall } from "../hooks/usePwaInstall";

const links = [
  ["/", "Home"],
  ["/categories", "Categories"],
  ["/offers", "Today's Offers"],
  ["/most-demanded", "Most Demanded"],
  ["/shop", "Shop Details"],
];

export default function Layout() {
  const [open, setOpen] = useState(false),
    [shopName, setShopName] = useState("");
  const { supported, subscribed, busy, error, toggle } = usePushNotifications();
  const { canInstall, install } = usePwaInstall();
  useEffect(() => {
    let cancelled = false;
    cachedGet(api, "/settings", { key: "settings:public" })
      .then((r) => {
        if (!cancelled) setShopName(r.data?.shopName || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="container-app flex min-h-16 items-center justify-between gap-2 py-2">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 font-black text-lg sm:text-xl"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-toy-yellow">
              🧸
            </span>
            <span className="truncate">{shopName || "JD COLLECTION"}</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? "bg-slate-100" : "hover:bg-slate-50"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1.5">
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="btn-yellow px-3 py-2.5"
                title="Install JD COLLECTION app"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}
            {supported && (
              <button
                type="button"
                title={
                  subscribed ? "Disable notifications" : "Enable notifications"
                }
                onClick={toggle}
                disabled={busy}
                className="flex items-center gap-2 rounded-2xl bg-slate-100 px-2.5 py-2.5 text-sm font-bold hover:bg-slate-200 disabled:opacity-60"
              >
                <Bell size={18} />
                <span className="hidden sm:inline">Notifications</span>
                <span
                  aria-hidden="true"
                  className={`relative h-6 w-11 rounded-full transition ${subscribed ? "bg-toy-ink" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${subscribed ? "left-6" : "left-1"}`}
                  />
                </span>
              </button>
            )}
            <Link to="/search" className="btn-soft p-2.5" title="Search">
              <Search size={18} />
            </Link>
            <button
              className="btn-soft p-2.5 md:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {error && (
          <div className="container-app pb-2 text-right text-xs font-semibold text-red-600">
            {error}
          </div>
        )}
        {open && (
          <div className="container-app border-t pb-3 pt-2 md:hidden">
            {links.map(([to, label]) => (
              <NavLink
                onClick={() => setOpen(false)}
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-3 font-semibold ${isActive ? "bg-slate-100" : "hover:bg-slate-50"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-16 border-t bg-white py-8 sm:py-10">
        <div className="container-app grid gap-6 md:grid-cols-4">
          <div>
            <div className="font-black text-xl">
              🧸 {shopName || "JD COLLECTION"}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Toys, watches, perfumes, gifts and more.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Quick links</h3>
            <div className="mt-2 grid gap-1 text-sm text-slate-600">
              <Link to="/offers">Today's Offers</Link>
              <Link to="/most-demanded">Most Demanded</Link>
              <Link to="/shop">Shop Details</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Legal</h3>
            <div className="mt-2 grid gap-1 text-sm text-slate-600">
              <Link to="/terms">Terms & Conditions</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Developer</h3>
            <p className="mt-2 text-sm text-slate-500">
              Website design & development by{" "}
              <span className="font-semibold text-slate-700">Technobeas</span>.
            </p>
            <a
              href="mailto:technobeas@gmail.com"
              className="mt-1 block text-sm text-slate-500 hover:text-slate-700"
            >
              gamingtechno456@gmail.com
            </a>
          </div>
        </div>
        <div className="container-app mt-7 border-t pt-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {shopName || "JD COLLECTION"}. All rights
          reserved.
        </div>
      </footer>
    </>
  );
}
