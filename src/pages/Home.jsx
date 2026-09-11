import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { cachedGet } from "../lib/cache";
import ProductGrid from "../components/ProductGrid";
import Section from "../components/Section";
import Loading from "../components/Loading";
import SEO from "../components/SEO";

const KEYS = {
  settings: "settings:public",
  categories: "categories:public",
  offers: "products:home:offers",
  popular: "products:home:popular",
};

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [cats, setCats] = useState([]);
  const [offers, setOffers] = useState([]);
  const [popular, setPopular] = useState([]);

  async function load(forceRefresh = false) {
    try {
      const [s, c, o, p] = await Promise.all([
        cachedGet(api, "/settings", { key: KEYS.settings, forceRefresh }),
        cachedGet(api, "/categories?active=true&page=1&limit=50", {
          key: KEYS.categories,
          forceRefresh,
        }),
        cachedGet(api, "/products?offer=true&available=true&limit=8&page=1", {
          key: KEYS.offers,
          forceRefresh,
        }),
        cachedGet(
          api,
          "/products?demanded=true&available=true&limit=8&page=1",
          { key: KEYS.popular, forceRefresh },
        ),
      ]);
      setSettings(s.data);
      setCats(c.data?.items || c.data || []);
      setOffers(o.data?.items || []);
      setPopular(p.data?.items || []);
    } catch (e) {
      console.error("Failed to load home page", e);
      if (!settings)
        setSettings({
          shopName: "JD COLLECTION",
          description: "",
          heroContent: {},
          address: "",
        });
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings) return <Loading />;
  const hero = settings.heroContent || {};

  return (
    <div>
      <SEO
        title={`${settings.shopName || "JD COLLECTION"} | Toys, Watches, Perfumes & Gifts`}
        description={
          settings.description ||
          "Browse JD COLLECTION toys, watches, perfumes, gifts and offers."
        }
      />
      <section className="overflow-hidden bg-toy-yellow">
        <div className="container-app grid min-h-[420px] items-center gap-8 py-10 sm:py-12 md:grid-cols-2">
          <div>
            {/* <span className="badge bg-white">🎁 Local toy shop</span> */}
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              {hero.title || "Big fun starts here!"}
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-700 sm:text-lg">
              {hero.description || settings.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link className="btn-primary" to="/categories">
                Explore Toys <ArrowRight size={18} />
              </Link>
              <Link className="btn-soft" to="/offers">
                Today's Offers
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">
            {hero.image?.secureUrl ? (
              <img
                src={hero.image.secureUrl}
                alt=""
                className="aspect-square w-full rounded-[2.5rem] object-cover shadow-xl"
              />
            ) : (
              <div className="grid aspect-square place-items-center rounded-[2.5rem] bg-white text-[7rem] shadow-xl sm:text-[9rem]">
                🧸
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="container-app">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">Categories</h2>
              <p className="mt-1 text-sm text-slate-500">Find toys by type</p>
            </div>
            <Link className="text-sm font-bold underline" to="/categories">
              See all
            </Link>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0">
            <div className="flex w-max gap-3">
              {cats.slice(0, 12).map((c) => (
                <Link
                  key={c._id}
                  to={`/categories/${c.slug}`}
                  className="card w-36 shrink-0 overflow-hidden p-3 sm:w-40"
                >
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-slate-100 text-4xl">
                    {c.image?.secureUrl ? (
                      <img
                        src={c.image.secureUrl}
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    ) : (
                      "🧩"
                    )}
                  </div>
                  <div className="mt-2 line-clamp-1 font-bold">{c.name}</div>
                  <div className="text-xs text-slate-400">
                    {c.productCount} products
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section
        title="Today's Offers"
        subtitle="Fresh deals worth checking out"
        to="/offers"
      >
        <ProductGrid products={offers} />
      </Section>
      <Section
        title="Most Demanded"
        subtitle="Popular picks in the shop"
        to="/most-demanded"
      >
        <ProductGrid products={popular} />
      </Section>

      <section className="pb-10">
        <div className="container-app">
          <div className="card flex flex-col gap-5 bg-toy-ink p-6 text-gray-600 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">
                Visit {settings.shopName || "our shop"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600/70">
                {settings.address || "KAT KAT GATE OPPOSITE TAIBA BURKHA MALL"}
              </p>
            </div>
            <Link className="btn-yellow shrink-0" to="/shop">
              <MapPin size={18} /> Shop Details
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
