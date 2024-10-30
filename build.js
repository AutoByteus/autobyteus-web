const { build, Platform } = require('electron-builder')

function getPlatform() {
  const args = process.argv.slice(2)
  
  if (args.includes('--linux')) return 'LINUX'
  if (args.includes('--windows')) return 'WINDOWS'
  if (args.includes('--mac')) return 'MAC'
  
  const directPlatform = args[0]?.toUpperCase()
  if (['LINUX', 'WINDOWS', 'MAC'].includes(directPlatform)) {
    return directPlatform
  }
  
  return 'ALL'
}

const platform = getPlatform()

const options = {
  appId: 'com.autobyteus.app',
  productName: 'AutoByteUs',
  directories: {
    output: 'electron-dist'
  },
  files: [
    "dist/**/*",
    "package.json"
  ],
  extraMetadata: {
    main: "dist/electron/main.js"
  },
  asar: false, // Disable ASAR packaging
  win: {
    target: ['nsis']
  },
  mac: {
    target: ['dmg']
  },
  linux: {
    target: ['AppImage']
  }
}

const buildConfig = {
  config: options
}

if (platform !== 'ALL') {
  buildConfig.targets = Platform[platform].createTarget()
}

build(buildConfig)
  .then((result) => {
    console.log('Build completed:', result)
  })
  .catch((error) => {
    console.error('Build failed:', error)
    process.exit(1)
  })
