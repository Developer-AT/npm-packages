---
name: TypeScript 6 Upgrade
overview: Upgrade all 8 npm packages from TypeScript 5.9 to 6.x and standardize tsconfig for TS 6 defaults/deprecations while keeping CommonJS emit compatible with existing package consumers.
todos:
  - id: bump-typescript-deps
    content: Bump typescript to ^6.0.0 in all 8 package.json files
    status: pending
  - id: update-tsconfigs
    content: Apply TS 6-ready tsconfig template to all 8 packages (rootDir, types, moduleResolution, remove baseUrl, include)
    status: pending
  - id: install-build-verify
    content: npm install + npm run build in each package; fix compile/emit issues
    status: pending
  - id: readme-note
    content: Note TypeScript 6 as the repo/package development requirement in root README
    status: pending
isProject: false
---

# TypeScript 6 upgrade for all packages

## Current state (analysis)

All packages currently pin:

```json
"typescript": "^5.9.3"
```

Packages to update (8):

- [`logger`](logger/)
- [`rabbit-mq`](rabbit-mq/)
- [`bull-mq`](bull-mq/)
- [`redis`](redis/)
- [`aws-s3`](aws-s3/)
- [`aws-secret-manager`](aws-secret-manager/)
- [`smtp-mail`](smtp-mail/)
- [`locale`](locale/)

Every [`tsconfig.json`](logger/tsconfig.json) is effectively identical:

| Option | Current value | TS 6 impact |
|--------|---------------|-------------|
| `target` | `es2022` | Keep (explicit; fine under TS 6) |
| `module` | `commonjs` | Keep for published CJS packages (`main: dist/index.js`) |
| `moduleResolution` | **unset** (old default ≈ `node10`) | **Deprecated** in TS 6 — must set explicitly |
| `baseUrl` | `"."` | **Deprecated** in TS 6; unused (no `paths`) — **remove** |
| `rootDir` | **unset** | New default is tsconfig dir (`.`) — risk of `dist/src/...` nesting — **set `./src`** |
| `types` | **unset** | New default is `[]` — Node globals/`@types/node` stop auto-loading — **set `["node"]`** |
| `strict` | `true` | Already correct (now TS 6 default) |
| `esModuleInterop` | `true` | Keep |
| `experimentalDecorators` / `emitDecoratorMetadata` | `true` | Keep (still supported) |

No root shared tsconfig exists today — each package owns its own file.

## Chosen approach

- Upgrade to **TypeScript 6.x** (`^6.0.0`).
- Keep **CommonJS** output so existing npm consumers of `@appinventiv/*` keep working without ESM/`exports` migration.
- Align all package `tsconfig.json` files to one TS-6-ready template.
- Do **not** introduce `ignoreDeprecations: "6.0"` — fix deprecated options properly so TS 7 is easier later.
- Do **not** migrate to ESM / `module: nodenext` in this pass (would force package.json `"type"` / `"exports"` changes).

## Target `tsconfig.json` (apply to all 8 packages)

```json
{
  "compilerOptions": {
    "declaration": true,
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["node"],
    "incremental": true,
    "noEmit": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "strictPropertyInitialization": false,
    "sourceMap": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"]
}
```

Key deltas vs today:

1. **Add** `moduleResolution: "bundler"` — TS 6 officially allows this with `module: "commonjs"` as the upgrade path away from deprecated `node`/`node10`.
2. **Add** `rootDir: "./src"` — keeps `dist/index.js` flat (avoids accidental `dist/src/...`).
3. **Add** `types: ["node"]` — restores Node typings under empty default `types`.
4. **Remove** `baseUrl: "."` — unused and deprecated.
5. **Add** `include: ["src/**/*"]` — explicit source roots for predictable builds.

## Dependency updates

In each package’s `package.json` `devDependencies`:

```json
"typescript": "^6.0.0"
```

Keep `@types/node` as-is unless a package build fails on types; then bump that package’s `@types/node` only.

## Execution steps

1. Update `typescript` in all 8 `package.json` files.
2. Replace each package `tsconfig.json` with the shared template above.
3. Per package: `npm install` then `npm run build`.
4. Fix any new compile errors package-by-package (most likely: Node globals if `types` missed; path/`rootDir` emit shape).
5. Spot-check emitted layout: `dist/index.js` and `dist/index.d.ts` still match `"main"` / `"types"` in each `package.json`.
6. Update root [`README.md`](README.md) Requirements to note **TypeScript 6** for package development.

## Out of scope

- ESM / dual-package publish (`"type": "module"`, `exports`)
- Shared root `tsconfig.base.json` (can follow later)
- Bumping published package versions / npm publish (do after builds are green if you want a release)

## Risk notes

- `moduleResolution: "bundler"` with CJS is the intended TS 6 migration for apps that used implicit `node10`; verify builds still resolve `amqplib`, `bullmq`, AWS SDK, `winston`, `ioredis`, `nodemailer`.
- If a package relied on ambient `@types` packages other than Node being auto-included, add them explicitly under `types` (none currently appear to need this beyond Node).
