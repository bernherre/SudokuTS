# Sudoku (4x4 / 6x6 / 9x9) — Vite + TypeScript

Juego de Sudoku en el navegador con:
- **Tamaños:** 4x4, 6x6 (subcuadros 2x3), 9x9
- **Dificultad:** fácil, media, difícil (pistas borradas con unicidad garantizada)
- **Controles:** Nuevo, Pista, Check, Solución, selector de tamaño/dificultad
- **Timer:** cronómetro en vivo
- **Tema:** claro/oscuro
- **Pruebas:** Vitest + jsdom
- **CI/CD:** GitHub Actions para desplegar en **GitHub Pages**
- **Buenas prácticas:** TypeScript estricto, funciones puras para el motor, UI desacoplada
- **.gitignore:** incluye entradas típicas de PHP además de Node

## Uso local
```bash
npm i
npm run dev
```

## Pruebas
```bash
npm test
```

## Build
```bash
npm run build
npm run preview
```

## Despliegue en GitHub Pages
1. Crea un repo y sube este código.
2. Asegúrate de que la rama por defecto sea `main`
3. Activa **Pages** en Settings → Pages → Source: **GitHub Actions**.
4. El workflow `Deploy to GitHub Pages` publicará `dist/` en tu página y revisa con AI el código cambiado.

> El `vite.config.ts` usa la variable `GITHUB_REPOSITORY` para ajustar
> el `base` automáticamente, evitando caminos rotos

## Atajos
- Introduce números con el teclado (`1..n`). `Backspace` borra.
- **Pista** coloca un valor correcto en la primera celda vacía.
- **Check** marca errores frente a la solución.
- **Solución** resuelve el tablero por completo.

**Consejo:** Se auto-selecciona una celda editable. Usa flechas para moverte o haz *click* y escribe.