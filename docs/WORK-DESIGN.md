# Elite Parts — Spatial Commerce

Redesign sobre b531a66a35152ebbda8adcc0677c1eb8c3f44bb2, na branch feature/eliteparts-spatial-commerce-design. O estado anterior está preservado no checkpoint local pre-spatial-commerce-20261026. Bundle de recuperação fora do repositório. Sem migrações, alterações em permissões, dados hospedados, número comercial, merge na main ou deploy de produção.

## Direção visual implementada

As 12 imagens do ZIP fornecido foram extraídas e inspecionadas individualmente antes da edição. Não são utilizadas como imagens da interface.

| Referência | Aplicação no código |
|---|---|
| 01 | Sidebar escura independente, bordas discretas e identificação da conta |
| 02 | Proporções distintas dos indicadores e encaixe do dashboard |
| 03 | Contraste entre canvas e card principal; overlays contidos |
| 04 | Cards mobile, controles e superfícies leves |
| 05 | Estrutura principal administrativa: canvas claro, navegação e densidade |
| 06 | Ações escuras/vermelhas e superfícies claras no mobile |
| 07 | Cards encaixados, filtros em cápsulas e curvaturas hierarquizadas |
| 08 | Tipografia editorial e composição da hero |
| 09 | Fotografia protagonista, assimetria e catálogo |
| 10 | Navegação flutuante e hierarquia de planos |
| 11 | Números expressivos e distribuição comercial a partir de dados reais |
| 12 | Transparência limitada à navegação e pequeno painel da hero |

Admin: sidebar e drawer, dashboard com contagens reais, produtos, tabela densa, cards mobile, editor, categorias, galeria, upload com seleção/drop, CRM, detalhes, configurações, login e estados de erro. As ações adicionais do produto ficam em um disclosure nativo acessível por teclado. Código selecionável e valores tabulares.

Público: hero sem carro, fotografia de LED já existente e explicitamente ilustrativa, navegação, seções, catálogo, filtros, cards com ação de adicionar, página individual, galeria, favoritos, lista e identificação. A fotografia não representa publicação de uma mercadoria no banco.

## Componentes e tokens

- src/design/tokens.css: cores, tipografia existente (Inter e Barlow Condensed), raios, sombras, tempos e easing.
- src/design/spatial.css: superfícies públicas, hero e comércio.
- src/admin/spatial-admin.css: composição administrativa, controles e adaptação de tabelas.
- src/components/ui/Symbol.tsx: ícones vetoriais com traço consistente, sem dependência adicional.
- DashboardMetrics, CrmOverview e StatusBadge: apresentação reutilizável. Os serviços existentes continuam responsáveis pelos dados.
- Modal, Field, Notice, Loading, ProductCard e ProductGallery preservam seus contratos e a gestão de foco existente.

Raios: 10/14/18/24/28/32 px; cápsulas em 999 px. Vermelho #E10600, preto #101114, canvas #F4F3F0, branco #FFFFFF. Foco vermelho com offset; inputs de 44–48 px; redução de movimento global; animações por opacity/transform; blur apenas em áreas pequenas e com fallback sólido.

## Regressões corrigidas

O CSS anterior de full-bleed selecionava todos os elementos main, incluindo o administrativo, e sobrescrevia espaçamento e cores com alta especificidade. A regra agora exclui a-main e deixa o tema determinar as superfícies. Isso preserva largura total no site e respiro dentro do painel.
O título do header administrativo agora identifica o CRM. A tela de acesso negado permanece dentro da composição de login. Tabelas mobile possuem rótulos por célula e ações sem depender de hover. Nome completo do produto acessível pelo título e página individual.

## Verificações realizadas

- TypeScript e build de produção aprovados. Não há script de lint instalado no projeto; nenhuma ferramenta nova foi acrescentada para isso.
- 38 grupos existentes aprovados: banco PostgreSQL isolado, RLS, permissões, serviços, processamento de imagens, atomicidade, idempotência, snapshots, WhatsApp e validações HTTP.
- 108 medições de layout: 12 telas × 9 larguras (320/360/390/430/768/1024/1280/1440/1920). Nenhum scrollWidth superior ao clientWidth.
- Telas: Home, login, dashboard, produtos, editor, categorias, CRM, detalhes, configurações, catálogo preenchido, produto e lista.
- Menu público e drawer administrativo: abertura por teclado e fechamento por Escape. Busca administrativa por código retornou o registro correspondente no laboratório.
- Fixtures e mensagens do laboratório ausentes no dist de produção. O build usa somente index.html; nenhum bundle ou HTML gerado do laboratório é publicado.
- JavaScript inicial: 466,82 kB / 135,76 kB gzip. CSS principal: 157,33 kB / 30,87 kB gzip. São tamanhos de build, não métricas de desempenho em dispositivo físico.

## Natureza das capturas e limites

O laboratório tests/build-design-lab.mjs monta os componentes reais com um adaptador offline e dados sintéticos somente leitura. Todas as capturas administrativas preenchidas exibem o aviso QA LOCAL / DADOS FICTÍCIOS / SEM CONEXÃO AO SUPABASE. O arquivo tests/design-fixture.ts não é importado pelo código src. Isso é verificação visual, não evidência de login, escrita no banco ou autorização real.

Comparação administrativa anterior: mesmo adaptador e dados, usando os componentes preservados de b531a66. Home e login também foram inspecionados na aplicação normal. As capturas não são imagens de referência nem representações geradas.

Não declarar o WORK DESIGN operacionalmente aprovado sem validar uma sessão administrativa hospedada: login, CRUD, categoria, upload, atualização do CRM e histórico. Teste em dispositivo físico, teclado virtual e Safari/iOS também permanece pendente. Recuperação de senha continua fora da validação solicitada anteriormente.

O endpoint atual de leads permite somente as origens dos Previews C/D e os hosts locais configurados. Uma nova origem de Preview exige revisão da allowlist antes de aprovar o fluxo hospedado orçamento → WhatsApp nessa URL. Não alterar o endpoint ou publicar uma nova versão do backend como parte de uma edição apenas visual sem coordenação explícita. A implementação de registro e a configuração comercial foram preservadas.

## Reprodução local

Executar npm ci, npm run typecheck, npm test e npm run build. Para revisão visual isolada: node tests/build-design-lab.mjs; servir o projeto com Vite e abrir /.design-qa/after.html. A ferramenta tests/viewports.html fornece as nove larguras. O laboratório recusa gravações e não testa credenciais reais.

WORK B permanece adiado. Nenhuma aprovação de produção é inferida desta entrega.
