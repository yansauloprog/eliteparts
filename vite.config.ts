import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "preview-viewport-check",
      generateBundle() {
        if (process.env.VERCEL_ENV !== "preview") return;
        this.emitFile({
          type: "asset",
          fileName: "_qa/viewport.html",
          source: `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>QA Preview — Elite Parts</title><style>body{margin:0;font:14px Arial;background:#ddd}header{display:flex;gap:20px;padding:12px;position:sticky;top:0;background:#fff;z-index:5}iframe{display:block;border:0;height:1100px;background:white}label{display:flex;gap:8px}</style><header><strong>QA · somente Preview</strong><label>Largura<select id="width"><option>320</option><option>390</option><option>768</option><option>1024</option><option selected>1440</option><option>1920</option></select></label><label>Página<select id="page"><option value="/">Home</option><option value="/catalogo">Catálogo</option><option value="/checkout">Lista de interesses</option><option value="/privacidade">Privacidade</option><option value="/admin/login">Login</option><option value="/admin">Dashboard</option><option value="/admin/leads">CRM</option></select></label></header><iframe title="Aplicação em teste" width="1440" src="/"></iframe><script>const frame=document.querySelector('iframe');document.querySelector('#width').onchange=e=>frame.width=e.target.value;document.querySelector('#page').onchange=e=>frame.src=e.target.value;</script></html>`,
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    allowedHosts: ["terminal.local"],
  },
});
