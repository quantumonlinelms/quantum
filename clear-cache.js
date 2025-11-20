// Cross-platform cache clearing script
import { rmSync } from 'fs'
import { join } from 'path'

const pathsToClean = [
  'node_modules/.vite',
  'dist',
  '.vite'
]

console.log('Clearing cache...')

pathsToClean.forEach(path => {
  try {
    rmSync(path, { recursive: true, force: true })
    console.log(`✓ Cleared: ${path}`)
  } catch (err) {
    // Ignore if path doesn't exist
    if (err.code !== 'ENOENT') {
      console.warn(`⚠ Could not clear ${path}:`, err.message)
    }
  }
})

console.log('Cache cleared! You can now run: npm run dev')


