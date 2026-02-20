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

const Home = () => {
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
