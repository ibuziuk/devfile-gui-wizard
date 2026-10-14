import { describe, expect, it } from 'vitest'

import { validateDevfile, parseQuantity, compareVersions, validators } from '../src/utils/validation'
import { fullDevfileState } from './fixtures/fullDevfileState'
import { initialWizardState } from '../src/hooks/useWizardState'

const run = (mutate) => {
  const state = fullDevfileState()
  if (mutate) mutate(state)
  return validateDevfile(state)
}

const hasError = (report, fragment) => report.errors.some((message) => message.includes(fragment))
const hasWarning = (report, fragment) => report.warnings.some((message) => message.includes(fragment))

describe('validateDevfile', () => {
  it('reports nothing for a fully populated, valid devfile', () => {
    const report = run()
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
  })

  it('accepts an empty devfile but warns about the missing name', () => {
    const report = validateDevfile(initialWizardState.devfileData)
    expect(report.errors).toEqual([])
    expect(hasWarning(report, 'metadata.name is empty')).toBe(true)
  })
})

describe('schemaVersion', () => {
  it('rejects a malformed version', () => {
    expect(hasError(run((state) => (state.schemaVersion = '1.0.0')), 'schemaVersion')).toBe(true)
    expect(hasError(run((state) => (state.schemaVersion = 'abc')), 'schemaVersion')).toBe(true)
  })

  it('rejects dependentProjects below 2.3.0', () => {
    const report = run((state) => (state.schemaVersion = '2.2.0'))
    expect(hasError(report, 'dependentProjects requires schemaVersion 2.3.0')).toBe(true)
  })
})

describe('metadata', () => {
  it('rejects a non-semver version', () => {
    expect(hasError(run((state) => (state.metadata.version = '1.0')), 'metadata.version')).toBe(true)
  })

  it('rejects an unknown architecture', () => {
    expect(hasError(run((state) => state.metadata.architectures.push('riscv')), 'architectures')).toBe(true)
  })

  it('rejects an invalid globalMemoryLimit', () => {
    expect(hasError(run((state) => (state.metadata.globalMemoryLimit = 'lots')), 'globalMemoryLimit')).toBe(true)
  })

  it('warns about a name that is not a valid Kubernetes resource name', () => {
    expect(hasWarning(run((state) => (state.metadata.name = 'My Project')), 'is not a valid Kubernetes resource name')).toBe(true)
  })
})

describe('components', () => {
  it('rejects duplicate names', () => {
    const report = run((state) => (state.components[1].name = 'tools'))
    expect(hasError(report, 'Duplicate component name')).toBe(true)
  })

  it('rejects an invalid name', () => {
    expect(hasError(run((state) => (state.components[0].name = 'Tools')), 'name —')).toBe(true)
  })

  it('requires a container image', () => {
    expect(hasError(run((state) => (state.components[0].container.image = '')), 'container image is required')).toBe(true)
  })

  it('rejects an unparsable quantity', () => {
    expect(hasError(run((state) => (state.components[0].container.memoryLimit = 'big')), 'not a valid quantity')).toBe(true)
  })

  it('rejects a request larger than its limit', () => {
    expect(hasError(run((state) => (state.components[0].container.memoryRequest = '4Gi')), 'memoryRequest is greater than memoryLimit')).toBe(true)
    expect(hasError(run((state) => (state.components[0].container.cpuRequest = '2')), 'cpuRequest is greater than cpuLimit')).toBe(true)
  })

  it('rejects the reserved environment variables', () => {
    const report = run((state) => state.components[0].container.env.push({ name: 'PROJECT_SOURCE', value: '/x' }))
    expect(hasError(report, 'reserved environment variable')).toBe(true)
  })

  it('requires volume mounts to reference a volume component', () => {
    const report = run((state) => (state.components[0].container.volumeMounts[0].name = 'nope'))
    expect(hasError(report, 'does not reference a volume component')).toBe(true)
  })

  it('rejects an invalid volume size', () => {
    expect(hasError(run((state) => (state.components[1].volume.size = 'huge')), 'volume size')).toBe(true)
  })

  it('requires an inlined manifest or a uri for kubernetes components', () => {
    const report = run((state) => (state.components[2].kubernetes.inlined = ''))
    expect(hasError(report, 'inlined manifest is required')).toBe(true)
  })

  it('rejects an inlined manifest that is not valid YAML', () => {
    const report = run((state) => (state.components[2].kubernetes.inlined = 'a:\n b:\n- c: ]['))
    expect(hasError(report, 'not valid YAML')).toBe(true)
  })

  it('requires an imageName and a dockerfile source', () => {
    expect(hasError(run((state) => (state.components[4].image.imageName = '')), 'imageName is required')).toBe(true)
    expect(hasError(run((state) => (state.components[6].image.dockerfile.uri = '')), 'dockerfile uri is required')).toBe(true)
  })

  it('allows only one remote on a dockerfile git source', () => {
    const report = run((state) =>
      state.components[4].image.dockerfile.git.remotes.push({ name: 'fork', value: 'https://example.com/f.git' })
    )
    expect(hasError(report, 'only one git remote may be defined')).toBe(true)
  })
})

