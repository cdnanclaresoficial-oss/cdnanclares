import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logoCdn from "@/assets/logo-cdn.jpg";
import { supabase } from "@/lib/supabase";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/tienda", label: "Tienda" },
  { to: "/inscripcion", label: "Inscripción" },
  { to: "/admin", label: "Admin" },
];

const infoItems = [
  { icon: "🏟️", title: "Historia", key: "info_historia" },
  { icon: "⚽", title: "Cantera", key: "info_cantera" },
  { icon: "🤝", title: "Comunidad", key: "info_comunidad" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [clubInfo, setClubInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchClubInfo = async () => {
      try {
        const { data } = await supabase
          .from("club_config")
          .select("clave, valor")
          .in("clave", ["info_historia", "info_cantera", "info_comunidad"]);
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => { map[row.clave] = row.valor; });
          setClubInfo(map);
        }
      } catch (err) {
        console.error("Error fetching club_config:", err);
      }
    };
    fetchClubInfo();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 gradient-navy shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoCdn} alt="C.D. Nanclares" className="h-36 w-36 rounded-full object-cover border-2 border-secondary" />
          <div className="hidden sm:block">
            <span className="font-heading text-lg font-bold text-primary-foreground tracking-wide">C.D. NANCLARES</span>
            <span className="block text-xs text-muted-foreground/70">de la Oca</span>
          </div>
        </Link>

        {/* Desktop nav + info hover items */}
        <div className="hidden md:flex items-center gap-6">
          {/* Info hover cards */}
          <div className="flex items-center gap-1">
            {infoItems.map((item) => (
              <HoverCard key={item.key} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button className="px-3 py-2 rounded-md font-heading text-sm uppercase tracking-wider text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-all duration-300 flex items-center gap-1.5">
                    <span className="text-lg">{item.icon}</span>
                    {item.title}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-2xl p-5"
                  side="bottom"
                  align="center"
                >
                  <div className="space-y-2">
                    <h4 className="font-heading text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <span>{item.icon}</span> {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {clubInfo[item.key] || "Cargando información..."}
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>

          {/* Nav links */}
          <ul className="flex items-center gap-1">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`px-4 py-2 rounded-md font-heading text-sm uppercase tracking-wider transition-colors ${
                    location.pathname === l.to
                      ? "bg-secondary text-secondary-foreground"
                      : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-primary-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden gradient-navy border-t border-white/10 pb-4">
          {infoItems.map((item) => (
            <details key={item.key} className="px-6 py-2">
              <summary className="font-heading uppercase tracking-wider text-sm text-primary-foreground/80 cursor-pointer flex items-center gap-2">
                <span>{item.icon}</span> {item.title}
              </summary>
              <p className="text-xs text-primary-foreground/60 mt-1 pl-7 leading-relaxed">
                {clubInfo[item.key] || "Cargando..."}
              </p>
            </details>
          ))}
          <div className="border-t border-white/10 mt-2 pt-2">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block px-6 py-3 font-heading uppercase tracking-wider text-sm ${
                  location.pathname === l.to
                    ? "text-secondary bg-white/10"
                    : "text-primary-foreground/80 hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
