import { initialWizardState } from '../../src/hooks/useWizardState'

/**
 * A wizard state that exercises every field of the devfile 2.3.0 schema,
 * including both branches of each `oneOf` and every optional boolean.
 */
export function fullDevfileState() {
  const base = JSON.parse(JSON.stringify(initialWizardState.devfileData))

  return {
    ...base,
    schemaVersion: '2.3.0',
    metadata: {
      name: 'full-coverage',
      version: '1.2.3-beta.1+build.5',
      displayName: 'Full Coverage Stack',
      description: 'Exercises every field of the devfile schema.',
      tags: ['Node.js', 'Express'],
      icon: 'https://example.com/icon.svg',
      globalMemoryLimit: '2674Mi',
      projectType: 'nodejs',
      language: 'JavaScript',
      website: 'https://example.com',
      provider: 'Example Inc',
      supportUrl: 'https://example.com/support',
      architectures: ['amd64', 'arm64'],
      attributes: 'alpha.build-context: .\nalpha.dockerimage-port: 3000'
    },
    attributes: 'controller.devfile.io/storage-type: ephemeral',
    parent: {
      enabled: true,
      sourceType: 'id',
      uri: '',
      id: 'nodejs',
      registryUrl: 'https://registry.devfile.io',
      kubernetes: { name: '', namespace: '' },
      version: '2.0.0',
      overrides: {
        attributes: 'overridden: true',
        components: [
          {
            name: 'parent-tools',
            componentType: 'container',
            attributes: 'from-parent: yes',
            container: {
              image: 'quay.io/devfile/base:ubi8',
              command: [],
              args: [],
              env: [{ name: 'OVERRIDE', value: 'yes' }],
              memoryRequest: '',
              memoryLimit: '3Gi',
              cpuRequest: '',
              cpuLimit: '',
              mountSources: '',
              sourceMapping: '',
              dedicatedPod: '',
              volumeMounts: [],
              endpoints: [],
              deploymentAnnotation: [],
              serviceAnnotation: []
            }
          }
        ],
        commands: [
          {
            id: 'parent-build',
            commandType: 'exec',
            attributes: '',
            exec: {
              component: 'parent-tools',
              commandLine: 'npm ci',
              workingDir: '',
              env: [],
              label: '',
              hotReloadCapable: '',
              group: { kind: 'build', isDefault: true }
            }
          }
        ],
        projects: [
          {
            name: 'parent-project',
            attributes: '',
            clonePath: 'parent',
            description: '',
            subDir: '',
            sourceType: 'git',
            git: {
              remotes: [{ name: 'origin', value: 'https://github.com/org/parent.git' }],
              checkoutFrom: { remote: 'origin', revision: 'main' }
            },
            zip: { location: '' }
          }
        ],
        starterProjects: [
          {
            name: 'parent-starter',
            attributes: '',
            clonePath: '',
            description: 'Parent starter',
            subDir: 'examples',
            sourceType: 'zip',
            git: { remotes: [], checkoutFrom: { remote: '', revision: '' } },
            zip: { location: 'https://example.com/parent.zip' }
          }
        ],
        dependentProjects: [
          {
            name: 'parent-dependency',
            attributes: '',
            clonePath: 'dep',
            description: '',
            subDir: '',
            sourceType: 'git',
            git: {
              remotes: [{ name: 'origin', value: 'https://github.com/org/dep.git' }],
              checkoutFrom: { remote: '', revision: '' }
            },
            zip: { location: '' }
          }
        ],
        variables: [{ name: 'PARENT_VAR', value: 'parent-value' }]
      }
    },
    projects: [
      {
        name: 'web',
        attributes: 'project-attr: value',
        clonePath: 'web',
        description: '',
        subDir: '',
        sourceType: 'git',
        git: {
          remotes: [
            { name: 'origin', value: 'https://github.com/org/web.git' },
            { name: 'upstream', value: 'https://github.com/upstream/web.git' }
          ],
          checkoutFrom: { remote: 'upstream', revision: 'v1.0.0' }
        },
        zip: { location: '' }
      },
      {
        name: 'docs',
        attributes: '',
        clonePath: '',
        description: '',
        subDir: '',
        sourceType: 'zip',
        git: { remotes: [], checkoutFrom: { remote: '', revision: '' } },
        zip: { location: 'https://example.com/docs.zip' }
      }
    ],
    starterProjects: [
      {
        name: 'nodejs-starter',
        attributes: 'starter-attr: value',
        clonePath: '',
        description: 'A minimal Node.js starter',
        subDir: 'examples/basic',
        sourceType: 'git',
        git: {
          remotes: [{ name: 'origin', value: 'https://github.com/org/starter.git' }],
          checkoutFrom: { remote: 'origin', revision: 'main' }
        },
        zip: { location: '' }
      }
    ],
    dependentProjects: [
      {
        name: 'shared-lib',
        attributes: '',
        clonePath: 'libs/shared',
        description: '',
        subDir: '',
        sourceType: 'git',
        git: {
          remotes: [{ name: 'origin', value: 'https://github.com/org/shared.git' }],
          checkoutFrom: { remote: '', revision: '' }
        },
        zip: { location: '' }
      }
    ],
    components: [
      {
        name: 'tools',
        componentType: 'container',
        attributes: 'container-attr: value',
        container: {
          image: 'quay.io/devfile/universal-developer-image:latest',
          command: ['tail'],
          args: ['-f', '/dev/null'],
          env: [{ name: 'NODE_ENV', value: 'development' }],
          memoryRequest: '512Mi',
          memoryLimit: '2Gi',
          cpuRequest: '500m',
          cpuLimit: '1000m',
          mountSources: true,
          sourceMapping: '/projects',
          dedicatedPod: false,
          volumeMounts: [{ name: 'cache', path: '/home/user/.cache' }],
          endpoints: [
            {
              name: 'http-3000',
              targetPort: '3000',
              exposure: 'public',
              protocol: 'https',
              path: '/api',
              secure: true,
              annotation: [{ name: 'haproxy.router.openshift.io/balance', value: 'roundrobin' }],
              attributes: 'discoverable: false\nurlRewriteSupported: true'
            },
            {
              name: 'debug-9229',
              targetPort: '9229',
              exposure: 'none',
              protocol: 'tcp',
              path: '',
              secure: false,
              annotation: [],
              attributes: ''
            }
          ],
          deploymentAnnotation: [{ name: 'app.kubernetes.io/part-of', value: 'demo' }],
          serviceAnnotation: [{ name: 'service.beta.openshift.io/serving-cert-secret-name', value: 'certs' }]
        }
      },
      {
        name: 'cache',
        componentType: 'volume',
        attributes: '',
        volume: { size: '2Gi', ephemeral: false }
      },
      {
        name: 'k8s-manifest',
        componentType: 'kubernetes',
        attributes: '',
        kubernetes: {
          sourceType: 'inlined',
          uri: '',
          inlined: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: demo',
          deployByDefault: true,
          endpoints: [
            {
              name: 'k8s-8080',
              targetPort: '8080',
              exposure: 'internal',
              protocol: 'http',
              path: '',
              secure: '',
              annotation: [],
              attributes: ''
            }
          ]
        }
      },
      {
        name: 'ocp-manifest',
        componentType: 'openshift',
        attributes: '',
        openshift: {
          sourceType: 'uri',
          uri: 'manifests/route.yaml',
          inlined: '',
          deployByDefault: false,
          endpoints: []
        }
      },
      {
        name: 'app-image',
        componentType: 'image',
        attributes: '',
        image: {
          imageName: 'quay.io/org/app:latest',
          autoBuild: true,
          dockerfile: {
            sourceType: 'git',
            uri: '',
            devfileRegistry: { id: '', registryUrl: '' },
            git: {
              remotes: [{ name: 'origin', value: 'https://github.com/org/app.git' }],
              checkoutFrom: { remote: 'origin', revision: 'main' },
              fileLocation: 'docker/Dockerfile'
            },
            buildContext: '.',
            rootRequired: false,
            args: ['--build-arg=VERSION=1.0']
          }
        }
      },
      {
        name: 'registry-image',
        componentType: 'image',
        attributes: '',
        image: {
          imageName: 'quay.io/org/registry-built:latest',
          autoBuild: false,
          dockerfile: {
            sourceType: 'devfileRegistry',
            uri: '',
            devfileRegistry: { id: 'python', registryUrl: 'https://registry.devfile.io' },
            git: { remotes: [], checkoutFrom: { remote: '', revision: '' }, fileLocation: '' },
            buildContext: '',
            rootRequired: '',
            args: []
          }
        }
      },
      {
        name: 'uri-image',
        componentType: 'image',
        attributes: '',
        image: {
          imageName: 'quay.io/org/uri-built:latest',
          autoBuild: '',
          dockerfile: {
            sourceType: 'uri',
            uri: 'docker/Dockerfile',
            devfileRegistry: { id: '', registryUrl: '' },
            git: { remotes: [], checkoutFrom: { remote: '', revision: '' }, fileLocation: '' },
            buildContext: '',
            rootRequired: true,
            args: []
          }
        }
      }
    ],
    commands: [
      {
        id: 'install',
        commandType: 'exec',
        attributes: 'command-attr: value',
        exec: {
          component: 'tools',
          commandLine: 'npm install',
          workingDir: '${PROJECT_SOURCE}',
          env: [{ name: 'CI', value: 'true' }],
          label: 'Install dependencies',
          hotReloadCapable: false,
          group: { kind: 'build', isDefault: true }
        }
      },
      {
        id: 'start',
        commandType: 'exec',
        attributes: '',
        exec: {
          component: 'tools',
          commandLine: 'npm start',
          workingDir: '',
          env: [],
          label: 'Run the app',
          hotReloadCapable: true,
          group: { kind: 'run', isDefault: true }
        }
      },
      {
        id: 'deploy-k8s',
        commandType: 'apply',
        attributes: '',
        apply: {
          component: 'k8s-manifest',
          label: 'Deploy to the cluster',
          group: { kind: 'deploy', isDefault: true }
        }
      },
      {
        id: 'build-image',
        commandType: 'apply',
        attributes: '',
        apply: { component: 'app-image', label: 'Build the image', group: { kind: '', isDefault: '' } }
      },
      {
        id: 'prepare',
        commandType: 'composite',
        attributes: '',
        composite: {
          commands: ['build-image', 'deploy-k8s'],
          label: 'Build and deploy',
          parallel: false,
          group: { kind: '', isDefault: '' }
        }
      },
      {
        id: 'post-start',
        commandType: 'composite',
        attributes: '',
        composite: {
          commands: ['install'],
          label: 'Bootstrap',
          parallel: true,
          group: { kind: '', isDefault: '' }
        }
      }
    ],
    events: {
      preStart: ['prepare'],
      postStart: ['post-start'],
      preStop: ['start'],
      postStop: ['deploy-k8s']
    },
    variables: [
      { name: 'version', value: '1.0.0' },
      { name: 'registry', value: 'quay.io' }
    ]
  }
}