describe('endpoints', () => {
  it('rejects duplicate endpoint names across components', () => {
    const report = run((state) => (state.components[2].kubernetes.endpoints[0].name = 'http-3000'))
    expect(hasError(report, 'endpoint names must be unique')).toBe(true)
  })

  it('rejects the same target port on two container components', () => {
    const report = run((state) =>
      state.components.push({
        name: 'second',
        componentType: 'container',
        attributes: '',
        container: {
          image: 'quay.io/devfile/base:ubi8',
          command: [],
          args: [],
          env: [],
          memoryRequest: '',
          memoryLimit: '',
          cpuRequest: '',
          cpuLimit: '',
          mountSources: '',
          sourceMapping: '',
          dedicatedPod: '',
          volumeMounts: [],
          endpoints: [
            { name: 'dup-3000', targetPort: '3000', exposure: '', protocol: '', path: '', secure: '', annotation: [], attributes: '' }
          ],
          deploymentAnnotation: [],
          serviceAnnotation: []
        }
      })
    )
    expect(hasError(report, 'ports must be unique across container components')).toBe(true)
  })

  it('allows a shared target port when the container has a dedicated pod', () => {
    const report = run((state) => {
      const clone = JSON.parse(JSON.stringify(state.components[0]))
      clone.name = 'second'
      clone.container.dedicatedPod = true
      clone.container.endpoints = clone.container.endpoints.map((endpoint, index) => ({
        ...endpoint,
        name: `clone-${index}`
      }))
      clone.container.volumeMounts = []
      clone.container.deploymentAnnotation = []
      clone.container.serviceAnnotation = []
      state.components.push(clone)
    })
    expect(hasError(report, 'ports must be unique')).toBe(false)
  })

  it('requires a name and a target port', () => {
    expect(hasError(run((state) => (state.components[0].container.endpoints[0].name = '')), 'name is required')).toBe(true)
    expect(hasError(run((state) => (state.components[0].container.endpoints[0].targetPort = '')), 'targetPort is required')).toBe(true)
  })

  it('rejects an out-of-range port', () => {
    expect(hasError(run((state) => (state.components[0].container.endpoints[0].targetPort = '70000')), 'between 1 and 65535')).toBe(true)
  })
})

describe('container annotations', () => {
  it('rejects conflicting annotations on shared-pod containers', () => {
    const report = run((state) => {
      const clone = JSON.parse(JSON.stringify(state.components[0]))
      clone.name = 'second'
      clone.container.endpoints = []
      clone.container.volumeMounts = []
      clone.container.deploymentAnnotation = [{ name: 'app.kubernetes.io/part-of', value: 'other' }]
      clone.container.serviceAnnotation = []
      state.components.push(clone)
    })
    expect(hasError(report, 'conflicting deployment annotation')).toBe(true)
  })
})

