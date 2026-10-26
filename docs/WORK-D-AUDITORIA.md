# WORK D — auditoria técnica (26/10/2026)
## Parecer atual
**Bloqueado para aprovação técnica final e produção.** Código corrigido e testes isolados aprovados; não confundir com execução ponta a ponta hospedada. O catálogo comercial completo também depende dos produtos reais (WORK B adiado).

## Base preservada
Base remota WORK C: 8f3df454550f02cfc8345b166555571dc23559fd. O commit local e14fc12 está preservado em checkpoint/work-c-local, com ajuste posterior de rewrite de privacidade. A árvore da base remota corresponde à versão local concluída do C.
Branch de trabalho: feature/eliteparts-work-d-final-audit. Checkpoint Git e bundle de recuperação foram gerados fora do conteúdo público. Worktree inicialmente limpo. Não houve merge na main, force push, alteração de domínios ou produção Vercel.

## Defeitos e correções
| Gravidade | Problema | Correção / evidência |
|---|---|---|
| Alto | Proteção contra abuso dependia de x-forwarded-for sem garantia documental de saneamento pelo gateway | Endpoint v2 usa bucket global constante, independente dos cabeçalhos. Migração D melhora janelas globais para 30/min e 120/h; até aplicá-la, o banco conserva a janela anterior de 30/h. Testes alteram cabeçalhos e confirmam bucket invariável. |
| Alto | Uma tentativa salva com falha de rede podia reaproveitar chave ao editar nome/itens | Identidade hash/chave agora muda com o conteúdo, persiste para retries e funciona com armazenamento bloqueado. |
| Médio | Restauração admitia até 100 linhas e opções duplicavam UUID, mas backend aceita 50 produtos únicos | Decoder limita a 50 e consolida UUIDs; adição respeita limite com feedback. Quantidades entre 1 e 99. |
| Médio | Custos de galeria/especificações calculados para todos os resultados antes da paginação | Migração D enriquece somente a página de 24 linhas. Validada isoladamente; aplicação hospedada pendente. |
| Médio | UUIDs/payloads inválidos e erros do provedor podiam gerar mensagens internas | Handler compartilhado validado por HTTP, whitelist de erros comerciais e falhas genéricas de rede; payload canônico remove preço/SKU do navegador. |
| Médio | UPDATE direto administrativo de status não obrigava histórico | Trigger transacional na migração D atribui a autoria ao usuário autenticado também nessa operação. Teste isolado aprovado; hospedagem pendente. |
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
- Três sondagens negativas de escrita/Storage ficaram SKIP por não haver autorização para gravações de teste no banco real.
- Zero leads de teste foram criados no projeto hospedado. Testes sintéticos usam PGlite, não produção.

## Auditoria do ambiente hospedado
Migrações A e C e Edge Function inicial confirmadas por leitura do provedor. Endpoint corrigido implantado como versão 2, ativo.
RLS verificada nas tabelas públicas; RPCs privilegiadas elite_create_lead/elite_lead_admission executáveis somente por service_role; funções administrativas usam SECURITY INVOKER e verificam app_metadata. Bucket público para leitura de fotos, escrita restrita por políticas administrativas. Owner confirmado por contagem, sem divulgar dados da conta.
Sem leads órfãos. Sem leitura pública de contatos. Código e histórico não devem conter segredos; a varredura final acompanha a entrega.
Advisors: proteção de senha vazada desativada (configuração Auth), índice duplicado elite_leads_status_date / leads_status_created_idx e índices ainda sem uso. Tabela privada de limites com RLS sem policy é deny-by-default; migração D acrescenta policy explícita de negação. Não foram removidos índices válidos por ausência de tráfego.

## Bloqueios e limites das evidências
1. Migração 20261026040912_work_d_hardening.sql não aplicada no Supabase: conector retornou Invalid or expired requestState em tentativas verificadas; consulta confirma ausência do novo trigger. SQL local passou nos testes. Não substituir por execução manual sem coordenar acesso e verificar histórico.
2. Fluxo público completo hospedado depende de poucos produtos/leads de teste autorizados no projeto existente. Não publicar o produto real existente apenas para teste.
3. Login/CRM autenticados e recuperação por e-mail exigem conta administrativa acessível na sessão do navegador e participação do proprietário para redefinir senha. Não foram classificados como aprovados.
4. Concorrência real entre conexões PostgreSQL não foi medida em PGlite; replay foi verificado e locks transacionais existem no código.
5. Não houve benchmark de 5.000/10.000 produtos. Busca por substring ainda pode fazer varredura; a paginação limita o resultado, mas o plano deve ser medido com dados representativos no WORK B.
6. Testes de teclado virtual em dispositivo físico e acesso visual autenticado ao painel continuam pendentes.
7. Dados do responsável, canal para titulares, retenção e procedimento operacional de exclusão precisam de validação da empresa.
8. A cota global reduz evasão por IP forjado, mas pode ser consumida deliberadamente. Um desafio antispam com verificação server-side deve ser avaliado conforme exposição/volume; nenhum serviço pago foi adicionado.

## Prévia e rollback
A candidata permanece exclusivamente em branch de feature e Preview protegido. A versão de produção deve permanecer dpl_33idhdXxEZJBnohCMpjC6gfSbJcc.
Não remover ignoreCommand ou Deployment Protection. Somente após aprovação e eliminação dos bloqueios: revisar as variáveis do ambiente de produção, adicionar origem de produção ao endpoint e Redirect URLs do Auth, aplicar migrações pendentes uma vez e usar o procedimento de publicação autorizado.
Rollback do frontend: restaurar o deployment estável no projeto existente. Não reverter schema apagando dados. Endpoint v2 pode voltar à fonte anterior caso necessário, observando que ela dependia de IP não verificado.

## Situação
**Não recomendado publicar em produção agora.** WORK B permanece adiado. Conclusão do WORK D depende de migração hospedada e testes completos com autenticação e dados autorizados.

## Fechamento da execução
- Código candidato salvo localmente na branch D; sua publicação foi rejeitada pela revisão automática por falta de autorização explícita para essa branch. A autorização anterior reconhecida não foi considerada suficiente para o WORK D. Não houve tentativa de contornar o bloqueio.
- Não foi gerado preview da candidata D. A URL anterior do WORK C continua sendo versão C e não deve ser apresentada como evidência das correções visuais D.
- Migração D continua não aplicada; o conector falhou com Invalid or expired requestState, inclusive após separar a remoção do índice duplicado. Índice duplicado foi mantido. Nenhum erro do conector foi tratado como aprovação.
- Não foram produzidas capturas falsas: home mobile/desktop, produto, formulário, dashboard, CRM e detalhes da candidata D aguardam a publicação e o acesso/dados de teste necessários.
- JavaScript inicial de build: 488,89 KB / 139,85 KB gzip na base; 467,31 KB / 135,83 KB gzip na candidata. Créditos passaram para chunk carregado sob demanda. São tamanhos de build, não métricas de carregamento real em celular.
- Varredura de fonte: 147 arquivos verificados antes do commit, sem credenciais privadas ou artefatos de recuperação entre os arquivos destinados ao repositório.
- Nenhuma promoção Vercel foi feita. Deployment de produção confirmado: dpl_33idhdXxEZJBnohCMpjC6gfSbJcc (READY).

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
