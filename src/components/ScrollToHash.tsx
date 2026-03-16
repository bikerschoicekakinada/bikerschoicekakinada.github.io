import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_OFFSET_PX = 96;

export default function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const raw = decodeURIComponent(location.hash.replace("#", ""));
    const id =
      raw === "customwork" || raw === "custom-work"
        ? "signature"
        : raw;
    if (!id) return;

    const el = document.getElementById(id);
    if (!el) return;

    const top = window.scrollY + el.getBoundingClientRect().top - SCROLL_OFFSET_PX;
    window.scrollTo({ top, behavior: "smooth" });
  }, [location.pathname, location.hash]);

  return null;
}

