import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ManifestManager() {
  const location = useLocation();

  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");

    // Remove existing manifest
    document
      .querySelectorAll('link[rel="manifest"]')
      .forEach((el) => el.remove());

    // Remove existing Apple icon
    document
      .querySelectorAll('link[data-pwa-icon="true"]')
      .forEach((el) => el.remove());

    // Select manifest
    const manifest = document.createElement("link");

    manifest.rel = "manifest";
    manifest.href = isAdmin
      ? "/admin-manifest.webmanifest"
      : "/manifest.webmanifest";

    document.head.appendChild(manifest);

    // Apple Home Screen icon
    const icon = document.createElement("link");

    icon.rel = "apple-touch-icon";
    icon.href = "/icon-192.png";
    icon.dataset.pwaIcon = "true";

    document.head.appendChild(icon);

    return () => {
      manifest.remove();
      icon.remove();
    };
  }, [location.pathname]);

  return null;
}
