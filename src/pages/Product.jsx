import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, PlayCircle } from "lucide-react";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import { money } from "../lib/utils";
import Loading from "../components/Loading";
import SEO from "../components/SEO";

export default function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const r = await cachedGet(api, `/products/${encodeURIComponent(slug)}`, {
          key: `product:public:${slug}`,
        });
        if (!cancelled) {
          setProduct(r.data);
          setSelected(0);
        }
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <Loading />;

  if (!product) {
    return (
      <div className="container-app py-16 text-center">
        <div className="text-6xl">🧸</div>
        <h1 className="mt-4 text-3xl font-black">Product not found</h1>
        <p className="mt-2 text-slate-500">This toy may have been removed or is no longer available.</p>
        <Link to="/categories" className="btn-primary mt-6 inline-flex">Browse Toys</Link>
      </div>
    );
  }

  const media = [
    ...(product.images || []).map((m) => ({ ...m, mediaType: "image" })),
    ...(product.videos || []).map((m) => ({ ...m, mediaType: "video" })),
  ];
  const current = media[selected] || media[0];

  const seoDescription = product.description || `View ${product.name} at JD COLLECTION.`;
  return (
    <div className="container-app py-7 sm:py-10">
      <SEO title={`${product.name} | JD COLLECTION`} description={seoDescription} canonical={`${window.location.origin}/products/${product.slug}`} />
      <Link to="/categories" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:underline">
        <ArrowLeft size={17} /> Back to Toys
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-[2rem] bg-slate-100">
            {current?.mediaType === "video" ? (
              <video src={current.secureUrl} controls className="aspect-square w-full object-contain" />
            ) : current?.secureUrl ? (
              <img src={current.secureUrl} alt={product.name} className="aspect-square w-full object-contain" />
            ) : (
              <div className="grid aspect-square place-items-center text-[8rem]">🧸</div>
            )}
          </div>

          {media.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {media.map((m, i) => (
                <button
                  key={`${m.publicId || m.secureUrl}-${i}`}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`relative overflow-hidden rounded-xl bg-slate-100 ring-2 ${selected === i ? "ring-toy-ink" : "ring-transparent"}`}
                >
                  {m.mediaType === "video" ? (
                    <div className="relative">
                      <video src={m.secureUrl} muted preload="metadata" className="aspect-square w-full object-cover" />
                      <PlayCircle className="absolute inset-0 m-auto text-white drop-shadow" size={25} />
                    </div>
                  ) : (
                    <img src={m.secureUrl} alt="" className="aspect-square w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.isTodaysOffer && <span className="badge bg-toy-pink text-white">🏷️ Today's Offer</span>}
            {product.isMostDemanded && <span className="badge bg-toy-yellow text-toy-ink">🔥 Most Demanded</span>}
            {!product.isAvailable && <span className="badge bg-slate-900 text-white">Out of Stock</span>}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
            {product.category?.name || "Toys"}
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{product.name}</h1>
          {product.sku && <p className="mt-2 text-sm text-slate-400">SKU: {product.sku}</p>}

          {product.colors?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-black">Available Colors</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map(color => <span key={color} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">{color}</span>)}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-black">Available Sizes</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map(size => <span key={size} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">{size}</span>)}
              </div>
            </div>
          )}

          <div className="mt-5">
            {product.isPriceVisible ? (
              product.discountedPrice != null ? (
                <div className="flex items-center gap-3">
                  <span className="text-lg text-slate-400 line-through">{money(product.sellingPrice)}</span>
                  <span className="text-3xl font-black">{money(product.discountedPrice)}</span>
                </div>
              ) : (
                <span className="text-3xl font-black">{money(product.sellingPrice)}</span>
              )
            ) : (
              <span className="font-bold">Visit Shop for Price</span>
            )}
          </div>

          {product.description && (
            <div className="mt-7">
              <h2 className="text-xl font-black">Description</h2>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{product.description}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            {!product.isAvailable ? (
              <span className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-500">Currently unavailable</span>
            ) : (
              <Link to="/shop" className="btn-primary">Visit Shop to Buy</Link>
            )}
            <Link to="/shop" className="btn-soft"><MessageCircle size={17} /> Contact Shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
