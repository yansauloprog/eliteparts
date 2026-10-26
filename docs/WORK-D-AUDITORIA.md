# WORK D — auditoria técnica (26/10/2026)
## Parecer atual
**Migração e fluxo público hospedado verificados; CRM autenticado pendente de login.** Recuperação de senha excluída desta etapa por instrução do usuário. WORK B permanece adiado e produção não foi alterada.

## Base preservada
Base remota WORK C: 8f3df454550f02cfc8345b166555571dc23559fd. O commit local e14fc12 está preservado em checkpoint/work-c-local, com ajuste posterior de rewrite de privacidade. A árvore da base remota corresponde à versão local concluída do C.
Branch de trabalho: feature/eliteparts-work-d-final-audit. Checkpoint Git e bundle de recuperação foram gerados fora do conteúdo público. Worktree inicialmente limpo. Não houve merge na main, force push, alteração de domínios ou produção Vercel.

## Defeitos e correções
| Gravidade | Problema | Correção / evidência |
|---|---|---|
| Alto | Proteção contra abuso dependia de x-forwarded-for sem garantia documental de saneamento pelo gateway | Endpoint v2 usa bucket global constante, independente dos cabeçalhos. Migração D melhora janelas globais para 30/min e 120/h; migração aplicada e registrada no ambiente hospedado. Testes alteram cabeçalhos e confirmam bucket invariável. |
| Alto | Uma tentativa salva com falha de rede podia reaproveitar chave ao editar nome/itens | Identidade hash/chave agora muda com o conteúdo, persiste para retries e funciona com armazenamento bloqueado. |
| Médio | Restauração admitia até 100 linhas e opções duplicavam UUID, mas backend aceita 50 produtos únicos | Decoder limita a 50 e consolida UUIDs; adição respeita limite com feedback. Quantidades entre 1 e 99. |
| Médio | Custos de galeria/especificações calculados para todos os resultados antes da paginação | Migração D enriquece somente a página de 24 linhas. Validada isoladamente e aplicada no ambiente hospedado. |
| Médio | UUIDs/payloads inválidos e erros do provedor podiam gerar mensagens internas | Handler compartilhado validado por HTTP, whitelist de erros comerciais e falhas genéricas de rede; payload canônico remove preço/SKU do navegador. |
| Médio | UPDATE direto administrativo de status não obrigava histórico | Trigger transacional na migração D atribui a autoria ao usuário autenticado também nessa operação. Teste isolado aprovado; função e trigger confirmados no banco hospedado. Interação autenticada ainda pendente. |
| Médio | Troca de filtros desmontava o catálogo e podia perder foco durante busca | Removida remontagem por URL; debounce observa rota atual. |
| Médio | Dependências com alertas de segurança | Vite atualizado de 7.3.1 para 7.3.7, esbuild fixado em 0.28.1 e override consistente. npm audit: zero vulnerabilidades. Lockfile atualizado de forma dirigida. |
| Baixo | Teste de falha da miniatura era aleatório quando UUID continha -480 | Matcher passou a reconhecer apenas sufixo -480.webp; regressões aprovadas. |
| Baixo | Cards podiam solicitar galeria grande; mensagens wa.me longas excediam tamanho confortável | Cards usam miniaturas; mensagem longa usa resumo com referência, preservando todos os snapshots no CRM. |
| Baixo | README descrevia site demonstrativo | Documentação atualizada com catálogo real, CRM, variáveis, limites, migrações pendentes, preview, publicação e rollback. |

## Testes executados
- npm ci, TypeScript e build: aprovados após alterações.
- 13 grupos PostgreSQL do WORK A: RLS, escrita anônima, metadados editáveis, SKU, preço decimal, atomicidade, capas, arquivamento, ciclos de categorias, auditoria, paginação com 1.201 registros isolados e contagens.
- 10 grupos de serviços: identidade getUser/app_metadata, negação de login comum, recuperação SDK, logout, imagens/miniaturas e compensação de falhas.
- 5 grupos WORK C: catálogo público, registro atômico/snapshots, idempotência, rollback, CRM/autoria, filtros/dashboard e limitador.
- 10 grupos WORK D: CORS/métodos; 13 variantes inválidas e limite 16 KB; payload canônico; falhas/limites; identidade de tentativa; restauração; WhatsApp 1/3/10/11/50 itens; HTTP→PostgreSQL real isolado; produtos ocultos/indisponíveis; filtros e UPDATE com autoria.
- API hospedada: consulta pública, RPC paginada, negação de leitura de leads/auditoria e negação de RPCs administrativos a anônimos.
- Após autorização, os sete testes da API hospedada passaram, incluindo criação/alteração/upload negados a anônimos.
- Fluxo no Preview: dois produtos fictícios, duas unidades de um e uma do outro; registro único com snapshots, privacidade confirmada e estado novo. Link WhatsApp com número oficial, nomes/SKUs/quantidades e referência; abertura observada, sem envio de mensagem.
- Limpeza confirmada: removidos somente o lead e os dois produtos fictícios. Banco retornou a 1 produto original, 0 produtos públicos, 0 leads/itens/eventos. Logs de auditoria preservados.
- TypeScript e build passaram após corrigir breadcrumb de produto sem categoria, que antes gerava categoria=null.

