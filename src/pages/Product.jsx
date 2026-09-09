import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, PlayCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import Loading from "../components/Loading";
import { discountPercent, money } from "../lib/utils";

export default function Product() {
  const { slug } = useParams();

  const [p, setP] = useState(null);
  const [active, setActive] = useState(0);

  async function load(force = false) {
    try {
      const r = await cachedGet(api, `/products/${slug}`, {
        key: `product:${slug}`,
        forceRefresh: force,
      });

      setP(r.data);
      setActive(0);
    } catch {
      setP(false);
    }
  }

  useEffect(() => {
    load(false);
  }, [slug]);

  if (p === null) {
    return <Loading />;
  }

  if (p === false) {
    return (
      <div className="container-app py-20 text-center">Product not found.</div>
    );
  }

  const images = p.images || [];
  const videos = p.videos || [];
  const specifications = p.specifications || {};

  const off = discountPercent(p.sellingPrice, p.discountedPrice);

  return (
    <div className="container-app py-6 sm:py-10">
      {/* Back button */}
      <div className="mb-5">
        <Link to="/search" className="btn-soft">
          <ArrowLeft size={17} />
          Back to products
        </Link>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] lg:items-start lg:gap-10">
        {/* LEFT SIDE */}
        <section>
          {/* Main image */}
          <div className="overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-black/5">
            {images[active]?.secureUrl ? (
              <img
                src={images[active].secureUrl}
                alt={p.name}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="grid aspect-square place-items-center text-8xl">
                🧸
              </div>
            )}
          </div>

          {/* Image thumbnails */}
          {images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((m, n) => (
                <button
                  key={m.publicId}
                  type="button"
                  onClick={() => setActive(n)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ${
                    active === n ? "ring-toy-purple" : "ring-transparent"
                  }`}
                >
                  <img
                    src={m.secureUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2">
                <PlayCircle size={19} />
                <h2 className="text-xl font-black">Product videos</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((v) => (
                  <div
                    key={v.publicId}
                    className="overflow-hidden rounded-3xl bg-black"
                  >
                    <video
                      controls
                      preload="metadata"
                      playsInline
                      className="aspect-video w-full"
                      src={v.secureUrl}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT SIDE */}
        <section className="lg:sticky lg:top-24">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {p.isTodaysOffer && (
              <span className="badge bg-toy-pink text-white">
                🏷️ Today's Offer
              </span>
            )}

            {p.isMostDemanded && (
              <span className="badge bg-toy-yellow">🔥 Most Demanded</span>
            )}

            {!p.isAvailable && (
              <span className="badge bg-slate-900 text-white">
                Out of Stock
              </span>
            )}
          </div>

          {/* Category */}
          <p className="mt-4 text-sm font-bold text-slate-400">
            {p.category?.name}
          </p>

          {/* Product name */}
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{p.name}</h1>

          {/* PRICE */}
          <div className="mt-5">
            {p.isPriceVisible ? (
              p.discountedPrice != null ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-slate-400 line-through">
                    {money(p.sellingPrice)}
                  </span>

                  <span className="text-3xl font-black">
                    {money(p.discountedPrice)}
                  </span>

                  {off > 0 && (
                    <span className="badge bg-toy-green">{off}% OFF</span>
                  )}
                </div>
              ) : (
                <span className="text-3xl font-black">
                  {money(p.sellingPrice)}
                </span>
              )
            ) : (
              <div className="rounded-2xl bg-toy-yellow p-4 font-black">
                Visit Shop for Price
              </div>
            )}
          </div>

          {/* Description */}
          {p.description && (
            <div className="mt-6">
              <h2 className="font-black">About this toy</h2>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                {p.description}
              </p>
            </div>
          )}

          {/* Visit shop */}
          <Link to="/shop" className="btn-primary mt-6 w-full sm:w-auto">
            <MapPin size={18} />
            Visit Shop
          </Link>

          {/* Specifications */}
          <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-black/5">
            <h2 className="font-black">Features & specifications</h2>

            {Object.entries(specifications).length > 0 ? (
              <div className="mt-3 divide-y">
                {Object.entries(specifications).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 py-2 text-sm"
                  >
                    <span className="text-slate-500">{k}</span>

                    <b className="text-right">{v}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No specifications listed.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
