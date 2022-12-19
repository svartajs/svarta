# svarta

[![TS ready](https://img.shields.io/static/v1?label=&message=TS+ready&color=000000&logo=typescript)]()
[![ESM ready](https://img.shields.io/static/v1?label=&message=ESM+ready&color=%23000000&logo=javascript)]()
[![CI](https://github.com/marvin-j97/svarta/actions/workflows/ci.yml/badge.svg)](https://github.com/marvin-j97/svarta/actions/workflows/ci.yml)
![GitHub](https://img.shields.io/github/license/marvin-j97/svarta)

## About

A Typescript-native, ESM-native REST API framework.

Svarta abstracts the underlying backend, to allow deployment to different platforms without changing your code. Routes are organized using file-based routing, commonly used in fullstack frameworks like Next.js, Nuxt, SvelteKit or Solid Start.

Currently, supported deployment targets include:

- Standalone (default): Uses tinyhttp to provide a tiny, ESM-based HTTP server
- AWS Lambda: Uses API Gateway & AWS Lambda to provide a serverless API

## Bootstrap new project

```bash
npx create-svarta-app
yarn create svarta-app
pnpm create svarta-app
```

For development, run:

```bash
npm run dev
yarn dev
pnpm run dev
```

For building, run:

```bash
npm run build
yarn build
pnpm run build
```

If you use the standalone adapter, your app will be bundled to a single .mjs file which you can run using:

```bash
node server.mjs
```
