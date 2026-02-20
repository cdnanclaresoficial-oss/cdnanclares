import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

interface GalleryImage {
  name: string;
  url: string;
}

const ClubGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("galeria-club")
          .list("", { limit: 50, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        const imageFiles = (data || []).filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name));
        setImages(
          imageFiles.map((f) => ({
            name: f.name,
            url: supabase.storage.from("galeria-club").getPublicUrl(f.name).data.publicUrl,
          }))
        );
      } catch (err) {
        console.error("Error loading gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const navigate = useCallback(
    (dir: number) => {
      if (selectedIndex === null) return;
      setZoom(1);
      setSelectedIndex((selectedIndex + dir + images.length) % images.length);
    },
    [selectedIndex, images.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIndex, navigate]);

  if (loading) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-lg animate-pulse" style={{ height: `${150 + (i % 3) * 80}px` }} />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay imágenes en la galería aún. Sube fotos al bucket <strong>galeria-club</strong>.
      </p>
    );
  }

  return (
    <>
      {/* Masonry Grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {images.map((img, i) => (
          <button
            key={img.name}
            onClick={() => { setSelectedIndex(i); setZoom(1); }}
            className="group relative block w-full overflow-hidden rounded-lg bg-muted break-inside-avoid focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:shadow-xl hover:z-10"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <img
              src={img.url}
              alt={img.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => { setSelectedIndex(null); setZoom(1); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none backdrop-blur-md [&>button]:hidden">
          {selectedIndex !== null && (
            <div className="relative flex items-center justify-center w-full h-[90vh]">
              {/* Close */}
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Zoom controls */}
              <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button onClick={() => setZoom((z) => Math.min(z + 0.5, 3))} className="bg-background/80 hover:bg-background rounded-full p-2 transition-colors">
                  <ZoomIn size={18} />
                </button>
                <button onClick={() => setZoom((z) => Math.max(z - 0.5, 1))} className="bg-background/80 hover:bg-background rounded-full p-2 transition-colors">
                  <ZoomOut size={18} />
                </button>
              </div>

              {/* Image */}
              <img
                src={images[selectedIndex].url}
                alt={images[selectedIndex].name}
                className="max-w-full max-h-[85vh] object-contain rounded-lg transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
              />

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-3 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => navigate(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-3 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Counter + caption */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-background/80 rounded-full px-4 py-2 text-sm font-medium">
                  {selectedIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubGallery;
