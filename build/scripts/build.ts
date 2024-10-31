import { build, Configuration, Platform, Arch } from 'electron-builder'
import { generateIcons } from './generateIcons'

type PlatformType = 'LINUX' | 'WINDOWS' | 'MAC' | 'ALL'

interface BuildConfig {
  config: Configuration,
  targets?: Map<Platform, Map<Arch, string[]>>
}

function getPlatform(): PlatformType {
  const args: string[] = process.argv.slice(2)
  
  if (args.includes('--linux')) return 'LINUX'
  if (args.includes('--windows')) return 'WINDOWS'
  if (args.includes('--mac')) return 'MAC'
  
  const directPlatform = args[0]?.toUpperCase() as PlatformType
  if (['LINUX', 'WINDOWS', 'MAC'].includes(directPlatform)) {
    return directPlatform
  }
  
  return 'ALL'
}

const platform: PlatformType = getPlatform()

const options: Configuration = {
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
  asar: false,
  // Default icon for all platforms
  icon: 'build/icons/512x512.png',
  win: {
    target: ['nsis'],
    icon: 'build/icons/icon.ico'
  },
  mac: {
    target: ['dmg'],
    icon: 'build/icons/icon.icns'
  },
  linux: {
    target: ['AppImage'],
    icon: 'build/icons' // Linux will use the icons directory containing multiple sizes
  }
}

const buildConfig: BuildConfig = {
  config: options
}

if (platform !== 'ALL') {
  buildConfig.targets = Platform[platform].createTarget()
} else {
  // When building for all platforms, create a combined target map
  buildConfig.targets = new Map([
    [Platform.LINUX, new Map([[Arch.x64, ['AppImage']]])],
    [Platform.WINDOWS, new Map([[Arch.x64, ['nsis']]])],
    [Platform.MAC, new Map([[Arch.x64, ['dmg']]])]
  ])
}

async function main(): Promise<void> {
  try {
    // Generate icons first
    await generateIcons()
    
    // Then proceed with electron-builder
    console.log('Starting electron-builder...')
    const result = await build(buildConfig)
    console.log('Build completed:', result)
  } catch (error) {
    console.error('Build process failed:', error)
    process.exit(1)
  }
}

// Run the build process
main()