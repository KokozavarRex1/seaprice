## План

Ще ти пакетирам целия проект (изходния код – React/TypeScript, CSS, HTML, конфигурация) в един ZIP файл, който ще можеш да свалиш и предадеш на учителя.

### Какво ще включа
- Целия `src/` (routes, components, styles.css, data, lib, assets pointers)
- Конфигурационни файлове: `package.json`, `tsconfig.json`, `vite.config.ts`, `components.json`, `eslint.config.js`, `bunfig.toml`
- `index.html` / entry файлове
- `AGENTS.md` и README ако има
- Кратък `README-за-учителя.md` на български с описание на технологиите (React, TanStack Start, Tailwind v4, TypeScript) и как да се стартира локално (`bun install`, `bun dev`)

### Какво ще изключа
- `node_modules/`, `.lovable/`, build артефакти, lock файлове по избор (ще оставя `package.json` за референция)
- Секрети / `.env`

### Резултат
ZIP файл в `/mnt/documents/seaprice-source.zip`, който ще се появи като артефакт за сваляне директно от чата.