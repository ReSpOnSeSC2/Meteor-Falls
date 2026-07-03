import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    // Agent worktrees checked out under .claude/worktrees/ carry full repo copies;
    // without this exclude vitest globs their test files too and cross-fails them
    // against the main tree's assets (seen 2026-07-02). node_modules/dist mirror
    // vitest's defaults, which this override would otherwise replace.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', '**/dormant/**'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true,
    // Honor a harness-assigned port (preview/CI set PORT) so we never collide
    // with a dev server the user is already running; fall back to 5173 for a
    // plain `npm run dev`. strictPort only when PORT is given — bind exactly to
    // the assigned port (no silent drift), but stay forgiving for manual runs.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: !!process.env.PORT,
  },
});
