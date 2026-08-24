import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite injeta automaticamente <link rel="stylesheet"> pro CSS do bundle
// principal no dist/index.html — isso aparecia no PageSpeed como
// render-blocking (index-*.css, 8.4KiB / ~150ms). Esse plugin reescreve
// essa tag, só no build de produção, pro mesmo padrão preload+onload que
// index.html já usa pras Google Fonts: não bloqueia a renderização, com
// fallback <noscript> pra quem tem JS desabilitado.
function cssNaoBloqueante() {
  return {
    name: "css-nao-bloqueante",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(/<link ([^>]*rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*)>/g, (match, attrs, href) => {
          const semRel = attrs.replace(/\s*rel="stylesheet"\s*/, " ");
          return (
            `<link ${semRel} rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" href="${href}"></noscript>`
          );
        });
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cssNaoBloqueante()],
});
