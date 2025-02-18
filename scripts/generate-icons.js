const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ICONS = [
  { name: 'favicon.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'og-image.png', size: 1200, height: 630 },
  { name: 'twitter-image.png', size: 1200, height: 600 },
]

async function generateIcons() {
  try {
    const inputSvg = fs.readFileSync(path.join(__dirname, '../public/logo.svg'))
    const outputDir = path.join(__dirname, '../public')

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generate PNG icons
    for (const icon of ICONS) {
      const outputPath = path.join(outputDir, icon.name)
      console.log(`Generating ${icon.name}...`)

      await sharp(inputSvg)
        .resize(icon.size, icon.height || icon.size, {
          fit: icon.height ? 'contain' : 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)
    }

    // Copy favicon.png to favicon.ico
    const faviconPng = path.join(outputDir, 'favicon.png')
    const faviconIco = path.join(outputDir, 'favicon.ico')
    fs.copyFileSync(faviconPng, faviconIco)
    console.log('All icons generated successfully!')
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()
