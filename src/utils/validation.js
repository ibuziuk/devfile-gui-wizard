import yaml from 'js-yaml'
import {
  ARCHITECTURES,
  K8S_NAME_PATTERN,
  PARENT_VERSION_PATTERN,
  RESERVED_CONTAINER_ENV,
  SCHEMA_VERSION_PATTERN,
  SEMVER_PATTERN
} from './constants'

// ---------------------------------------------------------------------------
// Field-level validators used by the step forms for inline feedback.
// ---------------------------------------------------------------------------

export const validators = {
  required: (value) =>
    !value || (typeof value === 'string' && value.trim() === '') ? 'This field is required' : null,

  k8sName: (value) => {
    if (!value) return null
    if (value.length > 63) return 'Must be 63 characters or less'
    if (!K8S_NAME_PATTERN.test(value)) {
      return 'Must be lowercase alphanumeric or "-", and start and end with an alphanumeric character'
    }
    return null
  },

  url: (value) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Must be a valid URL (e.g. https://example.com)'
    }
  },

  uri: (value) => {
    if (!value) return null
    // Mirrors devfile/api ValidateURI: absolute URLs are parsed strictly,
    // anything else is accepted as a relative reference.
    if (/^https?:/i.test(value)) {
      try {
        new URL(value)
        return null
      } catch {
        return 'Must be a valid URL'
      }
    }
    return null
  },

  semver: (value) => (!value || SEMVER_PATTERN.test(value) ? null : 'Must be a semantic version, e.g. 1.0.0'),

  schemaVersion: (value) => {
    if (!value) return 'Schema version is required'
    return SCHEMA_VERSION_PATTERN.test(value) ? null : 'Must be a 2.x+ version, e.g. 2.3.0'
  },

  quantity: (value) => (!value || parseQuantity(value) !== null ? null : 'Must be a valid quantity, e.g. 1Gi, 512Mi, 500m'),

  port: (value) => {
    if (value === '' || value === undefined || value === null) return null
    const port = Number(value)
    if (!Number.isInteger(port)) return 'Must be a whole number'
    if (port < 1 || port > 65535) return 'Must be between 1 and 65535'
    return null
  },

  yamlMap: (value) => {
    if (!value || value.trim() === '') return null
    try {
      const parsed = yaml.load(value)
      if (parsed === null || parsed === undefined) return null
      if (typeof parsed !== 'object' || Array.isArray(parsed)) return 'Must be a YAML map of key/value pairs'
      return null
    } catch (err) {
      return `Invalid YAML: ${err.reason || err.message}`
    }
  }
}

/**
 * Parses a Kubernetes resource quantity (1Gi, 512Mi, 500m, 1.5, 1e3) into a
 * comparable number. Returns null when the value is not a valid quantity.
 */
export function parseQuantity(value) {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^([+-]?[0-9]*\.?[0-9]+)(([eE][+-]?[0-9]+)|([numkKMGTPE]i?))?$/)
  if (!match) return null

  const amount = parseFloat(match[1])
  if (Number.isNaN(amount)) return null

  const suffix = match[2]
  if (!suffix) return amount
  if (/^[eE]/.test(suffix)) return amount * Math.pow(10, parseInt(suffix.slice(1), 10))

  const binary = { Ki: 1024, Mi: 1024 ** 2, Gi: 1024 ** 3, Ti: 1024 ** 4, Pi: 1024 ** 5, Ei: 1024 ** 6 }
  const decimal = { n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9, T: 1e12, P: 1e15, E: 1e18 }

  if (binary[suffix] !== undefined) return amount * binary[suffix]
  if (decimal[suffix] !== undefined) return amount * decimal[suffix]
  return null
}

// ---------------------------------------------------------------------------
// Whole-devfile validation.
//
// Implements the devfile 2.3.0 JSON schema constraints plus the semantic rules
// from devfile/api pkg/validation (validation-rule.md).
// ---------------------------------------------------------------------------

function createReport() {
  const errors = []
  const warnings = []
  return {
    errors,
    warnings,
    error: (message) => errors.push(message),
    warn: (message) => warnings.push(message)
  }
}

function label(kind, index, name) {
  return name ? `${kind}[${index}] "${name}"` : `${kind}[${index}]`
}

function checkAttributes(report, text, context) {
  const error = validators.yamlMap(text)
  if (error) report.error(`${context}: attributes — ${error}`)
}