describe('commands', () => {
  it('rejects duplicate ids', () => {
    expect(hasError(run((state) => (state.commands[1].id = 'install')), 'Duplicate command id')).toBe(true)
  })

  it('requires exec commands to target a container component', () => {
    const report = run((state) => (state.commands[0].exec.component = 'cache'))
    expect(hasError(report, 'exec commands must reference a container component')).toBe(true)
  })

  it('rejects a reference to an unknown component', () => {
    expect(hasError(run((state) => (state.commands[0].exec.component = 'ghost')), 'references unknown component')).toBe(true)
  })

  it('allows apply commands to target kubernetes, openshift and image components', () => {
    for (const component of ['k8s-manifest', 'ocp-manifest', 'app-image', 'tools']) {
      const report = run((state) => (state.commands[3].apply.component = component))
      expect(hasError(report, 'apply commands must reference')).toBe(false)
    }
  })

  it('rejects apply commands targeting a volume component', () => {
    const report = run((state) => (state.commands[3].apply.component = 'cache'))
    expect(hasError(report, 'apply commands must reference')).toBe(true)
  })

  it('requires a command line on exec commands', () => {
    expect(hasError(run((state) => (state.commands[0].exec.commandLine = '')), 'commandLine is required')).toBe(true)
  })

  it('rejects a composite command referencing itself', () => {
    const report = run((state) => state.commands[4].composite.commands.push('prepare'))
    expect(hasError(report, 'cannot reference itself')).toBe(true)
  })

  it('rejects a composite command referencing itself indirectly', () => {
    const report = run((state) => {
      // prepare → post-start → prepare
      state.commands[5].composite.commands = ['prepare']
      state.commands[4].composite.commands = ['post-start']
    })
    expect(hasError(report, 'indirectly reference itself')).toBe(true)
  })

  it('rejects a composite command referencing an unknown command', () => {
    const report = run((state) => state.commands[4].composite.commands.push('ghost'))
    expect(hasError(report, 'references unknown command "ghost"')).toBe(true)
  })

  it('rejects more than one default command per group kind', () => {
    const report = run((state) => {
      state.commands[1].exec.group = { kind: 'build', isDefault: true }
    })
    expect(hasError(report, 'more than one default command')).toBe(true)
  })

  it('warns when a group has several commands and no default', () => {
    const report = run((state) => {
      state.commands[0].exec.group = { kind: 'build', isDefault: '' }
      state.commands[1].exec.group = { kind: 'build', isDefault: '' }
    })
    expect(hasWarning(report, 'none is marked as default')).toBe(true)
  })
})

describe('events', () => {
  it('rejects a binding to an unknown command', () => {
    const report = run((state) => (state.events.preStart = ['ghost']))
    expect(hasError(report, 'does not map to a valid devfile command')).toBe(true)
  })

  it('requires apply commands for preStart and postStop', () => {
    expect(hasError(run((state) => (state.events.preStart = ['install'])), 'should either map to an apply command')).toBe(true)
    expect(hasError(run((state) => (state.events.postStop = ['install'])), 'should either map to an apply command')).toBe(true)
  })

  it('requires exec commands for postStart and preStop', () => {
    expect(hasError(run((state) => (state.events.postStart = ['deploy-k8s'])), 'should either map to an exec command')).toBe(true)
    expect(hasError(run((state) => (state.events.preStop = ['deploy-k8s'])), 'should either map to an exec command')).toBe(true)
  })

  it('rejects a composite command mixing command kinds for an event', () => {
    const report = run((state) => (state.events.postStart = ['prepare']))
    expect(hasError(report, 'must only contain exec commands')).toBe(true)
  })

  it('warns about a command bound twice to the same event', () => {
    const report = run((state) => (state.events.preStart = ['prepare', 'prepare']))
    expect(hasWarning(report, 'is bound more than once')).toBe(true)
  })
})

describe('projects', () => {
  it('requires a checkout remote when several remotes are configured', () => {
    const report = run((state) => (state.projects[0].git.checkoutFrom.remote = ''))
    expect(hasError(report, 'mandatory when more than one remote')).toBe(true)
  })

  it('requires the checkout remote to exist', () => {
    const report = run((state) => (state.projects[0].git.checkoutFrom.remote = 'nope'))
    expect(hasError(report, 'is not one of the configured remotes')).toBe(true)
  })

  it('requires at least one remote', () => {
    const report = run((state) => (state.projects[0].git.remotes = []))
    expect(hasError(report, 'must define at least one remote')).toBe(true)
  })

  it('allows only one remote on a starter project', () => {
    const report = run((state) =>
      state.starterProjects[0].git.remotes.push({ name: 'fork', value: 'https://example.com/f.git' })
    )
    expect(hasError(report, 'only one git remote may be defined')).toBe(true)
  })

  it('rejects duplicate project names', () => {
    expect(hasError(run((state) => (state.projects[1].name = 'web')), 'Duplicate project name')).toBe(true)
  })

  it('reports a remote without a URL', () => {
    const report = run((state) => (state.projects[0].git.remotes[0].value = ''))
    expect(hasError(report, 'has no URL')).toBe(true)
  })
})

