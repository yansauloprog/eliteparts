import { useEffect } from "react";
export function useReveal(route: string) {
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window) || media.matches) return;
    const targets = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "seen";
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    const scan = () => {
      document
        .querySelectorAll<HTMLElement>(
          ".shop-results-heading, .shop-carousel-heading, .shop-product-card, .shop-editorial, .services-header, .service-list, .visit-section",
        )
        .forEach((el) => {
          if (targets.has(el) || el.dataset.reveal === "seen") return;
          targets.add(el);
          el.dataset.reveal = "pending";
          if (el.classList.contains("shop-product-card")) {
            const index = Array.from(el.parentElement?.children ?? []).indexOf(
              el,
            );
            el.style.setProperty(
              "--reveal-delay",
              `${Math.min((index % 5) * 65, 260)}ms`,
            );
          }
          observer.observe(el);
        });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    const reduce = () => {
      if (media.matches) {
        observer.disconnect();
        targets.forEach((el) => (el.dataset.reveal = "seen"));
      }
    };
    media.addEventListener("change", reduce);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      media.removeEventListener("change", reduce);
      targets.forEach((el) => {
        if (el.dataset.reveal === "pending") el.dataset.reveal = "seen";
      });
    };
  }, [route]);
}
