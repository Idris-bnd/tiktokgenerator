import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

// Plugin qui scanne automatiquement les dossiers assets
function assetListPlugin() {
  const virtualId = 'virtual:asset-list'
  const assetsPath = join(process.cwd(), 'public', 'assets')

  function getImageLists() {
    const ext = ['.jpg', '.jpeg', '.png', '.webp']
    const getImages = (dir) => {
      if (!existsSync(dir)) return []
      return readdirSync(dir).filter((f) =>
        ext.some((e) => f.toLowerCase().endsWith(e))
      )
    }
    const photos = getImages(join(assetsPath, 'photos'))
    const lockscreens = getImages(join(assetsPath, 'lockscreen'))
    return {
      code: `
        export const PHOTOS = ${JSON.stringify(photos)}
        export const LOCKSCREENS = ${JSON.stringify(lockscreens)}
      `,
    }
  }

  return {
    name: 'asset-list',
    resolveId(id) {
      if (id === virtualId) return '\0' + virtualId
    },
    load(id) {
      if (id === '\0' + virtualId) {
        return getImageLists().code
      }
    },
    configureServer(server) {
      server.watcher.add(assetsPath)
      server.watcher.on('all', (event, filePath) => {
        const inAssets = filePath.replace(/\\/g, '/').includes('/public/assets/')
        if (inAssets && (event === 'add' || event === 'unlink')) {
          const mod = server.moduleGraph.getModuleById('\0' + virtualId)
          if (mod) server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })
    },
  }
}

export default defineConfig({
  base: '/tiktok-uploader/',
  plugins: [assetListPlugin(), react()],
  publicDir: 'public',
})
