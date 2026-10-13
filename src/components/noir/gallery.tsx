import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { filterGallery } from "@/lib/noir-data";
export function Gallery() {
  const { data } = useDemo();
  const [filter, setFilter] = useState("ALL");
  const [current, setCurrent] = useState<number | null>(null);
  const categories = ["ALL", ...new Set(data.gallery.map((g) => g.category))];
  const items = filterGallery(data.gallery, filter);
  const selected = current === null ? undefined : items[current];
  function move(delta: number) {
    setCurrent((c) =>
      c === null || !items.length ? null : (c + delta + items.length) % items.length,
    );
  }
  useEffect(() => {
    if (current === null) return;
    function key(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [current, items.length]);
  return (
    <>
      <div className="filters" aria-label="Gallery categories">
        {categories.map((c) => (
          <Button
            key={c}
            variant={filter === c ? "default" : "ghost"}
            aria-pressed={filter === c}
            onClick={() => {
              setFilter(c);
              setCurrent(null);
            }}
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="gallery-grid">
        {items.map((g, i) => (
          <Button
            key={g.id}
            variant="ghost"
            className="gallery-item"
            onClick={() => setCurrent(i)}
            aria-label={`View ${g.title}`}
          >
            <img src={g.image} alt={g.title} width="864" height="1104" loading="lazy" decoding="async" />
            <span>
              <small>{g.category} / 0{i + 1}</small>{g.title}
            </span>
          </Button>
        ))}
      </div>
      {items.length === 0 && <p className="sample-note">No images in this collection yet.</p>}
      <p className="sample-note">
        AI-generated editorial concepts · Replaceable imagery, not customer results or salon work.
      </p>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(v) => {
          if (!v) setCurrent(null);
        }}
      >
        <DialogContent className="lightbox">
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>
            NOIR PINK · {selected?.category} · Concept photography
          </DialogDescription>
          {selected && <img key={selected.id} className="lightbox-photo" src={selected.image} alt={selected.title} width="864" height="1104" decoding="async" />}
          <div className="lightbox-controls">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous image"
              onClick={() => move(-1)}
            >
              <ArrowLeft />
            </Button>
            <p>
              {current === null ? 0 : current + 1} / {items.length}
            </p>
            <Button variant="outline" size="icon" aria-label="Next image" onClick={() => move(1)}>
              <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
