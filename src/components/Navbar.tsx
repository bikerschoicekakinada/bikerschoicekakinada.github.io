import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const sections = [
  { id: "home", label: "Home" },
  { id: "signature", label: "Custom Work" },
  { id: "gallery", label: "Gallery" },
  { id: "delivery", label: "Delivery" },
  { id: "social", label: "Social" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const Navbar = () => {
  const [active, setActive] = useState("home");
  const location = useLocation();
  const isHomeRoute = location.pathname === "/";

  useEffect(() => {
    if (!isHomeRoute) {
      const currentPath = location.pathname.substring(1);
      const matched = sections.find((s) => s.id === currentPath || (s.id === "signature" && currentPath === "custom-work"));
      if (matched) {
        setActive(matched.id);
      }
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollY) {
          const currentSectionId = sections[i].id;
          setActive(currentSectionId);
          
          const targetHash = currentSectionId === "home" ? "" : `#${currentSectionId}`;
          if (window.location.hash !== targetHash) {
            window.history.replaceState(null, "", window.location.pathname + targetHash);
          }
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Run on mount to set initial active section
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomeRoute, location.pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (isHomeRoute) {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const top = window.scrollY + el.getBoundingClientRect().top - 96;
        window.scrollTo({ top, behavior: "smooth" });
      }
      const newHash = id === "home" ? "" : `#${id}`;
      window.history.replaceState(null, "", window.location.pathname + newHash);
      setActive(id);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {sections.map((s) => (
            <a
              key={s.id}
              href={isHomeRoute ? `#${s.id}` : `/#${s.id}`}
              onClick={(e) => handleClick(e, s.id)}
              className={`relative px-3 py-1.5 text-xs font-heading font-semibold rounded-full transition-colors whitespace-nowrap ${
                active === s.id
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active === s.id && (
                <motion.span
                  layoutId="navPill"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{s.label}</span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
