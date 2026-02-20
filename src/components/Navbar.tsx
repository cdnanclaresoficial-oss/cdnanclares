import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logoCdn from "@/assets/logo-cdn.jpg";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/tienda", label: "Tienda" },
  { to: "/inscripcion", label: "Inscripción" },
  { to: "/admin", label: "Admin" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 gradient-navy shadow-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoCdn} alt="C.D. Nanclares" className="h-36 w-36 rounded-full object-cover border-2 border-secondary" />
          <div className="hidden sm:block">
            <span className="font-heading text-3xl font-bold text-primary-foreground tracking-wide">C.D. NANCLARES</span>
            <span className="block text-base text-muted-foreground/70">de la Oca</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
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
