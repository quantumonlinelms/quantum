# Cache Clearing Guide

## Quick Cache Clearing

### Option 1: Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Option 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Clear Vite Cache (Cross-platform)
```bash
npm run clean
npm run dev
```

This will clear:
- `node_modules/.vite` (Vite dependency cache)
- `dist` (build output)
- `.vite` (Vite cache directory)

### Option 4: Clear Everything
```bash
# Clear Vite cache
npm run clean

# Clear browser cache manually:
# Chrome: Settings > Privacy > Clear browsing data > Cached images and files
# Firefox: Settings > Privacy > Clear Data > Cached Web Content
# Edge: Settings > Privacy > Clear browsing data > Cached images and files
```

## Why Cache Issues Happen

1. **Browser Cache**: Browser caches JavaScript files
2. **Vite Cache**: Vite caches dependencies in `node_modules/.vite`
3. **Service Workers**: If you have any, they cache resources
4. **Hot Module Replacement**: Sometimes HMR doesn't pick up changes

## Prevention

The Vite config has been updated to:
- Disable caching headers in dev mode
- Force dependency optimization
- Add hash to filenames in production builds

## Development Tips

1. **Always use Hard Refresh** after code changes: `Ctrl + Shift + R`
2. **Clear Vite cache** if you see stale code: `npm run clean`
3. **Disable cache in DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache" checkbox
   - Keep DevTools open while developing

4. **Use Incognito/Private Mode** for testing to avoid cache issues

## Troubleshooting

If you still see old code after clearing cache:

1. **Stop the dev server** (Ctrl + C)
2. **Clear Vite cache**: `npm run clean`
3. **Restart dev server**: `npm run dev`
4. **Hard refresh browser**: `Ctrl + Shift + R`
5. **Check browser console** for any errors

