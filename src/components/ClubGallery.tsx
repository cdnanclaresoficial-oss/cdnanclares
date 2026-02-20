import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ImageOff } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  titulo: string;
}

const ClubGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from("galeria")
          .select("id, url, titulo")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setImages(data || []);
      } catch (err) {
        console.error("Error loading gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  }, []);

  if (loading) {
    return (
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 bg-muted/30 rounded-xl animate-pulse aspect-square"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
        <ImageOff className="mx-auto text-muted-foreground/40 mb-4" size={48} />
        <p className="text-muted-foreground text-lg font-medium">La galería está vacía</p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Añade fotos a la tabla <strong>galeria</strong> para verlas aquí.
        </p>
      </div>
    );
  }

  return (
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
              alt={img.titulo || "Foto del club"}
              loading="lazy"
              onLoad={() => handleImageLoad(img.id)}
              className="w-full h-auto object-cover"
              draggable={false}
            />
            {img.titulo && (
              <figcaption className="px-3 py-2 text-xs text-muted-foreground font-medium">
                {img.titulo}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
};

export default ClubGallery;
