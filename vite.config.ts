import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { existsSync } from "fs";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname
const repositoryNameParts = process.env.GITHUB_REPOSITORY?.split('/') ?? []
const repositoryName = repositoryNameParts.length === 2 ? repositoryNameParts[1] : undefined
const hasCustomDomain = existsSync(resolve(projectRoot, 'CNAME'))
const basePath = hasCustomDomain ? '/' : repositoryName && !repositoryName.endsWith('.github.io') ? `/${repositoryName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? basePath : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