function checkDuplicateNames(report, items, getName, kind, field = 'name') {
  const seen = new Set()
  const reported = new Set()
  items.forEach((item) => {
    const name = getName(item)
    if (!name) return
    if (seen.has(name) && !reported.has(name)) {
      report.error(`Duplicate ${kind} ${field}: "${name}" — ${field}s must be unique`)
      reported.add(name)
    }
    seen.add(name)
  })
}

function validateGitSource(report, git, context, { singleRemote = false } = {}) {
  const remotes = (git?.remotes || []).filter((remote) => (remote?.name || '').trim() !== '')
  const checkoutRemote = (git?.checkoutFrom?.remote || '').trim()

  if (remotes.length === 0) {
    report.error(`${context}: git source must define at least one remote`)
    return
  }

  const names = remotes.map((remote) => remote.name.trim())
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicates.length > 0) {
    report.error(`${context}: duplicate git remote name(s) ${[...new Set(duplicates)].join(', ')}`)
  }

  remotes.forEach((remote) => {
    if (!(remote.value || '').trim()) {
      report.error(`${context}: git remote "${remote.name.trim()}" has no URL`)
    }
  })

  if (singleRemote && remotes.length > 1) {
    report.error(`${context}: only one git remote may be defined`)
  } else if (!singleRemote && remotes.length > 1 && !checkoutRemote) {
    report.error(`${context}: "checkoutFrom.remote" is mandatory when more than one remote is configured`)
  }

  if (checkoutRemote && !names.includes(checkoutRemote)) {
    report.error(`${context}: checkout remote "${checkoutRemote}" is not one of the configured remotes`)
  }
}

function validateProjectList(report, projects, kind, config, { isOverride = false } = {}) {
  if (!Array.isArray(projects) || projects.length === 0) return

  checkDuplicateNames(report, projects, (project) => (project.name || '').trim(), config.singular)

  projects.forEach((project, index) => {
    const name = (project.name || '').trim()
    const context = label(kind, index, name)

    if (!name) {
      if (!isOverride) report.error(`${context}: name is required`)
    } else {
      const nameError = validators.k8sName(name)
      if (nameError) report.error(`${context}: name — ${nameError}`)
    }

    checkAttributes(report, project.attributes, context)

    if (project.sourceType === 'zip') {
      if (!(project.zip?.location || '').trim()) {
        report.warn(`${context}: zip source has no location`)
      }
    } else {
      validateGitSource(report, project.git, context, { singleRemote: config.singleRemote })
    }
  })
}

function validateEndpoints(report, endpoints, context, seen, { isOverride = false, componentKey = null, skipPortCheck = false } = {}) {
  if (!Array.isArray(endpoints)) return

  const portsInThisComponent = new Set()

  endpoints.forEach((endpoint, index) => {
    const name = (endpoint.name || '').trim()
    const endpointContext = `${context}: endpoints[${index}]${name ? ` "${name}"` : ''}`

    if (!name) {
      if (!isOverride) report.error(`${endpointContext}: name is required`)
    } else {
      const nameError = validators.k8sName(name)
      if (nameError) report.error(`${endpointContext}: name — ${nameError}`)
      if (seen.names.has(name)) {
        report.error(`${endpointContext}: endpoint name "${name}" is already used — endpoint names must be unique across all components`)
      }
      seen.names.add(name)
    }

    const rawPort = endpoint.targetPort
    if (rawPort === '' || rawPort === undefined || rawPort === null) {
      if (!isOverride) report.error(`${endpointContext}: targetPort is required`)
    } else {
      const portError = validators.port(rawPort)
      if (portError) {
        report.error(`${endpointContext}: targetPort — ${portError}`)
      } else if (!skipPortCheck) {
        const port = Number(rawPort)
        // Two endpoints of the same container may share a target port; two
        // different container components may not (unless dedicatedPod is set).
        if (!portsInThisComponent.has(port)) {
          const owner = seen.ports.get(port)
          if (owner !== undefined && owner !== componentKey) {
            report.error(`${endpointContext}: target port ${port} is already used by component "${owner}" — ports must be unique across container components`)
          }
          seen.ports.set(port, componentKey)
          portsInThisComponent.add(port)
        }
      }
    }

    checkAttributes(report, endpoint.attributes, endpointContext)
  })
}

