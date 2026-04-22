# Repository Guidelines

## Project Structure & Module Organization
Application code lives in `src/`. Keep route pages under `src/views/<domain>/index.vue`, shared layout shells in `src/layouts/`, reusable UI in `src/components/`, API clients in `src/api/`, Pinia stores in `src/stores/modules/`, and shared types in `src/types/`. Global styling is in `src/styles/`, and mock data lives in `src/mock/`. Static files that should be served unchanged belong in `public/`. Reference material is split between `doc/` and `docs/`. Build output goes to `dist/` and should not be edited manually.

## Build, Test, and Development Commands
Run `npm install` once after cloning. Use `npm run dev` to start the Vite dev server on port `3000`. Use `npm run type-check` for `vue-tsc` validation, `npm run lint` to run Oxlint and ESLint with fixes, and `npm run format` to apply Prettier to `src/`. Use `npm run build` to produce a production bundle; it runs type checking before `vite build`. Use `npm run preview` to inspect the built app locally.

## Coding Style & Naming Conventions
Follow `.editorconfig`: UTF-8, LF line endings, 2-space indentation, trailing whitespace removed, and a 100-column target. Prettier enforces single quotes and no semicolons. Use TypeScript in Vue 3 SFCs, prefer the `@` alias for `src` imports, and keep route components folder-based, for example `src/views/plan/detail/index.vue`. Use PascalCase for component names and store types, and lowercase filenames for non-component modules such as `src/api/request.ts`.

## Testing Guidelines
There is no `npm test` script or dedicated test runner configured yet. For now, treat `npm run type-check && npm run lint && npm run build` as the minimum validation gate. If you add automated tests, place them near the feature or in a top-level `tests/` directory and use `*.spec.ts` naming.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style, for example `feat(dashboard): ...`, `fix(checklists): ...`, and `init: ...`. Keep the type lowercase, add a scope when the change is localized, and write a specific summary. Pull requests should describe the user-visible change, list affected routes or modules, link the related task or design note when available, and include screenshots or recordings for UI work.

## Configuration Notes
Development proxies are defined in `vite.config.ts`: `/api` points to `http://localhost:8080` and `/je` points to the document service. Keep environment-specific values in `.env*` files and avoid hardcoding service URLs, tokens, or file-server paths in components.
