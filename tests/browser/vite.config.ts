import { defineConfig } from "vite";

export default defineConfig({
  root: "tests/browser/fixture",
  plugins: [
    {
      name: "zeenat-csp-headers",
      configureServer(server) {
        server.middlewares.use((_request, response, next) => {
          response.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' ws:; font-src 'self'; object-src 'none'; base-uri 'none'",
          );
          next();
        });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
});
