import { defineConfig, type Plugin, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import path from 'path'

function voiceUploadPlugin(): Plugin {
  let slackToken: string

  return {
    name: 'mus-voice-upload',
    configResolved({ mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      slackToken = env.SLACK_BOT_TOKEN ?? ''
    },
    configureServer(server) {
      server.middlewares.use('/api/mus/voice-upload', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
          return
        }

        if (!slackToken) {
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: 'SLACK_BOT_TOKEN not set in .env.local' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk)
          const body = Buffer.concat(chunks)

          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
          }

          process.env.SLACK_BOT_TOKEN = slackToken

          const { POST } = await server.ssrLoadModule('/src/server/index.ts')
          const request = new Request('http://localhost/api/mus/voice-upload', {
            method: 'POST',
            headers,
            body,
          })

          const response = await POST(request)
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await response.text())
        } catch (err) {
          console.error('Voice upload dev error:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: String(err) }))
        }
      })

      server.middlewares.use('/api/mus/standalone-upload', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
          return
        }

        if (!slackToken) {
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: 'SLACK_BOT_TOKEN not set in .env.local' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk)
          const body = Buffer.concat(chunks)

          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
          }

          process.env.SLACK_BOT_TOKEN = slackToken

          const { POSTStandalone } = await server.ssrLoadModule('/src/server/index.ts')
          const request = new Request('http://localhost/api/mus/standalone-upload', {
            method: 'POST',
            headers,
            body,
          })

          const response = await POSTStandalone(request)
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await response.text())
        } catch (err) {
          console.error('Standalone upload dev error:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: String(err) }))
        }
      })

      server.middlewares.use('/api/mus/support-channel', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
          return
        }

        if (!slackToken) {
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: 'SLACK_BOT_TOKEN not set in .env.local' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk)
          const body = Buffer.concat(chunks)

          const headers = new Headers({ 'content-type': req.headers['content-type'] ?? 'application/json' })

          process.env.SLACK_BOT_TOKEN = slackToken

          const { POSTSupportChannel } = await server.ssrLoadModule('/src/server/index.ts')
          const request = new Request('http://localhost/api/mus/support-channel', {
            method: 'POST',
            headers,
            body,
          })

          const response = await POSTSupportChannel(request)
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await response.text())
        } catch (err) {
          console.error('Support channel dev error:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: './tsconfig.json',
      exclude: ['src/playground/**', 'src/__tests__/**'],
    }),
    voiceUploadPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/slack-proxy': {
        target: 'https://chefbot.services.datachef.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/slack-proxy/, ''),
      },
    },
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        server: path.resolve(__dirname, 'src/server/index.ts'),
        chrome: path.resolve(__dirname, 'src/chrome.ts'),
        'vite-plugin': path.resolve(__dirname, 'src/vite-plugin.ts'),
        // Adapters barrel + individual sub-paths
        adapters: path.resolve(__dirname, 'src/adapters/index.ts'),
        'adapters/slack': path.resolve(__dirname, 'src/adapters/slack.ts'),
        'adapters/discord': path.resolve(__dirname, 'src/adapters/discord.ts'),
        'adapters/teams': path.resolve(__dirname, 'src/adapters/teams.ts'),
        'adapters/webhook': path.resolve(__dirname, 'src/adapters/webhook.ts'),
        // Resolvers barrel + individual sub-paths
        resolvers: path.resolve(__dirname, 'src/resolvers/index.ts'),
        'resolvers/stytch': path.resolve(__dirname, 'src/resolvers/stytch.ts'),
        'resolvers/clerk': path.resolve(__dirname, 'src/resolvers/clerk.ts'),
        'resolvers/auth0': path.resolve(__dirname, 'src/resolvers/auth0.ts'),
        'resolvers/next-auth': path.resolve(__dirname, 'src/resolvers/next-auth.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'ffmpeg-static',
        'vite',
        'child_process',
        'fs/promises',
        'path',
        'os',
        /^node:/,
        // Auth peer deps — only loaded when user explicitly imports a resolver sub-path
        '@stytch/react',
        '@clerk/clerk-react',
        '@auth0/auth0-react',
        'next-auth',
        'next-auth/react',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    cssCodeSplit: false,
    assetsInlineLimit: 300000,
  },
})