## Auditoria do ambiente hospedado
Migrações A, C e D confirmadas. D registrada como versão 20261026151345, nome work_d_hardening, correspondente ao arquivo 20261026040912_work_d_hardening.sql. Função elite_private.crm_status_history(), trigger elite_lead_status_history e policy privada de negação confirmados. Endpoint corrigido implantado como versão 2, ativo.
RLS verificada nas tabelas públicas; RPCs privilegiadas elite_create_lead/elite_lead_admission executáveis somente por service_role; funções administrativas usam SECURITY INVOKER e verificam app_metadata. Bucket público para leitura de fotos, escrita restrita por políticas administrativas. Owner confirmado por contagem, sem divulgar dados da conta.
Sem leads órfãos. Sem leitura pública de contatos. Código e histórico não devem conter segredos; a varredura final acompanha a entrega.
Advisors: proteção de senha vazada desativada (configuração Auth), índice duplicado elite_leads_status_date / leads_status_created_idx e índices ainda sem uso. Tabela privada de limites agora possui policy explícita de negação. Não foram removidos índices válidos por ausência de tráfego.

## Verificação hospedada e limites
| Verificação | Resultado |
|---|---|
| Migração D e histórico do provedor | PASS |
| Preview D, commit 64bd307, deployment dpl_2jBu76AdLmebEzUk7g5NB2kDwWnx | READY |
| Home, catálogo com produtos, produto, lista preenchida, formulário e login | Sem overflow horizontal em 320/390/768/1024/1440/1920 |
| Orçamento → banco → link e abertura WhatsApp | PASS |
| Preços e quantidades de snapshots; privacidade; estado novo | PASS |
| API hospedada e negação de acesso anônimo | 7 grupos PASS |
| CRM, dashboard e detalhes autenticados no navegador | PENDENTE — solicitação segura de login retornou declined |
| Recuperação de senha | Fora do escopo, por instrução do usuário |

Larguras verificadas pelo iframe de QA do próprio Preview: são viewports CSS de desktop, não dispositivos físicos. Não substituem teste de teclado virtual, Safari/iOS ou desempenho móvel. Capturas reais de Home mobile, login e confirmação foram feitas; não há capturas de CRM autenticado nem alegação de aprovação desse fluxo. O formulário capturado estava em 1024 px.
O registro de teste tinha dois produtos e três unidades, subtotal informativo R$ 1.199,70. O WhatsApp foi preparado para +55 84 98709-9386. A abertura não altera o contato para atendido ou enviado. Não houve mensagem real enviada.
Concorrência entre conexões hospedadas e benchmark com 5.000/10.000 produtos não foram medidos. Dados do responsável, retenção e canal de titulares dependem da empresa. A cota global pode ser consumida deliberadamente; avaliar proteção antispam conforme volume, sem serviço pago adicionado.

## Prévia e rollback
A candidata permanece exclusivamente em branch de feature e Preview protegido. A versão de produção deve permanecer dpl_33idhdXxEZJBnohCMpjC6gfSbJcc.
Não remover ignoreCommand ou Deployment Protection. Somente após aprovação e eliminação dos bloqueios: revisar as variáveis do ambiente de produção, adicionar origem de produção ao endpoint e Redirect URLs do Auth, aplicar migrações pendentes uma vez e usar o procedimento de publicação autorizado.
Rollback do frontend: restaurar o deployment estável no projeto existente. Não reverter schema apagando dados. Endpoint v2 pode voltar à fonte anterior caso necessário, observando que ela dependia de IP não verificado.

## Situação e publicação
WORK D ainda não encerrado: falta validar login owner, listagem/detalhes do CRM, mudança de situação, anotação/histórico e dashboard em sessão autenticada. Não avançar ao WORK B.
Código publicado exclusivamente em feature/eliteparts-work-d-final-audit, inicialmente no commit remoto 64bd307daad916e307863166ca173bb3c98e2067, com árvore 8a3033fea74d3bc57dc1e160e8996673439f3155 conferida contra a fonte local. A atualização seguinte corrige apenas o breadcrumb sem categoria e registra estas evidências.
Preview: https://eliteparts-git-feature-eliteparts-work-d-final-audit-yanprog.vercel.app/
Produção conferida pelo domínio oficial: dpl_33idhdXxEZJBnohCMpjC6gfSbJcc, READY. Nenhum merge, deploy ou promoção de produção foi executado.
JavaScript inicial: base 488,89 KB / 139,85 KB gzip; atualização D 467,35 KB / 135,84 KB gzip. São tamanhos de build, não métricas de celular.
Varredura anterior: 147 arquivos sem credenciais privadas e histórico público revisado. Bundle de recuperação, env local, capturas e ZIP ficam fora do repositório público.

## Matriz dos testes isolados D
| Grupo | Resultado |
|---|---|
| Métodos HTTP, CORS e preflight | PASS |
| JSON inválido, nome/telefone, ciência, IDs, duplicatas e quantidades | PASS |
| Remoção de preços/SKU forjados e independência de cabeçalhos IP | PASS |
| Falha de rede, limite persistente e sanitização de erros | PASS |
| Chave de tentativa: retry, edição, recarregamento e armazenamento bloqueado | PASS |
| Lista: restauração, UUID único, limite de 50 e quantidade de 1 a 99 | PASS |
| WhatsApp: 1, 3, 10, 11 e 50 itens, acentuação e tamanho da URL | PASS |
| HTTP real da função compartilhada → RPC PostgreSQL isolado → snapshots/replay | PASS |
| Produto oculto, arquivado, indisponível e inexistente com rollback | PASS |
| Filtros malformados e UPDATE direto de status com autoria | PASS |
Os 28 grupos A/C anteriores também passaram. Seus nomes e assertions permanecem em tests/database.test.mjs, tests/services.test.mjs e tests/work-c.test.mjs. O erro aleatório do matcher de miniatura foi corrigido e o respectivo teste executado novamente.
