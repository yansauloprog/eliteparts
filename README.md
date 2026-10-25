# Elite Parts — WORK A

Catálogo automotivo com administração em React, TypeScript e Vite, conectado ao Supabase Auth, PostgreSQL e Storage.

## Desenvolvimento

Requer Node.js 22 ou 24 e npm. A raiz do repositório é a aplicação Vite.

```sh
npm ci
cp .env.example .env.local
# Preencha somente a URL e a chave publicável do Supabase.
npm run dev
```

Acesse `/admin/login`. As variáveis públicas são `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Credenciais privilegiadas não são usadas no frontend. Arquivos de ambiente locais são ignorados pelo Git.

```sh
npm run typecheck
npm run build
npm test
npm run test:live
```

`npm test` executa PostgreSQL isolado e testes dos serviços com SDK simulado. `npm run test:live` exige configuração local e verifica a API hospedada: consulta pública e bloqueios para visitantes. Os relatórios gerados pelos testes são locais e ignorados pelo Git. A base não possui lint configurado.

Para testes de imagens e login responsivo no navegador, abra `/tests/browser-check.html` pelo servidor Vite. A página de testes não integra o build final.

## Administração

- `/admin`: contagens reais de produtos e categorias.
- `/admin/produtos`: busca e paginação no servidor, filtros, ordenação, publicação e arquivamento.
- `/admin/produtos/novo` e `/admin/produtos/:id`: cadastro/edição, códigos comerciais textuais, preços decimais e especificações livres.
- `/admin/categorias`: categorias/subcategorias, validação de ciclos e gestão dos vínculos.
- `/admin/configuracoes`: campos públicos suportados pelo frontend.

Imagens são vinculadas por UUID permanente, com galeria WebP de até 1600px e miniatura de até 480px. A interface permite upload, ordenação, capa, substituição e remoção. Registros de auditoria são gerados no banco, com autoria derivada da sessão.

## Supabase e primeiro administrador

O projeto hospedado já tem as tabelas e RLS. A migração incremental versionada em `supabase/migrations` já foi aplicada ao ambiente original; não a execute novamente manualmente. `src/types/database.ts` foi gerado do schema real. `tests/schema-fixture.sql` serve somente para testes isolados, nunca para recriar o banco hospedado.

Convide o proprietário real pelo Supabase Auth. Depois de confirmar o e-mail, use `scripts/grant-first-owner.sql` exclusivamente no SQL Editor privilegiado, preenchendo UUID e e-mail verificados. Nenhuma senha é criada pelo script. Apenas `app_metadata.eliteparts_role` com valor `owner` ou `admin` autoriza o painel. `user_metadata` não concede privilégios.

Configure a origem da prévia e `<ORIGEM>/admin/redefinir-senha` nas Redirect URLs do Supabase Auth. O proprietário deve definir sua senha pelo fluxo de e-mail e entrar novamente após a atribuição do papel para renovar as claims da sessão.

O fluxo autenticado hospedado precisa ser validado após cadastrar a conta real. Contas e senhas fictícias não são criadas automaticamente.

## Vercel

Framework Vite, instalação `npm ci`, build `npm run build`, saída `dist`. Os rewrites incluem as rotas administrativas. Configure as variáveis públicas no ambiente Preview.

O `ignoreCommand` bloqueia builds de produção por Git e permite prévias. Não remova esse bloqueio, faça merge na `main` ou promova uma prévia sem autorização do proprietário.

## Escopo

A hero aprovada e o site público demonstrativo foram preservados. O serviço `publicProducts()` consulta a base real sem fallback fictício. Esta entrega concentra a administração; o catálogo público existente continua identificado como demonstração.

Não há pagamentos reais, contas de visitantes, importação em massa ou recursos do WORK B. O bucket de imagens é público e deve conter somente fotografias de catálogo.
