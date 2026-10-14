import yaml from 'js-yaml'

// ---------------------------------------------------------------------------
// Primitive coercion helpers
//
// The wizard stores every optional boolean as a tri-state ('' | true | false)
// so that "not set" stays distinguishable from an explicit `false`, and stores
// every string map (remotes, annotations, env) as an ordered array of
// { name, value } pairs so the fields stay editable. These helpers convert that
// UI-shaped state back into what the devfile schema expects.
// ---------------------------------------------------------------------------

function str(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function bool(value) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function int(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}

function stringList(items) {
  if (!Array.isArray(items)) return undefined
  const cleaned = items.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
  return cleaned.length > 0 ? cleaned : undefined
}

function pairsToMap(pairs) {
  if (!Array.isArray(pairs)) return undefined
  const map = {}
  for (const pair of pairs) {
    const name = str(pair?.name)
    if (!name) continue
    map[name] = typeof pair.value === 'string' ? pair.value : ''
  }
  return Object.keys(map).length > 0 ? map : undefined
}

function pairsToEnv(pairs) {
  if (!Array.isArray(pairs)) return undefined
  const env = pairs
    .filter((pair) => str(pair?.name))
    .map((pair) => ({ name: pair.name.trim(), value: typeof pair.value === 'string' ? pair.value : '' }))
  return env.length > 0 ? env : undefined
}

/**
 * Free-form `attributes` maps are edited as YAML text. Invalid YAML is dropped
 * here and surfaced as a validation error instead, so the preview never breaks
 * while the user is mid-keystroke.
 */
export function parseAttributes(text) {
  const source = str(text)
  if (!source) return undefined
  try {
    const parsed = yaml.load(source)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
    return Object.keys(parsed).length > 0 ? parsed : undefined
  } catch {
    return undefined
  }
}

/** Assigns `value` to `target[key]` only when it carries content. */
function put(target, key, value) {
  if (value === undefined || value === null) return
  if (typeof value === 'string' && value === '') return
  if (Array.isArray(value) && value.length === 0) return
  target[key] = value
}

/** Drops a nested object when every one of its fields turned out to be unset. */
function compact(obj) {
  return Object.keys(obj).length > 0 ? obj : undefined
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildMetadata(metadata) {
  if (!metadata) return undefined
  const result = {}
  put(result, 'name', str(metadata.name))
  put(result, 'version', str(metadata.version))
  put(result, 'displayName', str(metadata.displayName))
  put(result, 'description', str(metadata.description))
  put(result, 'tags', stringList(metadata.tags))
  put(result, 'icon', str(metadata.icon))
  put(result, 'globalMemoryLimit', str(metadata.globalMemoryLimit))
  put(result, 'projectType', str(metadata.projectType))
  put(result, 'language', str(metadata.language))
  put(result, 'website', str(metadata.website))
  put(result, 'provider', str(metadata.provider))
  put(result, 'supportUrl', str(metadata.supportUrl))
  put(result, 'architectures', stringList(metadata.architectures))
  put(result, 'attributes', parseAttributes(metadata.attributes))
  return compact(result)
}

function buildGitSource(git) {
  const result = {}
  put(result, 'remotes', pairsToMap(git?.remotes))

  const checkoutFrom = {}
  put(checkoutFrom, 'remote', str(git?.checkoutFrom?.remote))
  put(checkoutFrom, 'revision', str(git?.checkoutFrom?.revision))
  put(result, 'checkoutFrom', compact(checkoutFrom))

  return result
}

function buildProject(project, kind) {
  const result = {}
  put(result, 'name', str(project.name))
  put(result, 'attributes', parseAttributes(project.attributes))

  if (kind === 'starterProjects') {
    put(result, 'description', str(project.description))
    put(result, 'subDir', str(project.subDir))
  } else {
    put(result, 'clonePath', str(project.clonePath))
  }

  // The source key is always emitted so the `oneOf(git, zip)` constraint stays
  // recognisable even while the entry is still incomplete.
  if (project.sourceType === 'zip') {
    const zip = {}
    put(zip, 'location', str(project.zip?.location))
    result.zip = zip
  } else {
    result.git = buildGitSource(project.git)
  }

  return result
}

function buildProjectList(projects, kind) {
  if (!Array.isArray(projects) || projects.length === 0) return undefined
  return projects.map((project) => buildProject(project, kind))
}

function buildEndpoint(endpoint) {
  const result = {}
  put(result, 'name', str(endpoint.name))
  put(result, 'targetPort', int(endpoint.targetPort))
  put(result, 'protocol', str(endpoint.protocol))
  put(result, 'exposure', str(endpoint.exposure))
  put(result, 'path', str(endpoint.path))
  const secure = bool(endpoint.secure)
  if (secure !== undefined) result.secure = secure
  put(result, 'annotation', pairsToMap(endpoint.annotation))
  put(result, 'attributes', parseAttributes(endpoint.attributes))
  return result
}

function buildEndpoints(endpoints) {
  if (!Array.isArray(endpoints) || endpoints.length === 0) return undefined
  return endpoints.map(buildEndpoint)
}

function buildContainer(container) {
  const result = {}
  put(result, 'image', str(container?.image))
  put(result, 'command', stringList(container?.command))
  put(result, 'args', stringList(container?.args))
  put(result, 'env', pairsToEnv(container?.env))
  put(result, 'memoryRequest', str(container?.memoryRequest))
  put(result, 'memoryLimit', str(container?.memoryLimit))
  put(result, 'cpuRequest', str(container?.cpuRequest))
  put(result, 'cpuLimit', str(container?.cpuLimit))

  const mountSources = bool(container?.mountSources)
  if (mountSources !== undefined) result.mountSources = mountSources
  put(result, 'sourceMapping', str(container?.sourceMapping))
  const dedicatedPod = bool(container?.dedicatedPod)
  if (dedicatedPod !== undefined) result.dedicatedPod = dedicatedPod

  const volumeMounts = (container?.volumeMounts || [])
    .filter((mount) => str(mount?.name))
    .map((mount) => {
      const entry = { name: mount.name.trim() }
      put(entry, 'path', str(mount.path))
      return entry
    })
  put(result, 'volumeMounts', volumeMounts)

  put(result, 'endpoints', buildEndpoints(container?.endpoints))

  const annotation = {}
  put(annotation, 'deployment', pairsToMap(container?.deploymentAnnotation))
  put(annotation, 'service', pairsToMap(container?.serviceAnnotation))
  put(result, 'annotation', compact(annotation))

  return result
}

function buildK8sLike(source) {
  const result = {}
  if (source?.sourceType === 'inlined') {
    put(result, 'inlined', str(source?.inlined))
  } else {
    put(result, 'uri', str(source?.uri))
  }
  const deployByDefault = bool(source?.deployByDefault)
  if (deployByDefault !== undefined) result.deployByDefault = deployByDefault
  put(result, 'endpoints', buildEndpoints(source?.endpoints))
  return result
}

function buildDockerfile(dockerfile) {
  const result = {}

  if (dockerfile?.sourceType === 'devfileRegistry') {
    const registry = {}
    put(registry, 'id', str(dockerfile?.devfileRegistry?.id))
    put(registry, 'registryUrl', str(dockerfile?.devfileRegistry?.registryUrl))
    result.devfileRegistry = registry
  } else if (dockerfile?.sourceType === 'git') {
    const git = buildGitSource(dockerfile?.git)
    put(git, 'fileLocation', str(dockerfile?.git?.fileLocation))
    result.git = git
  } else {
    put(result, 'uri', str(dockerfile?.uri))
  }

  put(result, 'buildContext', str(dockerfile?.buildContext))
  const rootRequired = bool(dockerfile?.rootRequired)
  if (rootRequired !== undefined) result.rootRequired = rootRequired
  put(result, 'args', stringList(dockerfile?.args))

  return result
}

function buildImage(image, isOverride) {
  const result = {}
  put(result, 'imageName', str(image?.imageName))

  const dockerfile = buildDockerfile(image?.dockerfile)
  const autoBuild = bool(image?.autoBuild)

  if (!isOverride) {
    result.dockerfile = dockerfile
    if (autoBuild !== undefined) result.autoBuild = autoBuild
    return result
  }

  // In a parent override an image is `oneOf(dockerfile, autoBuild)`: setting
  // both matches two branches and is rejected by the schema, so an override
  // that only flips autoBuild must not carry an empty dockerfile. Defining
  // both is reported as a validation error rather than silently merged.
  if (Object.keys(dockerfile).length > 0) {
    result.dockerfile = dockerfile
  } else if (autoBuild !== undefined) {
    result.autoBuild = autoBuild
  } else {
    result.dockerfile = dockerfile
  }

  return result
}

function buildComponent(component, isOverride) {
  const result = {}
  put(result, 'name', str(component.name))
  put(result, 'attributes', parseAttributes(component.attributes))

  switch (component.componentType) {
    case 'kubernetes':
      result.kubernetes = buildK8sLike(component.kubernetes)
      break
    case 'openshift':
      result.openshift = buildK8sLike(component.openshift)
      break
    case 'volume': {
      const volume = {}
      put(volume, 'size', str(component.volume?.size))
      const ephemeral = bool(component.volume?.ephemeral)
      if (ephemeral !== undefined) volume.ephemeral = ephemeral
      result.volume = volume
      break
    }
    case 'image':
      result.image = buildImage(component.image, isOverride)
      break
    case 'container':
    default:
      result.container = buildContainer(component.container)
      break
  }

  return result
}

function buildComponents(components, isOverride = false) {
  if (!Array.isArray(components) || components.length === 0) return undefined
  return components.map((component) => buildComponent(component, isOverride))
}

function buildGroup(group) {
  const kind = str(group?.kind)
  if (!kind) return undefined
  const result = { kind }
  const isDefault = bool(group?.isDefault)
  if (isDefault !== undefined) result.isDefault = isDefault
  return result
}

function buildCommand(command) {
  const result = {}
  put(result, 'id', str(command.id))
  put(result, 'attributes', parseAttributes(command.attributes))

  switch (command.commandType) {
    case 'apply': {
      const apply = {}
      put(apply, 'component', str(command.apply?.component))
      put(apply, 'label', str(command.apply?.label))
      put(apply, 'group', buildGroup(command.apply?.group))
      result.apply = apply
      break
    }
    case 'composite': {
      const composite = {}
      put(composite, 'commands', stringList(command.composite?.commands))
      put(composite, 'label', str(command.composite?.label))
      const parallel = bool(command.composite?.parallel)
      if (parallel !== undefined) composite.parallel = parallel
      put(composite, 'group', buildGroup(command.composite?.group))
      result.composite = composite
      break
    }
    case 'exec':
    default: {
      const exec = {}
      put(exec, 'commandLine', str(command.exec?.commandLine))
      put(exec, 'component', str(command.exec?.component))
      put(exec, 'workingDir', str(command.exec?.workingDir))
      put(exec, 'env', pairsToEnv(command.exec?.env))
      put(exec, 'label', str(command.exec?.label))
      const hotReloadCapable = bool(command.exec?.hotReloadCapable)
      if (hotReloadCapable !== undefined) exec.hotReloadCapable = hotReloadCapable
      put(exec, 'group', buildGroup(command.exec?.group))
      result.exec = exec
      break
    }
  }

  return result
}

function buildCommands(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return undefined
  return commands.map(buildCommand)
}

function buildEvents(events) {
  if (!events) return undefined
  const result = {}
  for (const type of ['preStart', 'postStart', 'preStop', 'postStop']) {
    put(result, type, stringList(events[type]))
  }
  return compact(result)
}

function buildParent(parent) {
  if (!parent?.enabled) return undefined
  const result = {}

  switch (parent.sourceType) {
    case 'id':
      put(result, 'id', str(parent.id))
      put(result, 'registryUrl', str(parent.registryUrl))
      break
    case 'kubernetes': {
      const kubernetes = {}
      put(kubernetes, 'name', str(parent.kubernetes?.name))
      put(kubernetes, 'namespace', str(parent.kubernetes?.namespace))
      result.kubernetes = kubernetes
      break
    }
    case 'uri':
    default:
      put(result, 'uri', str(parent.uri))
      break
  }

  put(result, 'version', str(parent.version))

  const overrides = parent.overrides || {}
  put(result, 'attributes', parseAttributes(overrides.attributes))
  put(result, 'components', buildComponents(overrides.components, true))
  put(result, 'commands', buildCommands(overrides.commands))
  put(result, 'projects', buildProjectList(overrides.projects, 'projects'))
  put(result, 'starterProjects', buildProjectList(overrides.starterProjects, 'starterProjects'))
  put(result, 'dependentProjects', buildProjectList(overrides.dependentProjects, 'dependentProjects'))
  put(result, 'variables', pairsToMap(overrides.variables))

  return compact(result)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts the wizard's internal state into a devfile object that follows the
 * devfile 2.3.0 schema. Keys are emitted in the canonical devfile order.
 */
export function buildDevfile(data) {
  const result = {}

  result.schemaVersion = str(data.schemaVersion) || '2.3.0'
  put(result, 'metadata', buildMetadata(data.metadata))
  put(result, 'attributes', parseAttributes(data.attributes))
  put(result, 'parent', buildParent(data.parent))
  put(result, 'projects', buildProjectList(data.projects, 'projects'))
  put(result, 'dependentProjects', buildProjectList(data.dependentProjects, 'dependentProjects'))
  put(result, 'starterProjects', buildProjectList(data.starterProjects, 'starterProjects'))
  put(result, 'components', buildComponents(data.components))
  put(result, 'commands', buildCommands(data.commands))
  put(result, 'events', buildEvents(data.events))
  put(result, 'variables', pairsToMap(data.variables))

  return result
}

export function generateYaml(data) {
  return yaml.dump(buildDevfile(data), {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  })
}
