import { useEffect, useState } from "react";
import api from "../lib/api";

const RETRY_MS = 2000;

export default function ServerSplashGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const check = async () => {
      try {
        await api.get("/health", { timeout: 5000 });
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) timer = setTimeout(check, RETRY_MS);
      }
    };

    check();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (ready) return children;

  return (
    <div className="fixed inset-0 z-[9999] grid min-h-screen place-items-center bg-[#fffdf7] px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-toy-yellow text-5xl shadow-sm">
          🧸
        </div>
        <h1 className="mt-6 text-3xl font-black text-toy-ink">JD COLLECTION</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Starting the shop...
        </p>
        <div className="mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-toy-ink" />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Please wait while we connect to the server.
        </p>
      </div>
    </div>
  );
}
