import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface GalleryImage {
  name: string;
  url: string;
  caption: string;
}

const ClubGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("galeria-club")
          .list("", { limit: 50, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        const imageFiles = (data || []).filter((f) =>
          /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
        );
        setImages(
          imageFiles.map((f) => ({
            name: f.name,
            url: supabase.storage.from("galeria-club").getPublicUrl(f.name).data.publicUrl,
            caption: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
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

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  const navigate = useCallback(
    (dir: number) => {
      if (selectedIndex === null) return;
      setZoom(1);
      setSelectedIndex((selectedIndex + dir + images.length) % images.length);
    },
    [selectedIndex, images.length]
  );

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted/30 rounded-xl animate-pulse aspect-square"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
        <Maximize2 className="mx-auto text-muted-foreground/40 mb-4" size={48} />
        <p className="text-muted-foreground text-lg font-medium">
          La galería está vacía
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Sube fotos al bucket <strong>galeria-club</strong> para verlas aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Modern Bento-style Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-2 md:gap-3">
        {images.map((img, i) => {
          // Make every 5th image span 2 rows, every 7th span 2 cols for variety
          const spanRow = i % 5 === 0;
          const spanCol = i % 7 === 2;
          const isLoaded = loadedImages.has(i);

          return (
            <button
              key={img.name}
              onClick={() => {
                setSelectedIndex(i);
                setZoom(1);
              }}
              className={`group relative overflow-hidden rounded-xl bg-muted/20 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:ring-offset-2 focus:ring-offset-background transition-all duration-500
                ${spanRow && spanCol ? "row-span-2 col-span-2" : spanRow ? "row-span-2" : spanCol ? "col-span-2" : ""}
              `}
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.6s ease ${i * 80}ms, transform 0.6s ease ${i * 80}ms`,
              }}
            >
              <img
                src={img.url}
                alt={img.caption}
                loading="lazy"
                onLoad={() => handleImageLoad(i)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/0 to-foreground/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Caption on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <p className="text-primary-foreground text-xs md:text-sm font-medium truncate drop-shadow-lg">
                  {img.caption}
                </p>
              </div>

              {/* Corner accent */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/0 group-hover:bg-background/80 flex items-center justify-center transition-all duration-300 scale-0 group-hover:scale-100">
                <Maximize2 size={14} className="text-foreground" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Cinematic Lightbox */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={() => {
          setSelectedIndex(null);
          setZoom(1);
        }}
      >
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-foreground/95 backdrop-blur-2xl border-none shadow-none rounded-none [&>button]:hidden">
          {selectedIndex !== null && (
            <div className="relative flex items-center justify-center w-full h-full">
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-foreground/60 to-transparent">
                <div className="flex items-center gap-3">
                  <span className="text-primary-foreground/60 text-sm font-mono">
                    {selectedIndex + 1} / {images.length}
                  </span>
                  <span className="text-primary-foreground/40">|</span>
                  <span className="text-primary-foreground/80 text-sm font-medium">
                    {images[selectedIndex].caption}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.5, 3))}
                    className="text-primary-foreground/60 hover:text-primary-foreground p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
                    className="text-primary-foreground/60 hover:text-primary-foreground p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedIndex(null)}
                    className="text-primary-foreground/60 hover:text-primary-foreground p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors ml-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Main image */}
              <img
                src={images[selectedIndex].url}
                alt={images[selectedIndex].caption}
                className="max-w-[90vw] max-h-[85vh] object-contain select-none transition-transform duration-300 ease-out drop-shadow-2xl"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground transition-all hover:scale-110"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={() => navigate(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground transition-all hover:scale-110"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}

              {/* Thumbnail strip at bottom */}
              {images.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-foreground/60 to-transparent pt-8 pb-4 px-4">
                  <div className="flex gap-2 justify-center overflow-x-auto max-w-3xl mx-auto scrollbar-hide">
                    {images.map((img, i) => (
                      <button
                        key={img.name}
                        onClick={() => {
                          setSelectedIndex(i);
                          setZoom(1);
                        }}
                        className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden transition-all duration-300 ${
                          i === selectedIndex
                            ? "ring-2 ring-secondary scale-110 opacity-100"
                            : "opacity-40 hover:opacity-80 hover:scale-105"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubGallery;
