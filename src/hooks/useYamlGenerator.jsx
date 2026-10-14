import { useCallback } from 'react'
import { buildDevfile, generateYaml as dumpYaml } from '../utils/devfileGenerator'

export function useYamlGenerator() {
  const generateYaml = useCallback((devfileData) => dumpYaml(devfileData), [])
  const generateObject = useCallback((devfileData) => buildDevfile(devfileData), [])

  return { generateYaml, generateObject }
}
