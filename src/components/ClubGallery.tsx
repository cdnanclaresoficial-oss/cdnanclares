import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ImageOff, Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  url: string;
}

const ClubGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumIndex, setAlbumIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("galeria-club")
          .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
        if (error) throw error;
        const imageFiles = (data || []).filter((f) =>
          /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(f.name)
        );
        setImages(
          imageFiles.map((f) => {
            const { data: u } = supabase.storage.from("galeria-club").getPublicUrl(f.name);
            return { id: f.id ?? f.name, url: u.publicUrl };
          })
        );
      } catch (err) {
        console.error("Gallery error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Cross-fade every 3s
  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % images.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length]);

  // Lock body scroll when album open
  useEffect(() => {
    document.body.style.overflow = albumOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [albumOpen]);

  const openAlbum = useCallback(() => {
    setAlbumIndex(0);
    setAlbumOpen(true);
  }, []);

  const navAlbum = useCallback(
    (dir: 1 | -1) => {
      setAlbumIndex((p) => (p + dir + images.length) % images.length);
    },
    [images.length]
  );

  // Keyboard nav in album
  useEffect(() => {
    if (!albumOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAlbumOpen(false);
      if (e.key === "ArrowRight") navAlbum(1);
      if (e.key === "ArrowLeft") navAlbum(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [albumOpen, navAlbum]);

  if (loading) {
    return <div className="w-full aspect-[16/9] bg-muted/30 rounded-2xl animate-pulse" />;
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
        <ImageOff className="mx-auto text-muted-foreground/40 mb-4" size={48} />
        <p className="text-muted-foreground text-lg font-medium">La galería está vacía</p>
        <p className="text-muted-foreground/60 text-sm mt-1">Sube fotos al bucket galeria-club.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Fader ── */}
      <div className="space-y-6">
        <div
          className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden select-none shadow-lg shadow-black/10"
          style={{ pointerEvents: "none" }}
        >
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt="Foto del club"
              draggable={false}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 w-full h-full object-cover will-change-[opacity]"
              style={{
                opacity: i === currentSlide ? 1 : 0,
                transition: "opacity 1.2s ease-in-out",
              }}
            />
          ))}
          {/* Dots */}
          {images.length <= 12 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`block w-2 h-2 rounded-full transition-colors duration-500 ${
                    i === currentSlide ? "bg-white" : "bg-white/35"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={openAlbum} className="gap-2">
            <Images size={20} />
            Ver Álbum Completo
          </Button>
        </div>
      </div>

      {/* ── Fullscreen Album Modal ── */}
      {albumOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
          onClick={() => setAlbumOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setAlbumOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {albumIndex + 1} / {images.length}
          </span>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); navAlbum(-1); }}
            className="absolute left-3 md:left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <img
            key={images[albumIndex].id}
            src={images[albumIndex].url}
            alt="Foto del club"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg select-none animate-scale-in"
            style={{ pointerEvents: "none" }}
          />

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); navAlbum(1); }}
            className="absolute right-3 md:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </>
  );
};

export default ClubGallery;