function validateComponentList(report, components, { isOverride = false } = {}) {
  if (!Array.isArray(components) || components.length === 0) return

  checkDuplicateNames(report, components, (component) => (component.name || '').trim(), 'component')

  const volumeNames = new Set(
    components
      .filter((component) => component.componentType === 'volume')
      .map((component) => (component.name || '').trim())
      .filter(Boolean)
  )

  const seenEndpoints = { names: new Set(), ports: new Map() }
  const deploymentAnnotations = new Map()
  const serviceAnnotations = new Map()

  components.forEach((component, index) => {
    const name = (component.name || '').trim()
    const context = label('components', index, name)

    if (!name) {
      report.error(`${context}: name is required`)
    } else {
      const nameError = validators.k8sName(name)
      if (nameError) report.error(`${context}: name — ${nameError}`)
    }

    checkAttributes(report, component.attributes, context)

    switch (component.componentType) {
      case 'container':
        validateContainer(report, component, context, {
          isOverride,
          volumeNames,
          seenEndpoints,
          deploymentAnnotations,
          serviceAnnotations
        })
        break
      case 'kubernetes':
      case 'openshift':
        validateK8sLike(report, component, context, { isOverride, seenEndpoints })
        break
      case 'volume': {
        const size = (component.volume?.size || '').trim()
        if (size && parseQuantity(size) === null) {
          report.error(`${context}: volume size "${size}" is invalid — use a quantity such as 2Gi or 1024Mi`)
        }
        break
      }
      case 'image':
        validateImage(report, component, context, { isOverride })
        break
      default:
        report.error(`${context}: unknown component type "${component.componentType}"`)
    }
  })
}

function validateContainer(report, component, context, options) {
  const { isOverride, volumeNames, seenEndpoints, deploymentAnnotations, serviceAnnotations } = options
  const container = component.container || {}
  const componentName = (component.name || '').trim()

  if (!(container.image || '').trim() && !isOverride) {
    report.error(`${context}: container image is required`)
  }

  const quantities = [
    ['memoryLimit', container.memoryLimit],
    ['memoryRequest', container.memoryRequest],
    ['cpuLimit', container.cpuLimit],
    ['cpuRequest', container.cpuRequest]
  ]
  for (const [field, value] of quantities) {
    if ((value || '').trim() && parseQuantity(value) === null) {
      report.error(`${context}: ${field} "${value}" is not a valid quantity`)
    }
  }

  const memoryLimit = parseQuantity(container.memoryLimit || '')
  const memoryRequest = parseQuantity(container.memoryRequest || '')
  if (memoryLimit !== null && memoryRequest !== null && memoryRequest > memoryLimit) {
    report.error(`${context}: memoryRequest is greater than memoryLimit`)
  }

  const cpuLimit = parseQuantity(container.cpuLimit || '')
  const cpuRequest = parseQuantity(container.cpuRequest || '')
  if (cpuLimit !== null && cpuRequest !== null && cpuRequest > cpuLimit) {
    report.error(`${context}: cpuRequest is greater than cpuLimit`)
  }

  ;(container.env || []).forEach((env, index) => {
    const envName = (env?.name || '').trim()
    if (!envName) {
      if ((env?.value || '').trim()) report.error(`${context}: env[${index}] has a value but no name`)
      return
    }
    if (RESERVED_CONTAINER_ENV.includes(envName)) {
      report.error(`${context}: "${envName}" is a reserved environment variable and cannot be redefined`)
    }
  })

  ;(container.volumeMounts || []).forEach((mount, index) => {
    const mountName = (mount?.name || '').trim()
    if (!mountName) {
      report.error(`${context}: volumeMounts[${index}] name is required`)
      return
    }
    const nameError = validators.k8sName(mountName)
    if (nameError) report.error(`${context}: volumeMounts[${index}] name — ${nameError}`)
    if (!isOverride && !volumeNames.has(mountName)) {
      report.error(`${context}: volume mount "${mountName}" does not reference a volume component`)
    }
  })

  const dedicatedPod = container.dedicatedPod === true || container.dedicatedPod === 'true'

  validateEndpoints(report, container.endpoints, context, seenEndpoints, {
    isOverride,
    componentKey: componentName || `#${context}`,
    skipPortCheck: dedicatedPod
  })

  // Annotation conflicts are only reported for containers sharing the main pod.
  if (!dedicatedPod) {
    const checkAnnotations = (pairs, store, kind) => {
      ;(pairs || []).forEach((pair) => {
        const key = (pair?.name || '').trim()
        if (!key) return
        const value = pair.value || ''
        if (store.has(key) && store.get(key) !== value) {
          report.error(`${context}: conflicting ${kind} annotation "${key}" — the same key is set to a different value on another container`)
        } else {
          store.set(key, value)
        }
      })
    }
    checkAnnotations(container.deploymentAnnotation, deploymentAnnotations, 'deployment')
    checkAnnotations(container.serviceAnnotation, serviceAnnotations, 'service')
  }
}

