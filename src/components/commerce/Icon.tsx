export function Icon({
  name,
}: {
  name:
    | "search"
    | "heart"
    | "bag"
    | "close"
    | "arrow"
    | "filter"
    | "eye"
    | "plus"
    | "minus"
    | "share"
    | "zoom"
    | "check";
}) {
  const paths = {
    search: "m20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8",
    bag: "M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2",
    close: "m6 6 12 12M6 18 18 6",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    filter: "M4 7h16M4 17h16M8 4v6m8 4v6",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    share: "M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8",
    zoom: "M10 7v6m-3-3h6m3 6 5 5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
