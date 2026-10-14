import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import yaml from 'js-yaml'

import { buildDevfile, generateYaml } from '../src/utils/devfileGenerator'
import { initialWizardState } from '../src/hooks/useWizardState'
import { fullDevfileState } from './fixtures/fullDevfileState'

const schema = JSON.parse(
  readFileSync(fileURLToPath(new URL('../schemas/devfile-2.3.0.json', import.meta.url)), 'utf8')
)

// unicodeRegExp: the published schema uses patterns such as `\-` that are not
// valid under the ECMAScript `u` flag ajv applies by default.
const ajv = new Ajv({ allErrors: true, strict: false, unicodeRegExp: false })
const validateSchema = ajv.compile(schema)

function expectValid(devfile) {
  const valid = validateSchema(devfile)
  if (!valid) {
    throw new Error(
      `Devfile does not match the 2.3.0 schema:\n${ajv.errorsText(validateSchema.errors, { separator: '\n' })}`
    )
  }
  expect(valid).toBe(true)
}

/** Collects every key name appearing anywhere in the generated devfile. */
function allKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => allKeys(item, keys))
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      keys.add(key)
      allKeys(nested, keys)
    }
  }
  return keys
}

describe('buildDevfile', () => {
  it('produces a schema-valid devfile for a fully populated wizard state', () => {
    expectValid(buildDevfile(fullDevfileState()))
  })

  it('produces a schema-valid devfile for an untouched wizard state', () => {
    const devfile = buildDevfile(initialWizardState.devfileData)
    expect(devfile).toEqual({ schemaVersion: '2.3.0' })
    expectValid(devfile)
  })

  it('never leaks the wizard-only discriminator fields into the output', () => {
    const keys = allKeys(buildDevfile(fullDevfileState()))
    for (const internalKey of ['componentType', 'commandType', 'sourceType', 'enabled', 'overrides', 'deploymentAnnotation', 'serviceAnnotation']) {
      expect(keys.has(internalKey)).toBe(false)
    }
  })

  it('round-trips through YAML', () => {
    const state = fullDevfileState()
    const parsed = yaml.load(generateYaml(state))
    expect(parsed).toEqual(buildDevfile(state))
    expectValid(parsed)
  })

  it('emits schemaVersion first and keeps the canonical section order', () => {
    const keys = Object.keys(buildDevfile(fullDevfileState()))
    expect(keys).toEqual([
      'schemaVersion',
      'metadata',
      'attributes',
      'parent',
      'projects',
      'dependentProjects',
      'starterProjects',
      'components',
      'commands',
      'events',
      'variables'
    ])
  })
})

describe('polymorphic sections', () => {
  const devfile = buildDevfile(fullDevfileState())
  const componentsByName = Object.fromEntries(devfile.components.map((component) => [component.name, component]))
  const commandsById = Object.fromEntries(devfile.commands.map((command) => [command.id, command]))

  it('emits exactly one type key per component', () => {
    for (const component of devfile.components) {
      const typeKeys = ['container', 'kubernetes', 'openshift', 'volume', 'image'].filter(
        (key) => component[key] !== undefined
      )
      expect(typeKeys).toHaveLength(1)
    }
  })

  it('emits exactly one type key per command', () => {
    for (const command of devfile.commands) {
      const typeKeys = ['exec', 'apply', 'composite'].filter((key) => command[key] !== undefined)
      expect(typeKeys).toHaveLength(1)
    }
  })

  it('emits exactly one source key per project', () => {
    const projects = [...devfile.projects, ...devfile.starterProjects, ...devfile.dependentProjects]
    for (const project of projects) {
      const sourceKeys = ['git', 'zip'].filter((key) => project[key] !== undefined)
      expect(sourceKeys).toHaveLength(1)
    }
  })

  it('converts ordered pairs back into string maps', () => {
    expect(devfile.variables).toEqual({ version: '1.0.0', registry: 'quay.io' })
    expect(devfile.projects[0].git.remotes).toEqual({
      origin: 'https://github.com/org/web.git',
      upstream: 'https://github.com/upstream/web.git'
    })
    expect(componentsByName.tools.container.annotation).toEqual({
      deployment: { 'app.kubernetes.io/part-of': 'demo' },
      service: { 'service.beta.openshift.io/serving-cert-secret-name': 'certs' }
    })
  })

  it('keeps env as a list of name/value objects', () => {
    expect(componentsByName.tools.container.env).toEqual([{ name: 'NODE_ENV', value: 'development' }])
    expect(commandsById.install.exec.env).toEqual([{ name: 'CI', value: 'true' }])
  })

  it('emits targetPort as an integer', () => {
    for (const endpoint of componentsByName.tools.container.endpoints) {
      expect(Number.isInteger(endpoint.targetPort)).toBe(true)
    }
  })

  it('parses free-form attributes from YAML text', () => {
    expect(devfile.attributes).toEqual({ 'controller.devfile.io/storage-type': 'ephemeral' })
    expect(devfile.metadata.attributes).toEqual({ 'alpha.build-context': '.', 'alpha.dockerimage-port': 3000 })
    expect(componentsByName.tools.container.endpoints[0].attributes).toEqual({
      discoverable: false,
      urlRewriteSupported: true
    })
  })
})