function validateK8sLike(report, component, context, { isOverride, seenEndpoints }) {
  const source = component[component.componentType] || {}

  if (source.sourceType === 'inlined') {
    if (!(source.inlined || '').trim() && !isOverride) {
      report.error(`${context}: inlined manifest is required`)
    } else if ((source.inlined || '').trim()) {
      try {
        yaml.loadAll(source.inlined)
      } catch (err) {
        report.error(`${context}: inlined manifest is not valid YAML — ${err.reason || err.message}`)
      }
    }
  } else {
    const uri = (source.uri || '').trim()
    if (!uri && !isOverride) {
      report.error(`${context}: uri is required`)
    }
    const uriError = validators.uri(uri)
    if (uriError) report.error(`${context}: uri — ${uriError}`)
  }

  // Kubernetes/OpenShift endpoints only take part in the name uniqueness check.
  validateEndpoints(report, source.endpoints, context, seenEndpoints, {
    isOverride,
    componentKey: (component.name || '').trim(),
    skipPortCheck: true
  })
}

/** True when the user filled in anything at all on a dockerfile source. */
function dockerfileHasContent(dockerfile) {
  if (!dockerfile) return false
  const values = [
    dockerfile.uri,
    dockerfile.buildContext,
    dockerfile.devfileRegistry?.id,
    dockerfile.devfileRegistry?.registryUrl,
    dockerfile.git?.fileLocation,
    dockerfile.git?.checkoutFrom?.remote,
    dockerfile.git?.checkoutFrom?.revision
  ]
  if (values.some((value) => (value || '').trim())) return true
  if (dockerfile.rootRequired === true || dockerfile.rootRequired === false) return true
  if ((dockerfile.args || []).some((arg) => (arg || '').trim())) return true
  return (dockerfile.git?.remotes || []).some((remote) => (remote?.name || '').trim())
}

function validateImage(report, component, context, { isOverride }) {
  const image = component.image || {}

  if (!(image.imageName || '').trim() && !isOverride) {
    report.error(`${context}: imageName is required`)
  }

  const dockerfile = image.dockerfile || {}

  if (isOverride) {
    // An image override is oneOf(dockerfile, autoBuild): defining both matches
    // two branches of the schema and is rejected.
    const hasDockerfile = dockerfileHasContent(dockerfile)
    const hasAutoBuild = image.autoBuild === true || image.autoBuild === false || image.autoBuild === 'true' || image.autoBuild === 'false'
    if (hasDockerfile && hasAutoBuild) {
      report.error(`${context}: an image override may define either a dockerfile or autoBuild, not both`)
    }
    if (!hasDockerfile) return
  }
  switch (dockerfile.sourceType) {
    case 'devfileRegistry':
      if (!(dockerfile.devfileRegistry?.id || '').trim() && !isOverride) {
        report.error(`${context}: dockerfile devfileRegistry id is required`)
      }
      {
        const registryUrlError = validators.uri(dockerfile.devfileRegistry?.registryUrl || '')
        if (registryUrlError) report.error(`${context}: dockerfile registryUrl — ${registryUrlError}`)
      }
      break
    case 'git':
      // A Dockerfile git source cannot have more than one remote defined.
      validateGitSource(report, dockerfile.git, `${context}: dockerfile git`, { singleRemote: true })
      break
    case 'uri':
    default:
      if (!(dockerfile.uri || '').trim() && !isOverride) {
        report.error(`${context}: dockerfile uri is required`)
      }
      {
        const uriError = validators.uri(dockerfile.uri || '')
        if (uriError) report.error(`${context}: dockerfile uri — ${uriError}`)
      }
      break
  }
}

/** Resolves the group ({kind, isDefault}) of a command regardless of its type. */
function commandGroup(command) {
  return command[command.commandType]?.group
}

