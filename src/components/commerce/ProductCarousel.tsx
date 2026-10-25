import { useEffect, useRef } from "react";
import type { DemoProduct } from "../../data/demo-catalog";
import { ProductCard } from "./ProductCard";
import { Link } from "../../lib/router";
export function ProductCarousel({
  title,
  subtitle,
  products,
  category,
}: {
  title: string;
  subtitle: string;
  products: DemoProduct[];
  category?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const cancelMove = () => cancelAnimationFrame(frame.current);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const move = (direction: number) => {
    const rail = ref.current;
    if (!rail) return;
    cancelMove();
    const start = rail.scrollLeft;
    const target = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, start + direction * rail.clientWidth * .75));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { rail.scrollLeft = target; return; }
    const began = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / 400);
      rail.scrollLeft = start + (target - start) * (1 - Math.pow(1 - progress, 3));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  return (
    <section className="shop-carousel">
      <div className="shop-carousel-heading">
        <div>
          <p className="shop-category-label">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <div>
          {category ? (
            <Link
              href={`/catalogo?categoria=${category}`}
              className="shop-text-link"
            >
              Ver todos
            </Link>
          ) : null}
          <button aria-label={`Voltar em ${title}`} onClick={() => move(-1)}>
            ←
          </button>
          <button aria-label={`Avançar em ${title}`} onClick={() => move(1)}>
            →
          </button>
        </div>
      </div>
      <div className="shop-product-rail" ref={ref} onPointerDown={cancelMove} onWheel={cancelMove}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
