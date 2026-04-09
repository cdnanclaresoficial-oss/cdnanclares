import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import ClubGallery from "@/components/ClubGallery";
import PublicChat from "@/components/PublicChat";
import { supabase } from "@/lib/supabase";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const infoItems = [
  { icon: "🏟️", title: "Historia", key: "info_historia", fallback: "Más de 60 años formando deportistas en Nanclares de la Oca." },
  { icon: "⚽", title: "Cantera", key: "info_cantera", fallback: "Categorías desde Prebenjamín hasta Senior y Veteranos." },
  { icon: "🤝", title: "Comunidad", key: "info_comunidad", fallback: "Un club abierto a todos, donde el deporte une a familias." },
];

const SPONSORS_BUCKET_BASE = "https://rwqbrwpzgjhkgnkqtlab.supabase.co/storage/v1/object/public/patrocinadores";
const CONVENIO_ALAVES_URL = `${SPONSORS_BUCKET_BASE}/convenio-deportivo-alaves.webp`;
const SPONSOR_CAROUSEL_URLS = [
  `${SPONSORS_BUCKET_BASE}/ayuntamiento-iruna-oca.webp`,
  `${SPONSORS_BUCKET_BASE}/erdiko-bar.webp`,
  `${SPONSORS_BUCKET_BASE}/talleres-langrares.webp`,
  `${SPONSORS_BUCKET_BASE}/montse-romero-mapfre.webp`,
  `${SPONSORS_BUCKET_BASE}/vialki.webp`,
  `${SPONSORS_BUCKET_BASE}/restaurante-rosa.webp`,
  `${SPONSORS_BUCKET_BASE}/alanzo-servicios-construccion.webp`,
  `${SPONSORS_BUCKET_BASE}/nanclares-fruteria.webp`,
  `${SPONSORS_BUCKET_BASE}/grupo-verin.webp`,
  `${SPONSORS_BUCKET_BASE}/joberma-electricidad.webp`,
  `${SPONSORS_BUCKET_BASE}/peluqueria-rosa.webp`,
  `${SPONSORS_BUCKET_BASE}/auto-subillabide.webp`,
  `${SPONSORS_BUCKET_BASE}/izpia-mantenimientos.webp`,
  `${SPONSORS_BUCKET_BASE}/bobbys-music-house.webp`,
  `${SPONSORS_BUCKET_BASE}/cafe-kronos.webp`,
  `${SPONSORS_BUCKET_BASE}/siglo-xxi.webp`,
];