function validateCommandList(report, commands, components, { isOverride = false } = {}) {
  if (!Array.isArray(commands) || commands.length === 0) return

  checkDuplicateNames(report, commands, (command) => (command.id || '').trim().toLowerCase(), 'command', 'id')

  const byId = new Map()
  commands.forEach((command) => {
    const id = (command.id || '').trim().toLowerCase()
    if (id && !byId.has(id)) byId.set(id, command)
  })

  const componentsByName = new Map(
    (components || []).filter((component) => (component.name || '').trim()).map((component) => [component.name.trim(), component])
  )

  commands.forEach((command, index) => {
    const id = (command.id || '').trim()
    const context = label('commands', index, id)

    if (!id) {
      report.error(`${context}: id is required`)
    } else {
      const idError = validators.k8sName(id)
      if (idError) report.error(`${context}: id — ${idError}`)
    }

    checkAttributes(report, command.attributes, context)

    switch (command.commandType) {
      case 'exec': {
        const exec = command.exec || {}
        if (!(exec.commandLine || '').trim() && !isOverride) report.error(`${context}: commandLine is required`)
        if (!(exec.component || '').trim()) {
          if (!isOverride) report.error(`${context}: component is required`)
        } else if (componentsByName.size > 0) {
          const target = componentsByName.get(exec.component.trim())
          if (!target) {
            report.error(`${context}: references unknown component "${exec.component.trim()}"`)
          } else if (target.componentType !== 'container') {
            report.error(`${context}: exec commands must reference a container component, but "${exec.component.trim()}" is a ${target.componentType} component`)
          }
        }
        ;(exec.env || []).forEach((env, envIndex) => {
          if (!(env?.name || '').trim() && (env?.value || '').trim()) {
            report.error(`${context}: env[${envIndex}] has a value but no name`)
          }
        })
        break
      }
      case 'apply': {
        const apply = command.apply || {}
        if (!(apply.component || '').trim()) {
          if (!isOverride) report.error(`${context}: component is required`)
        } else if (componentsByName.size > 0) {
          const target = componentsByName.get(apply.component.trim())
          if (!target) {
            report.error(`${context}: references unknown component "${apply.component.trim()}"`)
          } else if (!['container', 'kubernetes', 'openshift', 'image'].includes(target.componentType)) {
            report.error(`${context}: apply commands must reference a container, kubernetes, openshift or image component, but "${apply.component.trim()}" is a ${target.componentType} component`)
          }
        }
        break
      }
      case 'composite': {
        const subCommands = (command.composite?.commands || []).filter(Boolean)
        if (subCommands.length === 0 && !isOverride) {
          report.error(`${context}: a composite command must reference at least one command`)
        }
        const cycle = findCompositeCycle(command, byId)
        if (cycle) report.error(`${context}: ${cycle}`)
        subCommands.forEach((subId) => {
          if (!byId.has(subId.trim().toLowerCase())) {
            report.error(`${context}: references unknown command "${subId}"`)
          }
        })
        break
      }
      default:
        report.error(`${context}: unknown command type "${command.commandType}"`)
    }
  })

  validateCommandGroups(report, commands)
}

/**
 * Detects a composite command referencing itself directly or through another
 * composite command.
 */
function findCompositeCycle(command, byId) {
  const rootId = (command.id || '').trim().toLowerCase()
  if (!rootId) return null

  const visit = (current, chain) => {
    const subCommands = (current.composite?.commands || []).filter(Boolean)
    for (const subId of subCommands) {
      const normalized = subId.trim().toLowerCase()
      if (normalized === rootId) {
        return chain.length === 0
          ? 'a composite command cannot reference itself'
          : `a composite command cannot indirectly reference itself (via ${chain.join(' → ')})`
      }
      if (chain.includes(normalized)) continue
      const sub = byId.get(normalized)
      if (sub && sub.commandType === 'composite') {
        const found = visit(sub, [...chain, normalized])
        if (found) return found
      }
    }
    return null
  }

  return visit(command, [])
}

function validateCommandGroups(report, commands) {
  const byKind = new Map()
  commands.forEach((command) => {
    const group = commandGroup(command)
    const kind = (group?.kind || '').trim()
    if (!kind) return
    if (!byKind.has(kind)) byKind.set(kind, [])
    byKind.get(kind).push(command)
  })

  byKind.forEach((groupCommands, kind) => {
    if (groupCommands.length <= 1) return
    const defaults = groupCommands.filter((command) => {
      const isDefault = commandGroup(command)?.isDefault
      return isDefault === true || isDefault === 'true'
    })
    if (defaults.length > 1) {
      const ids = defaults.map((command) => `"${(command.id || '').trim()}"`).join(', ')
      report.error(`Group "${kind}" has more than one default command (${ids}) — each group kind can only have one default command`)
    } else if (defaults.length === 0) {
      report.warn(`Group "${kind}" has ${groupCommands.length} commands but none is marked as default`)
    }
  })
}

