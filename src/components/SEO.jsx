import { useEffect } from "react";

function setMeta(name, content, attr = "name") {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function SEO({ title, description, canonical }) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta("description", description || "JD COLLECTION — toys, gifts, watches and perfumes.");
    setMeta("og:title", title || "JD COLLECTION", "property");
    setMeta("og:description", description || "Browse JD COLLECTION products, offers and popular picks.", "property");
    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
      link.href = canonical;
    }
  }, [title, description, canonical]);
  return null;
}
