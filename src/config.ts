import deepMerge = require('deep-merge')
import * as fs from 'fs'
import * as minimist from 'minimist'
import {homedir} from 'os'
import * as Path from 'path'
import {promisify} from 'util'
import Config from './models/config'

const readFile = promisify(fs.readFile)
const exists = promisify(fs.exists)
let _config: Config

const {config: configPath, preview} = minimist(process.argv.slice(2), {
  alias: {
    c: 'config',
    p: 'preview',
  },
  default: {
    c: Path.join(homedir(), '.silverbullet.json'),
    p: false,
  },
})

const defaultConfig: Config = {
  path: Path.join(homedir(), 'time.txt'),
  mappings: {},
  preview,
}

/**
 * Loads the configuration, merging it with an optional user-defined config.json
 */
export async function load() {
  if (_config) {
    return _config
  }

  _config = defaultConfig

  const userConfig = await readConfig(configPath)
  if (userConfig) {
    const merge = deepMerge((_a, b) => b)
    _config = merge(defaultConfig, userConfig)

    if (_config.path.startsWith('~/')) {
      _config.path = _config.path.replace('~', homedir())
    }
  }

  return _config
}

async function readConfig(path: string) {
  if (!await exists(path)) {
    return null
  }

  const content = await readFile(path)
  try {
    return JSON.parse(content.toString())
  } catch {
    throw new Error('invalid config file - please make sure the config.json contains valid JSON')
  }
}
