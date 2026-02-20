import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ImageOff, Images } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  url: string;
}

const ClubGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlbum, setShowAlbum] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("galeria-club")
          .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
        if (error) throw error;

        const imageFiles = (data || []).filter((file) =>
          /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(file.name)
        );

        const mapped: GalleryImage[] = imageFiles.map((file) => {
          const { data: urlData } = supabase.storage
            .from("galeria-club")
            .getPublicUrl(file.name);
          return { id: file.id ?? file.name, url: urlData.publicUrl };
        });
        setImages(mapped);
      } catch (err) {
        console.error("Error loading gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images.length]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="w-full aspect-[16/9] bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
        <ImageOff className="mx-auto text-muted-foreground/40 mb-4" size={48} />
        <p className="text-muted-foreground text-lg font-medium">La galería está vacía</p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Sube fotos al bucket galeria-club para verlas aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fader / Carousel */}
      <div
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-muted/20 select-none"
        style={{ pointerEvents: "none" }}
      >
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt="Foto del club"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === currentSlide ? 1 : 0 }}
          />
        ))}
        {/* Dots */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
          style={{ pointerEvents: "none" }}
        >
          {images.slice(0, 10).map((_, i) => (
            <span
              key={i}
              className={`block w-2 h-2 rounded-full transition-colors duration-300 ${
                i === currentSlide % Math.min(images.length, 10)
                  ? "bg-white"
                  : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Button */}
      {!showAlbum && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAlbum(true)}
            className="gap-2"
          >
            <Images size={20} />
            Ver Álbum Completo
          </Button>
        </div>
      )}

      {/* Masonry grid */}
      {showAlbum && (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
          {images.map((img) => {
            const isLoaded = loadedImages.has(img.id);
            return (
              <figure
                key={img.id}
                className="break-inside-avoid mb-4 overflow-hidden rounded-xl bg-muted/20 select-none"
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  pointerEvents: "none",
                }}
              >
                <img
                  src={img.url}
                  alt="Foto del club"
                  loading="lazy"
                  onLoad={() => handleImageLoad(img.id)}
                  className="w-full h-auto object-cover"
                  draggable={false}
                />
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClubGallery;
