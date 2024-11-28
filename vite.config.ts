import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.secret': JSON.stringify(env.secret),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL)
    },
    plugins: [
      reactRouter(),
      tsconfigPaths(),
    ],
  };
});