const Home = () => {
  const [clubInfo, setClubInfo] = useState<Record<string, string>>({});
  const [sponsorIndex, setSponsorIndex] = useState(0);

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

  useEffect(() => {
    if (SPONSOR_CAROUSEL_URLS.length <= 1) return;
    const id = setInterval(() => {
      setSponsorIndex((prev) => (prev + 1) % SPONSOR_CAROUSEL_URLS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/80 via-navy-deep/60 to-navy-deep/90" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground uppercase tracking-tight mb-4 drop-shadow-lg">
            C.D. Nanclares
          </h1>
          <p className="font-heading text-xl md:text-2xl text-primary-foreground/70 uppercase tracking-widest mb-2">
            de la Oca
          </p>
          <div className="w-24 h-1 bg-secondary mx-auto my-6 rounded-full" />
          <p className="text-primary-foreground/60 text-lg mb-12 font-light">
            Fundazio Urtea 1960
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/inscripcion" className="glass-button hover:scale-105 transform">
              ⚽ Área de Jugadores
            </Link>
            <Link to="/hazte-socio" className="glass-button border-secondary/40 hover:bg-secondary/20 hover:scale-105 transform">
              🤝 Hazte Socio
            </Link>
            <Link to="/tienda" className="glass-button border-secondary/40 hover:bg-secondary/20 hover:scale-105 transform">
              🛒 Tienda Oficial
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Quick actions / info band */}
      <section className="bg-secondary/5 border-y border-border">
        <div className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-3 items-center">
          <div>
            <h2 className="font-heading text-lg md:text-xl font-bold text-primary uppercase tracking-wide">
              ¿Nuevo en el club?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Inscribe a tu hijo/a en pocos pasos o renueva su ficha para la nueva temporada.
            </p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-semibold text-primary">1.</span> Rellena el formulario de inscripción.</p>
            <p><span className="font-semibold text-primary">2.</span> Te contactaremos para confirmar plaza y horarios.</p>
            <p><span className="font-semibold text-primary">3.</span> Recoge tu equipación en el club.</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 justify-end md:justify-center">
            <Link to="/inscripcion" className="glass-button bg-primary text-primary-foreground hover:bg-navy-light text-sm">
              ⚽ Quiero inscribir a un jugador
            </Link>
            <Link to="/hazte-socio" className="glass-button border-secondary/40 hover:bg-secondary/20 text-sm">
              🤝 Quiero hacerme socio
            </Link>
            <Link to="/tienda" className="glass-button border-secondary/40 hover:bg-secondary/20 text-sm">
              🛒 Ver equipaciones y ropa
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Nuestro Club</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {infoItems.map((item) => (
              <HoverCard key={item.key} openDelay={200} closeDelay={150}>
                <HoverCardTrigger asChild>
                  <div className="text-center p-8 rounded-xl bg-card border border-border hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                    <span className="text-4xl mb-4 block">{item.icon}</span>
                    <h3 className="font-heading text-xl font-bold text-primary uppercase mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.fallback}</p>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-2xl p-5" side="bottom">
                  <h4 className="font-heading text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-2">
                    <span>{item.icon}</span> {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {clubInfo[item.key] || item.fallback}
                  </p>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>

          <div className="max-w-6xl mx-auto mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs md:text-sm font-heading uppercase tracking-widest text-primary">
              Impulsan Nuestro Proyecto
            </span>
            <h2 className="font-heading mt-4 text-3xl md:text-5xl font-bold uppercase tracking-tight text-primary">
              Patrocinadores y Convenios
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              Gracias al apoyo de entidades y empresas colaboradoras, seguimos creciendo temporada tras temporada.
            </p>
          </div>

          <div className="max-w-6xl mx-auto mb-14 grid lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 md:p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-heading text-sm md:text-base uppercase tracking-wider text-primary">Convenio Oficial</p>
              </div>
              <div className="relative w-full min-h-[300px] md:min-h-[420px]">
                <img
                  src={CONVENIO_ALAVES_URL}
                  alt="Convenio C.D. Nanclares con Deportivo Alavés"
                  className="absolute inset-0 w-full h-full object-contain rounded-2xl bg-white p-3"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-card via-card to-secondary/5 p-4 md:p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-heading text-sm md:text-base uppercase tracking-wider text-primary">Empresas Colaboradoras</p>
              </div>
              <div className="relative w-full min-h-[300px] md:min-h-[420px] overflow-hidden rounded-2xl bg-white">
                {SPONSOR_CAROUSEL_URLS.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Patrocinador ${i + 1}`}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 p-3 ${
                      i === sponsorIndex ? "opacity-100" : "opacity-0"
                    }`}
                    loading="lazy"
                  />
                ))}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {SPONSOR_CAROUSEL_URLS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === sponsorIndex ? "w-6 bg-primary" : "w-2 bg-primary/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <h2 className="section-title text-center mb-8">Orgullo de la Oca</h2>
          <div className="max-w-6xl mx-auto">
            <ClubGallery />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-navy py-10 text-center">
        <p className="text-primary-foreground/50 text-sm">
          © {new Date().getFullYear()} Club Deportivo Nanclares de la Oca. Todos los derechos reservados.
        </p>
      </footer>

      <PublicChat autoOpen />
    </main>
  );
};

export default Home;
