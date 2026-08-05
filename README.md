# SGP Macrocoop

Monorepo Nx com a API (NestJS) e o Web (Next.js).

## Instalação

```sh
pnpm install
```

Isso já instala tudo e gera o Prisma Client automaticamente (via `postinstall`).

Depois, copie `apps/api/.env.example` para `apps/api/.env` e preencha `DATABASE_URL` e `DIRECT_URL` com as credenciais do Supabase. Copie tb `apps/web/.env.example` pra `apps/web/.env.local`.

## Rodando

```sh
pnpm dev
```

Sobe a API (`http://localhost:3000/api`) e o web (`http://localhost:3001`) juntos, em paralelo.

Se quiser subir só um dos dois: `pnpm api` ou `pnpm web`.

## API em teste

https://sgp-macrocoop-api-769732290750.southamerica-east1.run.app/api

## Web em teste

https://sgp-macrocoop.vercel.app

O front é mobile first, então no navegador de PC o layout vai ficar estranho. Pra ver como deveria ser, abra em um celular ou use o modo de emulação mobile do navegador (DevTools).