function validateEvents(report, events, commands) {
  if (!events) return

  const byId = new Map()
  ;(commands || []).forEach((command) => {
    const id = (command.id || '').trim().toLowerCase()
    if (id) byId.set(id, command)
  })

  const eventRules = {
    preStart: 'apply',
    postStop: 'apply',
    postStart: 'exec',
    preStop: 'exec'
  }

  Object.entries(eventRules).forEach(([eventType, requiredType]) => {
    const eventCommands = events[eventType] || []
    eventCommands.forEach((commandId) => {
      const command = byId.get((commandId || '').trim().toLowerCase())
      if (!command) {
        report.error(`events.${eventType}: "${commandId}" does not map to a valid devfile command`)
        return
      }

      if (command.commandType === requiredType) return

      if (command.commandType === 'composite') {
        const invalid = (command.composite?.commands || [])
          .map((subId) => byId.get((subId || '').trim().toLowerCase()))
          .filter((sub) => sub && sub.commandType !== requiredType)
        if (invalid.length > 0) {
          report.error(`events.${eventType}: composite command "${commandId}" must only contain ${requiredType} commands`)
        }
        return
      }

      report.error(`events.${eventType}: "${commandId}" should either map to an ${requiredType} command or a composite command with ${requiredType} commands`)
    })

    const duplicates = eventCommands.filter((id, index) => eventCommands.indexOf(id) !== index)
    if (duplicates.length > 0) {
      report.warn(`events.${eventType}: command "${[...new Set(duplicates)].join(', ')}" is bound more than once`)
    }
  })
}

function validateMetadataSection(report, metadata) {
  if (!metadata) return

  const name = (metadata.name || '').trim()
  if (!name) {
    report.warn('metadata.name is empty — most tools expect a devfile to be named')
  } else if (validators.k8sName(name)) {
    report.warn(`metadata.name "${name}" is not a valid Kubernetes resource name; devfile registries and DevWorkspace tooling expect lowercase alphanumeric characters and "-"`)
  }

  const version = (metadata.version || '').trim()
  if (version && !SEMVER_PATTERN.test(version)) {
    report.error(`metadata.version "${version}" must be a semantic version, e.g. 1.0.0`)
  }

  const globalMemoryLimit = (metadata.globalMemoryLimit || '').trim()
  if (globalMemoryLimit && parseQuantity(globalMemoryLimit) === null) {
    report.error(`metadata.globalMemoryLimit "${globalMemoryLimit}" is not a valid quantity`)
  }

  ;(metadata.architectures || []).forEach((architecture) => {
    if (architecture && !ARCHITECTURES.includes(architecture)) {
      report.error(`metadata.architectures: "${architecture}" is not one of ${ARCHITECTURES.join(', ')}`)
    }
  })

  for (const field of ['website', 'supportUrl', 'icon']) {
    const value = (metadata[field] || '').trim()
    if (value && /^https?:/i.test(value) && validators.url(value)) {
      report.error(`metadata.${field} must be a valid URL`)
    }
  }

  checkAttributes(report, metadata.attributes, 'metadata')
}

