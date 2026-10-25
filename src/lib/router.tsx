import {
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  useEffect,
} from "react";
const preview = () => location.protocol === "file:";
const current = () =>
  preview()
    ? location.hash.startsWith("#!")
      ? location.hash.slice(2)
      : "/" + location.hash
    : location.pathname + location.search + location.hash;
const subscribe = (fn: () => void) => {
  window.addEventListener("popstate", fn);
  window.addEventListener("elite:navigate", fn);
  window.addEventListener("elite:route-restored", fn);
  window.addEventListener("hashchange", fn);
  return () => {
    window.removeEventListener("popstate", fn);
    window.removeEventListener("elite:navigate", fn);
    window.removeEventListener("elite:route-restored", fn);
    window.removeEventListener("hashchange", fn);
  };
};
export function navigate(to: string, replace = false) {
  const event = new CustomEvent("elite:before-navigation", {
    cancelable: true,
  });
  if (!window.dispatchEvent(event)) return;
  history[replace ? "replaceState" : "pushState"](
    null,
    "",
    preview() ? "#!" + to : to,
  );
  window.dispatchEvent(new CustomEvent("elite:navigate"));
}
export function useRoute() {
  return useSyncExternalStore(subscribe, current, current);
}
export function routeURL(route: string) {
  return new URL(route, "https://elite-parts.local");
}
export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
export function Link({
  href = "",
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      href={preview() && href.startsWith("/") ? "#!" + href : href}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          (!props.target || props.target === "_self") &&
          href.startsWith("/")
        ) {
          event.preventDefault();
          navigate(href);
        }
      }}
    />
  );
}
export function RouteScroll({ route }: { route: string }) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hash = routeURL(route).hash;
      const target = hash && document.getElementById(hash.slice(1));
      if (target) target.scrollIntoView();
      else {
        window.scrollTo({ top: 0, behavior: "instant" });
        if (routeURL(route).pathname !== "/")
          document
            .querySelector<HTMLElement>("[data-page-title]")
            ?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);
  return null;
}
