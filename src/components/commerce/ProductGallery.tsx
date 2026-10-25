import { useState, useRef } from "react";
import type { DemoProduct } from "../../data/demo-catalog";
import { ProductImage } from "./ProductImage";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
export function ProductGallery({ product: p }: { product: DemoProduct }) {
  const [active, setActive] = useState(0),
    [open, setOpen] = useState(false),
    [zoom, setZoom] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const count = Math.max(1, p.images.length);
  const move = (n: number) => {
    setActive((a) => (a + n + count) % count);
    setZoom(false);
  };
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => {
      swiped.current = false;
      if (e.pointerType !== "mouse" && !zoom)
        start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (
        s &&
        Math.abs(e.clientX - s.x) > 48 &&
        Math.abs(e.clientX - s.x) > Math.abs(e.clientY - s.y)
      ) {
        swiped.current = true;
        move(e.clientX < s.x ? 1 : -1);
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
  return (
    <section
      className="shop-gallery"
      aria-label={`Galeria de ${p.name}`}
      onKeyDown={(e) => {
        if (zoom) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          move(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      <button
        className="shop-main-photo"
        aria-label={`Ampliar imagem ${active + 1} de ${p.name}`}
        onClick={() => {
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          setZoom(false);
          setOpen(true);
        }}
        {...swipe}
      >
        <ProductImage
          key={p.images[active]?.src ?? "empty"}
          image={p.images[active]}
          name={p.name}
          eager
        />
        <span className="shop-zoom-cue">
          <Icon name="zoom" /> Ampliar
        </span>
      </button>
      <div className="shop-thumbnails">
        {(p.images.length ? p.images : [undefined]).map((image, i) => (
          <button
            key={image?.src ?? i}
            aria-label={`Ver imagem ${i + 1} de ${p.name}`}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            <ProductImage image={image} name={p.name} eager />
          </button>
        ))}
      </div>
      <p className="shop-image-note">
        {p.images.length
          ? `${active + 1} / ${p.images.length} · Imagem ilustrativa`
          : "Fotografia a definir"}
      </p>
      {open ? (
        <Modal
          title={`Imagens de ${p.name}`}
          onClose={() => {
            setOpen(false);
            setZoom(false);
          }}
          wide
        >
          <div
            className={`shop-lightbox-photo ${zoom ? "is-zoomed" : ""}`}
            {...swipe}
          >
            <button
              onClick={() => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                setZoom((z) => !z);
              }}
              aria-label={zoom ? "Reduzir zoom" : "Aumentar zoom"}
            >
              <ProductImage
                key={p.images[active]?.src ?? "empty"}
                image={p.images[active]}
                name={p.name}
                eager
              />
            </button>
          </div>
          <div className="shop-lightbox-controls">
            <button
              onClick={() => move(-1)}
              disabled={count < 2}
              aria-label="Imagem anterior"
            >
              ←
            </button>
            <span>
              {active + 1} / {count}
            </span>
            <button
              onClick={() => move(1)}
              disabled={count < 2}
              aria-label="Próxima imagem"
            >
              →
            </button>
            <button onClick={() => setZoom((z) => !z)} aria-pressed={zoom}>
              {zoom ? "Reduzir zoom" : "Ampliar 150%"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
