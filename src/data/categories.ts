export const categories = [
  { id: "led", name: "Iluminação LED", short: "Iluminação" },
  { id: "multimidia", name: "Centrais multimídia", short: "Multimídia" },
  { id: "audio", name: "Som automotivo", short: "Áudio" },
  { id: "cameras", name: "Câmeras automotivas", short: "Câmeras" },
  { id: "seguranca", name: "Alarmes e segurança", short: "Segurança" },
  { id: "eletricos", name: "Acessórios elétricos", short: "Elétrica" },
  { id: "peliculas", name: "Películas e instalação", short: "Películas" },
] as const;
export type CategoryId = (typeof categories)[number]["id"];
export const categoryName = (id: CategoryId) =>
  categories.find((c) => c.id === id)!.name;
