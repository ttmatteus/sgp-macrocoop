# SGP Macrocoop

Monorepo Nx com a API (NestJS) e o Web (Next.js).

## Instalação

```sh
pnpm install
```

Isso já instala tudo e gera o Prisma Client automaticamente (via `postinstall`).

Depois, copie `apps/api/.env.example` para `apps/api/.env` e preencha `DATABASE_URL` e `DIRECT_URL` com as credenciais do Supabase 

## Rodando

```sh
pnpm api
```

Sobe a API em `http://localhost:3000/api`.

```sh
pnpm web
```

Sobe o front em `http://localhost:3000` (ou na próxima porta livre, se a API já estiver rodando).

## API em teste

https://sgp-macrocoop-api-769732290750.southamerica-east1.run.app/api

## Web em teste

https://sgp-macrocoop.vercel.app

O front é mobile first, então no navegador de PC o layout vai ficar estranho. Pra ver como deveria ser, abra em um celular ou use o modo de emulação mobile do navegador (DevTools).
