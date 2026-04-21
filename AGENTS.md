# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the app code. Keep routed pages under `src/views/<domain>/index.vue` (for example, `src/views/plan/create/index.vue`), shared layout pieces in `src/layouts/`, reusable UI in `src/components/`, API wrappers in `src/api/`, Pinia stores in `src/stores/modules/`, and global styles in `src/styles/`. Use the `@` alias for imports from `src/`. Static assets that must be served as-is belong in `public/`. Reference material and implementation notes live in `doc/`, and repo-local agent skills live in `skills/`.

## Build, Test, and Development Commands
Run `npm install` once to install dependencies. Use `npm run dev` to start the Vite dev server on port `3000`. Use `npm run type-check` for `vue-tsc`, `npm run lint` to run Oxlint and ESLint with auto-fixes, `npm run format` to apply Prettier to `src/`, `npm run build` for a production build, and `npm run preview` to smoke-test the built output locally.

## Coding Style & Naming Conventions
Follow `.editorconfig`: UTF-8, LF, 2-space indentation, trailing whitespace removed, max line length 100. Prettier enforces single quotes and no semicolons. Prefer Vue 3 SFCs with TypeScript, keep route components in folder-based `index.vue` files, and place store modules in `src/stores/modules/<feature>.ts`. Use PascalCase for route names and component symbols, and keep utility/module filenames lowercase when they are not components.

## Testing Guidelines
There is no automated test runner configured yet, and no `test` script in `package.json`. Until one is added, treat `npm run type-check && npm run lint && npm run build` as the minimum validation gate. If you add tests, place them next to the feature or under a dedicated `tests/` directory and use `*.spec.ts` naming.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style such as `feat(dashboard): ...`, `fix(checklists): ...`, and `init: ...`. Keep the type lowercase, add a scope when the change is localized, and write the summary in plain, specific language. PRs should include a short description, affected views or routes, linked task/doc references when available, and screenshots or recordings for UI changes.

## Configuration & API Notes
Development proxies are defined in `vite.config.ts`: `/api` points to local backend services and `/je` points to the document server. Keep environment-specific URLs in `.env*` files, avoid hardcoding tokens or secrets, and preserve the existing `iris_token` authentication flow when touching request or router guards.
