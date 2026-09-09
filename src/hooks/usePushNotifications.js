import { useEffect, useState } from "react";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false), [subscribed, setSubscribed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!ok) return;
      setSupported(true);
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(Boolean(sub));
      } catch (e) { if (!cancelled) setError("Notifications are unavailable on this browser."); }
    }
    init(); return () => { cancelled = true; };
  }, []);

  async function toggle() {
    if (!supported || busy) return;
    setBusy(true); setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete("/push/unsubscribe", { data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
        setSubscribed(false);
      } else {
        if (Notification.permission === "denied") throw new Error("Notifications are blocked in your browser. Allow them in browser site settings first.");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setSubscribed(false); return; }
        const { data } = await cachedGet(api, "/push/public-key", { key: "push:public-key" });
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(data.publicKey) });
        await api.post("/push/subscribe", sub.toJSON());
        setSubscribed(true);
      }
    } catch (e) { setError(e.response?.data?.message || e.message || "Could not update notifications."); }
    finally { setBusy(false); }
  }
  return { supported, subscribed, busy, error, toggle };
}
