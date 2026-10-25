import { catalogImages } from "./catalog-images";
import type { CategoryId } from "./categories";

export interface CatalogImage {
  src: string;
  alt: string;
  attribution?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
  thumbnailWidth?: number;
  presentation?: "context";
}
export interface DemoProduct {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  details: string;
  images: CatalogImage[];
  price?: number;
  promotionalPrice?: number;
  specifications: { label: string; value: string }[];
  options: { name: string; values: string[] }[];
  installation: boolean;
  compatibility: { requiresConfirmation: true; notes: string };
  type: "produto" | "servico";
  demonstration: true;
}

const seeds: [
  string,
  string,
  CategoryId,
  string,
  boolean,
  ("produto" | "servico")?,
][] = [
  [
    "kit-lampadas-led-farois",
    "Kit de lâmpadas LED para faróis",
    "led",
    "Iluminação LED para atualizar os faróis do veículo. Consulte as opções e a aplicação.",
    true,
  ],
  [
    "iluminacao-led-interna",
    "Iluminação LED interna",
    "led",
    "Iluminação LED para modernizar os detalhes internos do veículo.",
    true,
  ],
  [
    "lampadas-farois-auxiliares",
    "Lâmpadas para faróis auxiliares",
    "led",
    "Opções de lâmpadas para os faróis auxiliares do seu carro.",
    true,
  ],
  [
    "acessorios-iluminacao",
    "Acessórios de iluminação",
    "led",
    "Complementos para o seu projeto de iluminação automotiva.",
    true,
  ],
  [
    "central-multimidia-touchscreen",
    "Central multimídia touchscreen",
    "multimidia",
    "Multimídia para renovar a experiência de uso do painel.",
    true,
  ],
  [
    "central-conectividade-smartphone",
    "Central com conectividade para smartphone",
    "multimidia",
    "Consulte centrais com recursos de conexão para o seu smartphone.",
    true,
  ],
  [
    "moldura-painel",
    "Moldura de painel",
    "multimidia",
    "Acabamento para integrar a central multimídia ao painel do veículo.",
    true,
  ],
  [
    "interface-comandos-volante",
    "Interface de comandos do volante",
    "multimidia",
    "Consulte a integração dos comandos do volante à central multimídia.",
    true,
  ],
  [
    "alto-falante-automotivo",
    "Alto-falante automotivo",
    "audio",
    "Alto-falantes para renovar o som dentro do seu carro.",
    true,
  ],
  [
    "kit-alto-falantes",
    "Kit de alto-falantes",
    "audio",
    "Um conjunto de alto-falantes para o seu projeto de áudio.",
    true,
  ],
  [
    "subwoofer",
    "Subwoofer automotivo",
    "audio",
    "Consulte opções de subwoofer para o seu projeto de som.",
    true,
  ],
  [
    "modulo-amplificador",
    "Módulo amplificador",
    "audio",
    "Amplificadores para compor o sistema de áudio do veículo.",
    true,
  ],
  [
    "tweeter-automotivo",
    "Tweeter automotivo",
    "audio",
    "Tweeters para complementar o conjunto de áudio do seu carro.",
    true,
  ],
  [
    "camera-re",
    "Câmera de ré",
    "cameras",
    "Consulte câmeras de ré e a integração ao sistema do seu veículo.",
    true,
  ],
  [
    "camera-frontal",
    "Câmera frontal",
    "cameras",
    "Opções de câmera frontal para avaliar com a equipe.",
    true,
  ],
  [
    "sensor-estacionamento",
    "Sensor de estacionamento",
    "cameras",
    "Consulte sensores de estacionamento e possibilidades de instalação.",
    true,
  ],
  [
    "alarme-automotivo",
    "Alarme automotivo",
    "seguranca",
    "Alarmes automotivos para avaliar conforme o seu veículo.",
    true,
  ],
  [
    "trava-eletrica",
    "Trava elétrica",
    "seguranca",
    "Consulte opções de travamento elétrico para o seu carro.",
    true,
  ],
  [
    "modulo-vidros-eletricos",
    "Módulo para vidros elétricos",
    "eletricos",
    "Opções de módulos para o sistema de vidros elétricos do veículo.",
    true,
  ],
  [
    "chicote-instalacao",
    "Chicote para instalação",
    "eletricos",
    "Chicotes para a integração dos acessórios ao sistema do veículo.",
    true,
  ],
  [
    "conectores-automotivos",
    "Conectores automotivos",
    "eletricos",
    "Conectores para o seu projeto de instalação automotiva.",
    false,
  ],
  [
    "acessorios-instalacao",
    "Acessórios de instalação",
    "eletricos",
    "Complementos para a instalação dos acessórios do seu carro.",
    true,
  ],
  [
    "pelicula-automotiva",
    "Instalação de película automotiva",
    "peliculas",
    "Consulte as opções de película e aplicação para os vidros do veículo.",
    true,
    "servico",
  ],
  [
    "pelicula-residencial",
    "Instalação de película residencial",
    "peliculas",
    "Aplicação de películas nos vidros do seu espaço, sob avaliação.",
    true,
    "servico",
  ],
];

