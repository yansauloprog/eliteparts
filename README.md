# Elite Parts — catálogo, administração e CRM

Aplicação React 19 + TypeScript + Vite, Supabase Auth/PostgreSQL/Storage e Vercel. A hero e a identidade aprovada são preservadas. WORK B (importação em massa) permanece adiado.

## Instalação e comandos
Requer Node.js 22 ou 24 e npm. Execute `npm ci`, copie `.env.example` para `.env.local` e preencha apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Execute `npm run dev -- --host 127.0.0.1`.
- `npm run typecheck`: TypeScript.
- `npm run build`: compilação de produção.
- `npm test`: banco PostgreSQL isolado, serviços, HTTP e validações do WORK D.
- `npm run test:live`: consultas e testes de leitura contra o Supabase configurado. Não grava dados por padrão. Sondagens negativas de INSERT/UPDATE/Storage existem, mas exigem autorização explícita e `ELITE_ALLOW_WRITE_PROBES=1`.
A chave publicável é adequada ao navegador; o acesso aos dados continua controlado pelas RLS. Segredos não devem ter prefixo VITE_.

## Arquitetura e funcionalidades
O catálogo usa `elite_catalog`, com paginação de 24 itens, filtros e ordenação no servidor. Apenas produtos publicados e não arquivados aparecem. Preços ausentes permanecem sob consulta; códigos comerciais são textuais e preservam zeros. Alterações administrativas refletem na próxima consulta, sem novo deploy.
As rotas `/produto/:slug` mostram dados e fotografias reais. Imagens são vinculadas por UUID, convertidas em WebP com galeria até 1600px e miniatura até 480px; capa e ordem são persistidas. O bucket público deve conter somente imagens comerciais.
Favoritos e lista de interesses ficam temporariamente no navegador; nomes, preços e disponibilidade são reconsultados. A lista aceita até 50 produtos e 99 unidades por produto. As antigas rotas `/checkout` abrem a lista, sem pagamentos ou contas de visitantes.
O botão de orçamento exige nome, telefone internacional e ciência do aviso. O backend registra lead, snapshots dos produtos e evento em uma transação antes de retornar o link wa.me. Redirecionamento não comprova envio, entrega ou atendimento.
`site_settings.whatsapp_number` armazena o número comercial aprovado, editável por administrador; sem configuração o registro falha de forma explícita.

## Backend e segurança
`supabase/functions/elite-lead-intake` é uma função pública para visitantes, com validação de payload até 16 KB, IDs/quantidades, nomes/telefones, CORS explícito e respostas sanitizadas. Lê `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no runtime do servidor. Nunca colocar essa chave em frontend, Git ou ZIP.
Somente service_role pode executar `elite_create_lead` e `elite_lead_admission`. As funções administrativas exigem autorização por `app_metadata.eliteparts_role` (owner/admin), não user_metadata.
O WORK D deixa de confiar em x-forwarded-for: a admissão usa um contador global persistente. Na migração D, há limite de 30 tentativas/minuto e 120/hora, mais controle transacional por telefone. Até a migração D ser aplicada, a função já implantada usa o contador anterior com um bucket global constante, limitando a 30 tentativas/hora. Origem não é autenticação. Um atacante ainda pode consumir a cota global; em maior exposição comercial, considerar desafio antispam validado no servidor.
A idempotência utiliza UUID e fingerprint; o navegador mantém somente hash e chave da tentativa, sem nome/telefone em armazenamento. Dados editados geram nova chave. Falhas preservam a lista e oferecem nova tentativa.

## Administração e autenticação
Rotas: `/admin/login`, `/admin`, `/admin/produtos`, `/admin/categorias`, `/admin/configuracoes`, `/admin/leads` e `/admin/leads/:id`.
O CRM pagina 25 contatos, oferece filtros, snapshots, situação, anotações e histórico atribuído pelo banco. O dashboard agrega contagens reais. A migração D acrescenta histórico também para UPDATE direto de situação; até sua implantação essa melhoria existe apenas no código e nos testes isolados.
O primeiro owner deve existir no Auth, ter e-mail confirmado e receber app_metadata pelo procedimento privilegiado `scripts/grant-first-owner.sql`. Faça novo login após mudar permissões.
Recuperação usa Supabase Auth e retorna a `/admin/redefinir-senha`. Configurar a origem exata do preview e a URL de recuperação nas Redirect URLs do provedor. Validação real por e-mail depende do proprietário; o assistente não define nem captura novas senhas.

## Banco de dados
As migrações são incrementais, não devem recriar tabelas do ambiente existente. O fixture em tests/schema-fixture.sql é exclusivo de banco isolado.
WORK A e C foram confirmados no ambiente hospedado. A migração D está validada isoladamente, mas sua aplicação hospedada ficou bloqueada pelo erro de sessão do conector; conferir relatório antes de aplicar. Não reaplicar versões existentes.
RLS protege produtos privados, dados de leads, eventos e auditoria. O índice duplicado de leads foi identificado, mas sua remoção ficou reservada para manutenção verificada. Índices ainda não utilizados não foram removidos por falta de tráfego representativo.

## Preview, produção e rollback
Usar o projeto Vercel existente, framework Vite, instalação npm ci, build npm run build, saída dist. Configurar as duas variáveis públicas no ambiente Preview. Rewrites cobrem catálogo, produto, checkout, privacidade e administração. O preview exige autenticação Vercel; não remover Deployment Protection.
A ferramenta `/_qa/viewport.html` é emitida somente em builds Preview para conferir larguras 320/390/768/1024/1440/1920. Não contém dados sintéticos nem altera autenticação.
O ignoreCommand bloqueia builds automáticos de produção. Publicar em branch de feature não autoriza remover essa proteção, fazer merge na main ou promover preview.
Após aprovação explícita: verificar commit, aplicar migrações pendentes uma única vez, revisar CORS/Redirect URLs e variáveis de produção, liberar build de produção pelo processo aprovado e validar antes de atribuir domínios. Não usar uma prévia como prova de configuração de produção.
Rollback: no projeto existente, restaurar o deployment estável registrado no relatório pela opção de rollback da Vercel. Não desfazer migrações de banco destrutivamente; as mudanças D são compatíveis com a interface C e os dados persistidos devem ser preservados.

## Privacidade, limites e aceite
Aviso em /privacidade, versão 2026-10-25, cobre registro para orçamento e atendimento relacionado, sem campanhas promocionais. Empresa deve definir responsável, contato para titulares, retenção e procedimento de exclusão/anonimização. Revisão técnica não aprova esses pontos operacionais/jurídicos.
Consulte docs/WORK-D-AUDITORIA.md para problemas, testes e bloqueios. Fluxos públicos e administrativos completos hospedados e recuperação real por e-mail não estão aprovados sem execução com conta e dados autorizados. O catálogo comercial completo depende dos produtos reais e do futuro WORK B.
