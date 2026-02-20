import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  name: string;
  url: string;
}

const ClubGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

        const urls = imageFiles.map((f) => ({
          name: f.name,
          url: supabase.storage.from("galeria-club").getPublicUrl(f.name).data.publicUrl,
        }));

        setImages(urls);
      } catch (err) {
        console.error("Error loading gallery:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const navigate = (dir: number) => {
    if (selectedIndex === null) return;
    const next = (selectedIndex + dir + images.length) % images.length;
    setSelectedIndex(next);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay imágenes en la galería aún. Sube fotos al bucket <strong>galeria-club</strong> en Supabase.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={img.name}
            onClick={() => setSelectedIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={img.url}
              alt={img.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-navy-deep/0 group-hover:bg-navy-deep/30 transition-colors duration-300" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-navy-deep border-border overflow-hidden">
          {selectedIndex !== null && (
            <div className="relative">
              <img
                src={images[selectedIndex].url}
                alt={images[selectedIndex].name}
                className="w-full max-h-[80vh] object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => navigate(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-navy-deep/80 px-4 py-2 text-center">
                <span className="text-primary-foreground/70 text-sm">{selectedIndex + 1} / {images.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubGallery;
