import { execFileSync } from 'child_process'
import * as fs from 'fs'
import { logger } from '../logger'

const BASH_PATH = '/bin/bash'
let cachedBashPath: string | null | undefined

/**
 * Get PATH from a bash login shell, sourcing .bashrc as well.
 * This helps GUI-launched Electron apps inherit user PATH on macOS/Linux.
 */
export function getBashLoginPath(): string | null {
  if (cachedBashPath !== undefined) {
    return cachedBashPath
  }

  if (!fs.existsSync(BASH_PATH)) {
    logger.warn(`Bash not found at ${BASH_PATH}; skipping PATH enrichment`)
    cachedBashPath = null
    return cachedBashPath
  }

  try {
    const output = execFileSync(
      BASH_PATH,
      [
        '-lc',
        'if [ -f ~/.bashrc ]; then source ~/.bashrc >/dev/null 2>&1; fi; printf "%s" "$PATH"'
      ],
      { env: process.env, encoding: 'utf8' }
    )

    const pathValue = output.trim()
    if (!pathValue) {
      logger.warn('Bash login PATH was empty; falling back to process.env.PATH')
      cachedBashPath = null
      return cachedBashPath
    }

    cachedBashPath = pathValue
    return cachedBashPath
  } catch (error) {
    logger.warn(`Failed to load PATH from bash login shell: ${error}`)
    cachedBashPath = null
    return cachedBashPath
  }
}