// Fictitious unit prices, exclusively for the Phase 4 checkout demonstration.
const demonstrationPrices = [
  299.9, 49.9, 129.9, 79.9, 1299.9, 1599.9, 89.9, 199.9, 179.9, 449.9, 399.9,
  599.9, 89.9, 149.9, 199.9, 179.9, 249.9, 119.9, 159.9, 59.9, 29.9, 39.9,
  349.9, 499.9,
];
export const demoCatalog: DemoProduct[] = seeds.map(
  ([slug, name, category, description, installation, type], index) => ({
    id: `demo-${index + 1}`,
    slug,
    name,
    category,
    description,
    details:
      slug === "pelicula-residencial"
        ? "A equipe avalia o ambiente e os vidros antes de definir o material e a aplicação."
        : {
            led: "Conte à equipe quais pontos de iluminação você deseja atualizar para avaliar a aplicação.",
            multimidia:
              "Consulte as opções para o painel e os comandos do seu veículo.",
            audio:
              "Converse com a equipe sobre o conjunto de áudio que você deseja montar.",
            cameras:
              "A posição de instalação e a integração ao veículo serão avaliadas pela equipe.",
            seguranca:
              "A aplicação depende da avaliação do sistema elétrico do seu veículo.",
            eletricos:
              "As conexões e os componentes necessários serão definidos conforme o seu projeto.",
            peliculas:
              "A escolha do material e da aplicação será feita com a equipe.",
          }[category],
    images: catalogImages[slug] ?? [],
    installation,
    type: type ?? "produto",
    demonstration: true,
    price: demonstrationPrices[index],
    specifications: [
      {
        label: "Tipo de solução",
        value: type === "servico" ? "Serviço de instalação" : name,
      },
      { label: "Modelo e medidas", value: "Consulte as opções" },
      {
        label: "Aplicação",
        value:
          slug === "pelicula-residencial"
            ? "Vidros residenciais, sob avaliação"
            : "Conforme avaliação do veículo",
      },
    ],
    options:
      type === "servico"
        ? []
        : [
            {
              name: "Preferência para a consulta",
              values: [
                "Avaliar opções com a loja",
                "Priorizar integração original",
                "Avaliar uma atualização do conjunto",
              ],
            },
          ],
    compatibility: {
      requiresConfirmation: true,
      notes:
        category === "peliculas"
          ? "Material, aplicação e condições devem ser avaliados antes da contratação."
          : "Compatibilidade e conexões devem ser confirmadas com a Elite Parts.",
    },
  }),
);
export const findProduct = (slug: string) =>
  demoCatalog.find((p) => p.slug === slug);
