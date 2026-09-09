import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import api from "../../lib/api";
import { cachedGet, cacheRemove, cacheSet } from "../../lib/cache";
import RefreshButton from "../../components/RefreshButton";

const emptySettings = {
  shopName: "",
  address: "",
  phone: "",
  whatsapp: "",
  googleMapsUrl: "",
  openingHours: "",
  description: "",
  heroContent: { title: "", description: "" }
};

export default function Settings() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState("");
  const [removeHeroImage, setRemoveHeroImage] = useState(false);

  async function load(force = false) {
    try {
      const r = await cachedGet(api, "/settings", { key: "settings:admin", forceRefresh: force });
      setS({
        ...emptySettings,
        ...r.data,
        heroContent: { ...emptySettings.heroContent, ...(r.data.heroContent || {}) }
      });
      setHeroFile(null);
      setHeroPreview(r.data?.heroContent?.image?.secureUrl || "");
      setRemoveHeroImage(false);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load settings.");
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  useEffect(() => () => {
    if (heroPreview?.startsWith("blob:")) URL.revokeObjectURL(heroPreview);
  }, [heroPreview]);

  function set(k, v) {
    setS(x => ({ ...x, [k]: v }));
  }

  function setHero(k, v) {
    setS(x => ({ ...x, heroContent: { ...(x.heroContent || {}), [k]: v } }));
  }

  function chooseHeroImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Hero image must be smaller than 50 MB.");
      return;
    }
    setError("");
    if (heroPreview?.startsWith("blob:")) URL.revokeObjectURL(heroPreview);
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
    setRemoveHeroImage(false);
  }

  function removeHero() {
    if (heroPreview?.startsWith("blob:")) URL.revokeObjectURL(heroPreview);
    setHeroFile(null);
    setHeroPreview("");
    setRemoveHeroImage(true);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const form = new FormData();
      for (const key of ["shopName", "address", "phone", "whatsapp", "googleMapsUrl", "openingHours", "description"]) {
        form.append(key, s[key] ?? "");
      }
      if (s.logo) form.append("logo", JSON.stringify(s.logo));
      if (s.socialLinks) form.append("socialLinks", JSON.stringify(s.socialLinks));
      form.append("heroContent", JSON.stringify({
        title: s.heroContent?.title || "",
        description: s.heroContent?.description || ""
      }));
      if (heroFile) form.append("heroImage", heroFile);
      if (removeHeroImage && !heroFile) form.append("removeHeroImage", "true");

      const r = await api.put("/settings", form);
      setS({
        ...emptySettings,
        ...r.data,
        heroContent: { ...emptySettings.heroContent, ...(r.data.heroContent || {}) }
      });
      setHeroFile(null);
      setHeroPreview(r.data?.heroContent?.image?.secureUrl || "");
      setRemoveHeroImage(false);
      await cacheRemove("settings:admin");
      await cacheRemove("settings:public");
      await cacheSet("settings:admin", r.data);
      await cacheSet("settings:public", r.data);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save settings. Please log in again.");
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await cacheRemove("settings:admin");
      await cacheRemove("settings:public");
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }

  if (!s) return <div>{error || "Loading settings..."}</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Shop Settings</h1>
          <p className="mt-1 text-sm text-slate-500">The shop name and details below are used across the public website.</p>
        </div>
        <RefreshButton onClick={refresh} busy={refreshing} />
      </div>

      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <form onSubmit={save} className="card mt-6 p-4 sm:p-6">
        <h2 className="text-xl font-black">Shop information</h2>

        {[['shopName','Shop Name'],['address','Address'],['phone','Phone'],['whatsapp','WhatsApp Number'],['googleMapsUrl','Google Maps URL'],['openingHours','Opening Hours']].map(([k,l]) => (
          <label key={k} className="mt-4 block text-sm font-bold">
            {l}
            <input value={s[k] || ""} onChange={e => set(k, e.target.value)} className="mt-2 w-full rounded-2xl bg-slate-100 p-3" />
          </label>
        ))}

        <label className="mt-4 block text-sm font-bold">
          Shop Description
          <textarea value={s.description || ""} onChange={e => set("description", e.target.value)} rows="4" className="mt-2 w-full rounded-2xl bg-slate-100 p-3" />
        </label>

        <h2 className="mt-8 text-xl font-black">Homepage hero</h2>
        <p className="mt-1 text-sm text-slate-500">Add a banner image that will appear beside the hero text on the homepage.</p>

        <label className="mt-4 block text-sm font-bold">
          Hero Title
          <input value={s.heroContent?.title || ""} onChange={e => setHero("title", e.target.value)} className="mt-2 w-full rounded-2xl bg-slate-100 p-3" />
        </label>

        <label className="mt-4 block text-sm font-bold">
          Hero Description
          <textarea value={s.heroContent?.description || ""} onChange={e => setHero("description", e.target.value)} rows="3" className="mt-2 w-full rounded-2xl bg-slate-100 p-3" />
        </label>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-bold">Hero Image</label>
            {heroPreview && (
              <button type="button" onClick={removeHero} className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            {heroPreview ? (
              <img src={heroPreview} alt="Homepage hero preview" className="aspect-[16/7] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/7] place-items-center p-6 text-center text-sm text-slate-500">
                <div>
                  <ImagePlus className="mx-auto mb-2" size={32} />
                  <p className="font-bold">No hero image selected</p>
                  <p className="mt-1">Recommended: wide JPG, PNG, or WebP image.</p>
                </div>
              </div>
            )}
          </div>

          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
            <ImagePlus size={18} />
            {heroPreview ? "Change Hero Image" : "Add Hero Image"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => chooseHeroImage(e.target.files?.[0])} />
          </label>
          <p className="mt-2 text-xs text-slate-500">The image is uploaded to Cloudinary when you save settings.</p>
        </div>

        <button disabled={saving} className="btn-primary mt-6 w-full sm:w-auto">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