function validateParent(report, parent) {
  if (!parent?.enabled) return

  switch (parent.sourceType) {
    case 'id':
      if (!(parent.id || '').trim()) report.error('parent: registry id is required')
      {
        const registryUrlError = validators.uri(parent.registryUrl || '')
        if (registryUrlError) report.error(`parent.registryUrl — ${registryUrlError}`)
      }
      break
    case 'kubernetes':
      if (!(parent.kubernetes?.name || '').trim()) {
        report.error('parent: the name of the Kubernetes DevWorkspaceTemplate is required')
      }
      break
    case 'uri':
    default: {
      const uri = (parent.uri || '').trim()
      if (!uri) report.error('parent: uri is required')
      const uriError = validators.uri(uri)
      if (uriError) report.error(`parent.uri — ${uriError}`)
      break
    }
  }

  const version = (parent.version || '').trim()
  if (version && !PARENT_VERSION_PATTERN.test(version)) {
    report.error(`parent.version "${version}" must be "latest" or a semantic version of 1.0.0 or later`)
  }

  const overrides = parent.overrides || {}
  checkAttributes(report, overrides.attributes, 'parent')

  // Overrides are patches onto the parent devfile, so fields that are required
  // in a standalone devfile may legitimately be absent here.
  const overrideReport = createReport()
  validateComponentList(overrideReport, overrides.components, { isOverride: true })
  validateCommandList(overrideReport, overrides.commands, overrides.components, { isOverride: true })
  validateProjectList(overrideReport, overrides.projects, 'projects', { singular: 'project', singleRemote: false }, { isOverride: true })
  validateProjectList(overrideReport, overrides.starterProjects, 'starterProjects', { singular: 'starter project', singleRemote: true }, { isOverride: true })
  validateProjectList(overrideReport, overrides.dependentProjects, 'dependentProjects', { singular: 'dependent project', singleRemote: false }, { isOverride: true })

  overrideReport.errors.forEach((message) => report.error(`parent override → ${message}`))
  overrideReport.warnings.forEach((message) => report.warn(`parent override → ${message}`))

  ;(overrides.variables || []).forEach((variable, index) => {
    if (!(variable?.name || '').trim() && (variable?.value || '').trim()) {
      report.error(`parent override → variables[${index}] has a value but no name`)
    }
  })
}

function validateVariables(report, variables) {
  const names = new Set()
  ;(variables || []).forEach((variable, index) => {
    const name = (variable?.name || '').trim()
    if (!name) {
      if ((variable?.value || '').trim()) report.error(`variables[${index}] has a value but no name`)
      return
    }
    if (names.has(name)) report.error(`Duplicate variable name: "${name}"`)
    names.add(name)
    if (!/^[a-zA-Z0-9_\-.]+$/.test(name)) {
      report.warn(`variables: "${name}" contains characters that make {{${name}}} references ambiguous`)
    }
  })
}

/**
 * Validates the whole wizard state against the devfile 2.3.0 schema and the
 * devfile/api semantic rules.
 *
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateDevfile(data) {
  const report = createReport()

  const schemaVersion = (data.schemaVersion || '').trim()
  const schemaVersionError = validators.schemaVersion(schemaVersion)
  if (schemaVersionError) report.error(`schemaVersion: ${schemaVersionError}`)

  if ((data.dependentProjects || []).length > 0 && compareVersions(schemaVersion, '2.3.0') < 0) {
    report.error(`dependentProjects requires schemaVersion 2.3.0 or later (current: ${schemaVersion || 'unset'})`)
  }

  checkAttributes(report, data.attributes, 'devfile')

  validateMetadataSection(report, data.metadata)
  validateParent(report, data.parent)
  validateProjectList(report, data.projects, 'projects', { singular: 'project', singleRemote: false })
  validateProjectList(report, data.starterProjects, 'starterProjects', { singular: 'starter project', singleRemote: true })
  validateProjectList(report, data.dependentProjects, 'dependentProjects', { singular: 'dependent project', singleRemote: false })
  validateComponentList(report, data.components)
  validateCommandList(report, data.commands, data.components)
  validateEvents(report, data.events, data.commands)
  validateVariables(report, data.variables)

  return { errors: report.errors, warnings: report.warnings }
}

/** Compares two dotted versions. Returns -1, 0 or 1. */
export function compareVersions(a, b) {
  const parse = (value) => (value || '').split('-')[0].split('.').map((part) => parseInt(part, 10) || 0)
  const left = parse(a)
  const right = parse(b)
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] || 0) - (right[i] || 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

export function validateMetadata(metadata) {
  const errors = {}

  const name = (metadata.name || '').trim()
  if (name) {
    const nameError = validators.k8sName(name)
    if (nameError) errors.name = nameError
  }

  const versionError = validators.semver(metadata.version)
  if (versionError) errors.version = versionError

  const globalMemoryLimitError = validators.quantity(metadata.globalMemoryLimit)
  if (globalMemoryLimitError) errors.globalMemoryLimit = globalMemoryLimitError

  for (const field of ['website', 'supportUrl', 'icon']) {
    const value = metadata[field]
    if (value && /^https?:/i.test(value)) {
      const urlError = validators.url(value)
      if (urlError) errors[field] = urlError
    }
  }

  const attributesError = validators.yamlMap(metadata.attributes)
  if (attributesError) errors.attributes = attributesError

  return errors
}
