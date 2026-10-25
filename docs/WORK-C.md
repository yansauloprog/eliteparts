# WORK C — catálogo e atendimento

Base: WORK A, commit be8ab078375e03bd96fef41989a26a54db709da5.
Branch: feature/eliteparts-work-c-commerce-crm. WORK B continua adiado.

## Integração

O catálogo público usa elite_catalog (SECURITY INVOKER + RLS), com 24 registros por página, busca por SKU/nome/marca, prioridade de SKU exato, categoria e descendentes, disponibilidade, marca, preço e ordenação. Arquivados e rascunhos não aparecem. Produtos sem preço exibem “Preço sob consulta”. Fotografias respeitam capa e posição; miniaturas usam thumb_path.

As rotas antigas /checkout e subrotas abrem a lista de interesses; não há pagamento ou cadastro de visitantes. A lista guarda somente identificadores, quantidades e escolhas no navegador. Dados oficiais são consultados novamente. Favoritos usam UUIDs reais.

POST /functions/v1/elite-lead-intake é o único ingresso público de leads. Valida origem permitida, limite de 16 KB, nome, telefone internacional, ciência do aviso e de 1 a 50 produtos, com quantidades de 1 a 99. Não recebe preços oficiais do cliente. A chave privilegiada é lida exclusivamente no ambiente da Edge Function; não deve ser criada como variável VITE_.

O endpoint usa contador persistente por hash de endereço de rede (30 tentativas/hora), limite adicional de 10 registros/hora por origem e 5/hora por telefone. Não guarda IP bruto. O cabeçalho de IP deve continuar sendo fornecido/sanitizado pelo gateway Supabase; revisar esta premissa antes de adicionar outro proxy.

elite_create_lead é executável apenas pelo service_role; usa bloqueio transacional por chave UUID, fingerprint do conteúdo, snapshots oficiais e transação única para lead, itens e evento. Repetir a chave e conteúdo retorna a solicitação existente. A interface mantém hash e chave na sessão, sem guardar nome ou telefone em armazenamento local.

Após confirmação, a interface tenta abrir wa.me e mantém botão explícito de continuação. O link contém no máximo 10 itens e a referência completa do CRM. Não registra envio, entrega ou atendimento automaticamente. O status inicial permanece novo.

## Configuração

Em /admin/configuracoes, preencher whatsapp_number com o número comercial verdadeiro (país + DDD + número, somente dígitos). Sem essa configuração o backend recusa a solicitação antes de criar o lead. Nenhum número fictício deve ser aplicado ao projeto hospedado.

As origens do endpoint ficam em supabase/functions/elite-lead-intake/index.ts. Adicionar a URL exata de preview quando necessária e republicar somente a função. A origem de produção está intencionalmente ausente até aprovação da versão.

## CRM

/admin/leads e /admin/leads/:id exigem owner/admin em app_metadata.eliteparts_role. Busca/filtros e paginação de 25 itens rodam no banco. Detalhes usam snapshots e histórico. A autoria de eventos administrativos é atribuída pelo trigger a auth.uid(), substituindo valores do cliente. Mudança de status e anotação são atômicas. Dashboard agrega contagens e os cinco contatos mais recentes.

## Privacidade e operação

Aviso /privacidade, versão 2026-10-25: dados usados para orçamento e atendimento associado, sem autorização de marketing. A empresa deve revisar o aviso, definir retenção e indicar seu canal operacional para direitos dos titulares. Para pedido legítimo de exclusão: conferir identidade e solicitação, localizar registros em acesso administrativo restrito, remover/anonimizar contato e notas pessoais em transação, manter somente dados necessários com fundamento definido e registrar a operação. Não há exclusão automática nesta etapa.

## Verificação e limites

npm test executa regressões do WORK A e testes WORK C em PostgreSQL isolado (PGlite): visibilidade pública, busca, bloqueio de APIs privadas, atomicidade, adulteração de preços/SKU, snapshots, idempotência, falha parcial, CRM, autoria, filtros, dashboard e limitador persistente. npm run build inclui TypeScript.

Nenhum teste de volume de 5.000/10.000 registros foi executado; não há afirmação de capacidade comprovada nesses volumes. Não foram criados produtos/leads sintéticos no banco hospedado.

Pendências de aceite: número comercial verdadeiro; fluxo completo de navegador com produtos de teste em ambiente isolado acessível; verificação autenticada hospedada do CRM e recuperação de senha do WORK A; responsividade nos seis breakpoints. A revisão automática bloqueou o teste de criação no banco hospedado porque a autorização limita dados de teste a ambiente isolado. O preview não representa aprovação final de produção.

Auditoria Supabase: proteção contra senhas vazadas desativada (aviso de Auth existente); tabela privada de rate limit tem RLS sem policy, com acesso revogado a anon/authenticated por intenção. Nenhum desses avisos concede leitura pública de leads.
