import { useT } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { filterGallery } from "@/lib/noir-data";
export function Gallery() {
  const { m, c, t, fa } = useT();
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
        move(fa ? -1 : 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(fa ? 1 : -1);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [current, items.length, fa]);
  return (
    <>
      <div className="filters" aria-label={m("Gallery categories")}>
        {categories.map((category) => (
          <Button
            key={category}
            variant={filter === category ? "default" : "ghost"}
            aria-pressed={filter === category}
            onClick={() => {
              setFilter(category);
              setCurrent(null);
            }}
          >
            {c(category)}
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
            aria-label={t(`View ${g.title}`, `نمایش ${c(g.title)}`)}
          >
            <img src={g.image} alt={c(g.title)} width="864" height="1104" loading="lazy" decoding="async" />
            <span>
              <small>{c(g.category)} / 0{i + 1}</small>{c(g.title)}
            </span>
          </Button>
        ))}
      </div>
      {items.length === 0 && <p className="sample-note">{m("No images in this collection yet.")}</p>}
      <p className="sample-note">{m("AI-generated editorial concepts · Replaceable imagery, not customer results or salon work.")}</p>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(v) => {
          if (!v) setCurrent(null);
        }}
      >
        <DialogContent className="lightbox">
          <DialogTitle>{c(selected?.title || "")}</DialogTitle>
          <DialogDescription>
            NOIR PINK · {c(selected?.category || "")} · {m("Concept photography")}
          </DialogDescription>
          {selected && <img key={selected.id} className="lightbox-photo" src={selected.image} alt={c(selected.title)} width="864" height="1104" decoding="async" />}
          <div className="lightbox-controls">
            <Button
              variant="outline"
              size="icon"
              aria-label={m("Previous image")}
              onClick={() => move(-1)}
            >
              {fa ? <ArrowRight /> : <ArrowLeft />}
            </Button>
            <p>
              {current === null ? 0 : current + 1} / {items.length}
            </p>
            <Button variant="outline" size="icon" aria-label={m("Next image")} onClick={() => move(1)}>
              {fa ? <ArrowLeft /> : <ArrowRight />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
