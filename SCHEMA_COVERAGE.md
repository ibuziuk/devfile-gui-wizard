# Devfile 2.3.0 Schema Coverage

Every property defined by the [devfile 2.3.0 schema](https://devfile.io/docs/2.3.0/devfile-schema)
is editable in the wizard. The schema is vendored at `schemas/devfile-2.3.0.json` and
`tests/devfileGenerator.test.js` asserts that the wizard can produce every property it defines, and
that the generated devfile validates against it.

Run `npm test` to verify.

## Top level

| Field | Status | Where |
|---|---|---|
| `schemaVersion` | ✅ | Metadata step (2.0.0 – 2.3.0) |
| `metadata` | ✅ | Metadata step |
| `attributes` | ✅ | Variables & attributes step |
| `parent` | ✅ | Parent step |
| `projects` | ✅ | Projects step |
| `starterProjects` | ✅ | Projects step |
| `dependentProjects` | ✅ | Projects step (2.3.0+) |
| `components` | ✅ | Components step |
| `commands` | ✅ | Commands step |
| `events` | ✅ | Events step |
| `variables` | ✅ | Variables & attributes step |

## metadata

✅ `name` · `version` · `displayName` · `description` · `tags` · `icon` · `globalMemoryLimit` ·
`projectType` · `language` · `website` · `provider` · `supportUrl` · `architectures` · `attributes`

## parent

✅ `uri` | `id` + `registryUrl` | `kubernetes` (`name`, `namespace`) — exactly one, as the schema requires
✅ `version`
✅ Overrides: `attributes`, `components`, `commands`, `projects`, `starterProjects`,
`dependentProjects`, `variables`

Override editors reuse the regular component/command/project editors, with required-field checks
relaxed because an override only patches the parent.

## projects / starterProjects / dependentProjects

| Field | projects | starterProjects | dependentProjects |
|---|---|---|---|
| `name` | ✅ | ✅ | ✅ |
| `attributes` | ✅ | ✅ | ✅ |
| `clonePath` | ✅ | n/a | ✅ |
| `description` | n/a | ✅ | n/a |
| `subDir` | n/a | ✅ | n/a |
| `git.remotes` | ✅ (many) | ✅ (one) | ✅ (many) |
| `git.checkoutFrom.remote` / `.revision` | ✅ | ✅ | ✅ |
| `zip.location` | ✅ | ✅ | ✅ |

## components

Common: ✅ `name`, ✅ `attributes`, exactly one component type.

### container
✅ `image` · `command` · `args` · `env` · `memoryRequest` · `memoryLimit` · `cpuRequest` ·
`cpuLimit` · `mountSources` · `sourceMapping` · `dedicatedPod` · `volumeMounts` (`name`, `path`) ·
`endpoints` · `annotation.deployment` · `annotation.service`

### kubernetes / openshift
✅ `uri` | `inlined` · `deployByDefault` · `endpoints`

### volume
✅ `size` · `ephemeral`

### image
✅ `imageName` · `autoBuild` · `dockerfile.uri` | `dockerfile.devfileRegistry` (`id`,
`registryUrl`) | `dockerfile.git` (`remotes`, `checkoutFrom`, `fileLocation`) ·
`dockerfile.buildContext` · `dockerfile.rootRequired` · `dockerfile.args`

### endpoints (container, kubernetes, openshift)
✅ `name` · `targetPort` · `protocol` · `exposure` · `path` · `secure` · `annotation` · `attributes`

## commands

Common: ✅ `id`, ✅ `attributes`, exactly one command type.

- **exec**: ✅ `commandLine` · `component` · `workingDir` · `env` · `label` · `hotReloadCapable` · `group`
- **apply**: ✅ `component` · `label` · `group`
- **composite**: ✅ `commands` (ordered) · `label` · `parallel` · `group`
- **group**: ✅ `kind` (build, run, test, debug, deploy) · `isDefault`

## events

✅ `preStart` · `postStart` · `preStop` · `postStop` — ordered, with command kinds enforced.

## Notes on representation

- Optional booleans are tri-state in the UI ("not set", yes, no) so that an explicit `false` stays
  distinguishable from an omitted field.
- String maps (`variables`, `git.remotes`, annotations, `env`) are edited as ordered key/value pairs
  so key order is stable.
- Free-form `attributes` maps are edited as YAML and parsed on generation.
- Empty entries still emit their type key (for example `volume: {}`) so the schema's `oneOf` branch
  stays identifiable while an entry is being filled in; validation reports what is still missing.

## Deliberate exclusions

- `components[].plugin` — present in the DevWorkspace API (`v1alpha2`) but **not** part of the
  published devfile 2.3.0 JSON schema, so it is not offered.
- `projects[].github` — removed from the schema; `git` covers GitHub repositories.