describe('optional booleans', () => {
  it('keeps an explicit false and omits an unset value', () => {
    const state = fullDevfileState()
    const devfile = buildDevfile(state)
    const tools = devfile.components.find((component) => component.name === 'tools')
    const cache = devfile.components.find((component) => component.name === 'cache')
    const uriImage = devfile.components.find((component) => component.name === 'uri-image')

    expect(tools.container.mountSources).toBe(true)
    expect(tools.container.dedicatedPod).toBe(false)
    expect(cache.volume.ephemeral).toBe(false)
    // autoBuild was left unset on uri-image
    expect('autoBuild' in uriImage.image).toBe(false)
  })
})

describe('parent', () => {
  it('is omitted when not enabled', () => {
    const state = fullDevfileState()
    state.parent.enabled = false
    expect(buildDevfile(state).parent).toBeUndefined()
  })

  it('emits only the selected reference type', () => {
    const devfile = buildDevfile(fullDevfileState())
    expect(devfile.parent.id).toBe('nodejs')
    expect(devfile.parent.uri).toBeUndefined()
    expect(devfile.parent.kubernetes).toBeUndefined()
  })

  it('carries the full set of overrides', () => {
    const { parent } = buildDevfile(fullDevfileState())
    expect(Object.keys(parent)).toEqual([
      'id',
      'registryUrl',
      'version',
      'attributes',
      'components',
      'commands',
      'projects',
      'starterProjects',
      'dependentProjects',
      'variables'
    ])
  })

  it('keeps an image override within oneOf(dockerfile, autoBuild)', () => {
    const autoBuildOnly = fullDevfileState()
    autoBuildOnly.parent.overrides.components.push({
      name: 'app-image',
      componentType: 'image',
      attributes: '',
      image: {
        imageName: '',
        autoBuild: false,
        dockerfile: {
          sourceType: 'uri',
          uri: '',
          devfileRegistry: { id: '', registryUrl: '' },
          git: { remotes: [], checkoutFrom: { remote: '', revision: '' }, fileLocation: '' },
          buildContext: '',
          rootRequired: '',
          args: []
        }
      }
    })

    const override = buildDevfile(autoBuildOnly).parent.components.at(-1)
    expect(override.image).toEqual({ autoBuild: false })
    expectValid(buildDevfile(autoBuildOnly))

    // An override with a dockerfile keeps the dockerfile branch only.
    const withDockerfile = JSON.parse(JSON.stringify(autoBuildOnly))
    withDockerfile.parent.overrides.components.at(-1).image.dockerfile.uri = 'docker/Dockerfile'
    const dockerfileOverride = buildDevfile(withDockerfile).parent.components.at(-1)
    expect(dockerfileOverride.image).toEqual({ dockerfile: { uri: 'docker/Dockerfile' } })
    expectValid(buildDevfile(withDockerfile))
  })

  it('stays schema-valid for the uri and kubernetes reference types', () => {
    for (const sourceType of ['uri', 'kubernetes']) {
      const state = fullDevfileState()
      state.parent.sourceType = sourceType
      state.parent.uri = 'https://example.com/devfile.yaml'
      state.parent.kubernetes = { name: 'template', namespace: 'dev' }
      expectValid(buildDevfile(state))
    }
  })
})

describe('schema coverage', () => {
  /** Every property name the 2.3.0 schema defines, anywhere in the tree. */
  function schemaProperties(node, found = new Set()) {
    if (!node || typeof node !== 'object') return found
    if (node.properties) {
      for (const [key, child] of Object.entries(node.properties)) {
        found.add(key)
        schemaProperties(child, found)
      }
    }
    if (node.items) schemaProperties(node.items, found)
    if (typeof node.additionalProperties === 'object') schemaProperties(node.additionalProperties, found)
    for (const branch of node.oneOf || []) schemaProperties(branch, found)
    return found
  }

  it('the fixtures exercise every property defined by the schema', () => {
    const defined = schemaProperties(schema)

    // `parent` is a oneOf, so its branches cannot all appear in one document.
    const kubernetesParent = fullDevfileState()
    kubernetesParent.parent.sourceType = 'kubernetes'
    kubernetesParent.parent.kubernetes = { name: 'template', namespace: 'dev' }

    const produced = new Set([
      ...allKeys(buildDevfile(fullDevfileState())),
      ...allKeys(buildDevfile(kubernetesParent))
    ])

    const missing = [...defined].filter((key) => !produced.has(key))
    expect(missing).toEqual([])
  })
})
