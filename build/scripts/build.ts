import { build, Configuration, Platform, Arch } from 'electron-builder'
import { generateIcons } from './generateIcons'

// Ensure we're in production mode
process.env.NODE_ENV = 'production'

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

// Log environment information
console.log('Building with environment:', process.env.NODE_ENV)
console.log('Using environment file:', process.env.NODE_ENV === 'production' ? '.env.production' : '.env')

const options: Configuration = {
  appId: 'com.autobyteus.app',
  productName: 'AutoByteus',
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
  asar: true,
  // Default icon for all platforms
  icon: 'build/icons/512x512.png',
  // Include the resources directory which contains the server
  extraResources: [
    {
      from: "resources/server",
      to: "server"
    },
    {
      from: "build/icons",
      to: "icons"
    }
  ],
  // Default artifact name pattern
  artifactName: '${productName}_${platform}-${version}.${ext}',
  win: {
    target: ['nsis'],
    icon: 'build/icons/icon.ico',
    artifactName: '${productName}_windows-${version}.${ext}'
  },
  nsis: {
    oneClick: false,                    // Allow user to customize installation
    allowToChangeInstallationDirectory: true, // Allow user to change installation directory
    perMachine: false,                  // Install for current user only by default
    installerIcon: 'build/icons/icon.ico',
    uninstallerIcon: 'build/icons/icon.ico',
    installerHeaderIcon: 'build/icons/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'AutoByteus',
    differentialPackage: false         // Disable differential updates
  },
  mac: {
    target: ['dmg'],
    icon: 'build/icons/icon.icns',
    // Custom naming for macOS builds based on architecture
    artifactName: '${productName}_macos-${arch}-${version}.${ext}'
  },
  linux: {
    target: ['AppImage'],
    icon: 'build/icons', // Linux will use the icons directory containing multiple sizes
    artifactName: '${productName}_linux-${version}.${ext}'
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
    [Platform.MAC, new Map([[Arch.x64, ['dmg']], [Arch.arm64, ['dmg']]])]
  ])
}

// Function to convert electron-builder arch to our naming convention
function getArchName(arch: Arch): string {
  if (arch === Arch.arm64) return 'arm64';
  if (arch === Arch.x64) return 'intel';
  return arch.toString();
}

async function main(): Promise<void> {
  try {
    // Generate icons first
    await generateIcons()
    
    // Then proceed with electron-builder
    console.log('Starting electron-builder...')
    
    // Handle different platforms separately to customize naming
    if (platform === 'ALL') {
      // Custom handling for builds with specific architecture naming
      console.log('Building for all platforms with custom naming...')
      
      // Build for Linux
      console.log('Building for Linux...')
      await build({
        config: options,
        targets: new Map([[Platform.LINUX, new Map([[Arch.x64, ['AppImage']]])]])
      })
      
      // Build for Windows
      console.log('Building for Windows...')
      await build({
        config: options,
        targets: new Map([[Platform.WINDOWS, new Map([[Arch.x64, ['nsis']]])]])
      })
      
      // Build for macOS with both architectures
      console.log('Building for macOS...')
      for (const arch of [Arch.arm64, Arch.x64]) {
        const archName = getArchName(arch);
        console.log(`Building for macOS (${archName})...`);
        
        const macConfig = {
          ...options,
          mac: {
            ...options.mac,
            artifactName: `\${productName}_macos-${archName}-\${version}.\${ext}`
          }
        };
        
        await build({
          config: macConfig,
          targets: new Map([[Platform.MAC, new Map([[arch, ['dmg']]])]])
        });
      }
      
      console.log('All platform builds completed successfully')
    } else {
      // For single platform builds, use the standard configuration
      const result = await build(buildConfig)
      console.log('Build completed:', result)
    }
  } catch (error) {
    console.error('Build process failed:', error)
    process.exit(1)
  }
}

// Run the build process
main()
