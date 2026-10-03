import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import handler from './api/ai.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GROQ_API_KEY) {
    process.env.GROQ_API_KEY = env.GROQ_API_KEY
  }
  if (env.GROQ_MODEL) {
    process.env.GROQ_MODEL = env.GROQ_MODEL
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'ai-api-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/ai', async (req, res) => {
            const env = loadEnv(server.config.mode || 'development', process.cwd(), '')
            if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY
            if (env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL
            await handler(req as any, res as any)
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      allowedHosts: true,
    },
  }
})
