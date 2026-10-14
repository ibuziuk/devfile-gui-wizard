export const DEFAULT_SCHEMA_VERSION = '2.3.0'

export const WIZARD_STEPS = [
  { id: 'metadata', title: 'Metadata', required: true },
  { id: 'parent', title: 'Parent', required: false },
  { id: 'projects', title: 'Projects', required: false },
  { id: 'components', title: 'Components', required: false },
  { id: 'commands', title: 'Commands', required: false },
  { id: 'events', title: 'Events', required: false },
  { id: 'variables', title: 'Variables', required: false },
  { id: 'review', title: 'Review', required: true }
]

// ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$ - applies to component.name, command.id,
// project.name, starterProject.name and endpoint.name
export const K8S_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/

// Devfile schemaVersion: 2.x and up
export const SCHEMA_VERSION_PATTERN =
  /^([2-9])\.([0-9]+)\.([0-9]+)(-[0-9a-z-]+(\.[0-9a-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/

// metadata.version: strict semver
export const SEMVER_PATTERN =
  /^([0-9]+)\.([0-9]+)\.([0-9]+)(-[0-9a-z-]+(\.[0-9a-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/

// parent.version: semver starting at 1.x, or the literal "latest"
export const PARENT_VERSION_PATTERN =
  /^(latest)|(([1-9])\.([0-9]+)\.([0-9]+)(-[0-9a-z-]+(\.[0-9a-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?)$/

// Kubernetes resource quantity, e.g. 1Gi, 512Mi, 1000m, 0.5
export const QUANTITY_PATTERN =
  /^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/

// Reserved container env names that a devfile must not redefine
export const RESERVED_CONTAINER_ENV = ['PROJECT_SOURCE', 'PROJECTS_ROOT']

export const SCHEMA_VERSIONS = [
  { value: '2.0.0', label: '2.0.0' },
  { value: '2.1.0', label: '2.1.0' },
  { value: '2.2.0', label: '2.2.0' },
  { value: '2.2.1', label: '2.2.1' },
  { value: '2.2.2', label: '2.2.2' },
  { value: '2.3.0', label: '2.3.0 (latest)' }
]

export const LANGUAGES = [
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Java', label: 'Java' },
  { value: 'Go', label: 'Go' },
  { value: 'C#', label: 'C#' },
  { value: 'C++', label: 'C++' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Kotlin', label: 'Kotlin' },
  { value: 'Scala', label: 'Scala' },
  { value: '.NET', label: '.NET' }
]

export const PROJECT_TYPES = [
  { value: 'application', label: 'Application' },
  { value: 'library', label: 'Library' },
  { value: 'tool', label: 'Tool' },
  { value: 'framework', label: 'Framework' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'quarkus', label: 'Quarkus' },
  { value: 'springboot', label: 'Spring Boot' },
  { value: 'django', label: 'Django' },
  { value: 'dotnet', label: '.NET' }
]

// metadata.architectures enum
export const ARCHITECTURES = ['amd64', 'arm64', 'ppc64le', 's390x']

export const COMPONENT_TYPES = [
  { value: 'container', label: 'Container' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'openshift', label: 'OpenShift' },
  { value: 'volume', label: 'Volume' },
  { value: 'image', label: 'Image' }
]

export const COMMAND_TYPES = [
  { value: 'exec', label: 'Exec' },
  { value: 'apply', label: 'Apply' },
  { value: 'composite', label: 'Composite' }
]

export const COMMAND_GROUP_KINDS = [
  { value: 'build', label: 'Build' },
  { value: 'run', label: 'Run' },
  { value: 'test', label: 'Test' },
  { value: 'debug', label: 'Debug' },
  { value: 'deploy', label: 'Deploy' }
]

export const ENDPOINT_PROTOCOLS = [
  { value: 'http', label: 'http' },
  { value: 'https', label: 'https' },
  { value: 'ws', label: 'ws' },
  { value: 'wss', label: 'wss' },
  { value: 'tcp', label: 'tcp' },
  { value: 'udp', label: 'udp' }
]

export const ENDPOINT_EXPOSURES = [
  { value: 'public', label: 'public' },
  { value: 'internal', label: 'internal' },
  { value: 'none', label: 'none' }
]

export const K8S_LIKE_SOURCE_TYPES = [
  { value: 'uri', label: 'URI (external file)' },
  { value: 'inlined', label: 'Inlined manifest' }
]

export const PROJECT_SOURCE_TYPES = [
  { value: 'git', label: 'Git repository' },
  { value: 'zip', label: 'Zip archive' }
]

export const DOCKERFILE_SOURCE_TYPES = [
  { value: 'uri', label: 'URI' },
  { value: 'devfileRegistry', label: 'Devfile registry' },
  { value: 'git', label: 'Git repository' }
]

export const PARENT_SOURCE_TYPES = [
  { value: 'uri', label: 'URI' },
  { value: 'id', label: 'Registry id' },
  { value: 'kubernetes', label: 'Kubernetes DevWorkspaceTemplate' }
]

export const EVENT_TYPES = [
  {
    value: 'preStart',
    label: 'preStart',
    description:
      'Executed as init containers before the workspace pod starts. Only apply commands (or composites of apply commands) are allowed.',
    allows: 'apply'
  },
  {
    value: 'postStart',
    label: 'postStart',
    description:
      'Executed after the workspace pod starts. Only exec commands (or composites of exec commands) are allowed.',
    allows: 'exec'
  },
  {
    value: 'preStop',
    label: 'preStop',
    description:
      'Executed before the workspace pod stops. Only exec commands (or composites of exec commands) are allowed.',
    allows: 'exec'
  },
  {
    value: 'postStop',
    label: 'postStop',
    description:
      'Executed after the workspace pod stops. Only apply commands (or composites of apply commands) are allowed.',
    allows: 'apply'
  }
]

// Project list flavours. `projects` and `dependentProjects` share a shape;
// `starterProjects` swaps clonePath for description/subDir and allows one remote.
export const PROJECT_KINDS = {
  projects: {
    key: 'projects',
    label: 'Projects',
    singular: 'project',
    hasClonePath: true,
    hasDescription: false,
    hasSubDir: false,
    singleRemote: false,
    description:
      'Source repositories cloned into the workspace. Omit this section when the devfile lives at the root of the repository it describes.'
  },
  starterProjects: {
    key: 'starterProjects',
    label: 'Starter Projects',
    singular: 'starter project',
    hasClonePath: false,
    hasDescription: true,
    hasSubDir: true,
    singleRemote: true,
    description:
      'Sample/template projects a user can pick from when bootstrapping a new workspace from this devfile.'
  },
  dependentProjects: {
    key: 'dependentProjects',
    label: 'Dependent Projects',
    singular: 'dependent project',
    hasClonePath: true,
    hasDescription: false,
    hasSubDir: false,
    singleRemote: false,
    description:
      'Additional projects the main project depends on, cloned alongside it. Requires schemaVersion 2.3.0 or later.'
  }
}

// ---------------------------------------------------------------------------
// Factories for new (empty) wizard entries. The wizard keeps a discriminator
// field (componentType / commandType / sourceType) that is stripped when the
// devfile is generated.
// ---------------------------------------------------------------------------

export function newEndpoint() {
  return {
    name: '',
    targetPort: '',
    exposure: '',
    protocol: '',
    path: '',
    secure: '',
    annotation: [],
    attributes: ''
  }
}

export function newComponent(componentType = 'container') {
  return {
    name: '',
    componentType,
    attributes: '',
    container: {
      image: '',
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
      endpoints: [],
      deploymentAnnotation: [],
      serviceAnnotation: []
    },
    kubernetes: { sourceType: 'uri', uri: '', inlined: '', deployByDefault: '', endpoints: [] },
    openshift: { sourceType: 'uri', uri: '', inlined: '', deployByDefault: '', endpoints: [] },
    volume: { size: '', ephemeral: '' },
    image: {
      imageName: '',
      autoBuild: '',
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
  }
}

export function newCommand(commandType = 'exec') {
  return {
    id: '',
    commandType,
    attributes: '',
    exec: {
      component: '',
      commandLine: '',
      workingDir: '',
      env: [],
      label: '',
      hotReloadCapable: '',
      group: { kind: '', isDefault: '' }
    },
    apply: {
      component: '',
      label: '',
      group: { kind: '', isDefault: '' }
    },
    composite: {
      commands: [],
      label: '',
      parallel: '',
      group: { kind: '', isDefault: '' }
    }
  }
}

export function newProject() {
  return {
    name: '',
    attributes: '',
    clonePath: '',
    description: '',
    subDir: '',
    sourceType: 'git',
    git: {
      remotes: [{ name: 'origin', value: '' }],
      checkoutFrom: { remote: '', revision: '' }
    },
    zip: { location: '' }
  }
}

export function newParentOverrides() {
  return {
    attributes: '',
    components: [],
    commands: [],
    projects: [],
    starterProjects: [],
    dependentProjects: [],
    variables: []
  }
}

export function newParent() {
  return {
    enabled: false,
    sourceType: 'uri',
    uri: '',
    id: '',
    registryUrl: '',
    kubernetes: { name: '', namespace: '' },
    version: '',
    overrides: newParentOverrides()
  }
}