describe('parent', () => {
  it('requires the selected reference', () => {
    expect(hasError(run((state) => (state.parent.id = '')), 'registry id is required')).toBe(true)
    expect(
      hasError(
        run((state) => {
          state.parent.sourceType = 'uri'
          state.parent.uri = ''
        }),
        'parent: uri is required'
      )
    ).toBe(true)
    expect(
      hasError(
        run((state) => {
          state.parent.sourceType = 'kubernetes'
          state.parent.kubernetes = { name: '', namespace: '' }
        }),
        'DevWorkspaceTemplate is required'
      )
    ).toBe(true)
  })

  it('rejects an invalid parent version', () => {
    expect(hasError(run((state) => (state.parent.version = '0.1.0')), 'parent.version')).toBe(true)
    expect(hasError(run((state) => (state.parent.version = 'latest')), 'parent.version')).toBe(false)
  })

  it('does not require fields that the override merely patches', () => {
    const report = run((state) => {
      state.parent.overrides.components[0].container.image = ''
      state.parent.overrides.commands[0].exec.commandLine = ''
    })
    expect(hasError(report, 'container image is required')).toBe(false)
    expect(hasError(report, 'commandLine is required')).toBe(false)
  })

  it('rejects an image override defining both a dockerfile and autoBuild', () => {
    const report = run((state) =>
      state.parent.overrides.components.push({
        name: 'app-image',
        componentType: 'image',
        attributes: '',
        image: {
          imageName: '',
          autoBuild: true,
          dockerfile: {
            sourceType: 'uri',
            uri: 'docker/Dockerfile',
            devfileRegistry: { id: '', registryUrl: '' },
            git: { remotes: [], checkoutFrom: { remote: '', revision: '' }, fileLocation: '' },
            buildContext: '',
            rootRequired: '',
            args: []
          }
        }
      })
    )
    expect(hasError(report, 'either a dockerfile or autoBuild, not both')).toBe(true)
  })

  it('still enforces naming rules inside overrides', () => {
    const report = run((state) => (state.parent.overrides.components[0].name = 'Bad Name'))
    expect(hasError(report, 'parent override →')).toBe(true)
  })

  it('is ignored entirely when disabled', () => {
    const report = run((state) => {
      state.parent.enabled = false
      state.parent.id = ''
    })
    expect(hasError(report, 'parent')).toBe(false)
  })
})

describe('attributes', () => {
  it('rejects invalid YAML', () => {
    expect(hasError(run((state) => (state.attributes = 'a: [')), 'Invalid YAML')).toBe(true)
  })

  it('rejects YAML that is not a map', () => {
    expect(hasError(run((state) => (state.metadata.attributes = '- one\n- two')), 'Must be a YAML map')).toBe(true)
  })
})

describe('variables', () => {
  it('rejects duplicates', () => {
    const report = run((state) => state.variables.push({ name: 'version', value: '2' }))
    expect(hasError(report, 'Duplicate variable name')).toBe(true)
  })
})

describe('parseQuantity', () => {
  it('parses binary, decimal and plain quantities', () => {
    expect(parseQuantity('1Gi')).toBe(1024 ** 3)
    expect(parseQuantity('512Mi')).toBe(512 * 1024 ** 2)
    expect(parseQuantity('500m')).toBeCloseTo(0.5)
    expect(parseQuantity('2')).toBe(2)
    expect(parseQuantity('1e3')).toBe(1000)
  })

  it('rejects nonsense', () => {
    expect(parseQuantity('big')).toBeNull()
    expect(parseQuantity('1Xi')).toBeNull()
    expect(parseQuantity('')).toBeNull()
  })

  it('orders quantities across units', () => {
    expect(parseQuantity('1Gi')).toBeGreaterThan(parseQuantity('900Mi'))
    expect(parseQuantity('1000m')).toBe(parseQuantity('1'))
  })
})

describe('compareVersions', () => {
  it('compares dotted versions', () => {
    expect(compareVersions('2.3.0', '2.2.0')).toBe(1)
    expect(compareVersions('2.2.0', '2.3.0')).toBe(-1)
    expect(compareVersions('2.3.0', '2.3.0')).toBe(0)
    expect(compareVersions('2.10.0', '2.9.0')).toBe(1)
  })
})

describe('field validators', () => {
  it('enforces the shared name pattern', () => {
    expect(validators.k8sName('my-component')).toBeNull()
    expect(validators.k8sName('My-Component')).not.toBeNull()
    expect(validators.k8sName('-leading')).not.toBeNull()
    expect(validators.k8sName('trailing-')).not.toBeNull()
    expect(validators.k8sName('a'.repeat(64))).not.toBeNull()
    expect(validators.k8sName('a'.repeat(63))).toBeNull()
  })

  it('accepts relative uris but rejects malformed urls', () => {
    expect(validators.uri('manifests/deploy.yaml')).toBeNull()
    expect(validators.uri('https://example.com/x.yaml')).toBeNull()
    expect(validators.uri('http://')).not.toBeNull()
  })
})
