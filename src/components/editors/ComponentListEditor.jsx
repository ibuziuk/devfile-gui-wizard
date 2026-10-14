import {
  COMPONENT_TYPES,
  DOCKERFILE_SOURCE_TYPES,
  K8S_LIKE_SOURCE_TYPES,
  newComponent
} from '../../utils/constants'
import { validators } from '../../utils/validation'
import FormInput from '../forms/FormInput'
import FormSelect from '../forms/FormSelect'
import FormTextarea from '../forms/FormTextarea'
import FormBoolean from '../forms/FormBoolean'
import AttributesEditor from '../forms/AttributesEditor'
import CollapsibleSection from '../forms/CollapsibleSection'
import KeyValueArrayManager from '../forms/KeyValueArrayManager'
import StringListManager from '../forms/StringListManager'
import ArrayFieldManager, { listHelpers } from '../forms/ArrayFieldManager'
import EndpointListEditor from './EndpointListEditor'
import GitSourceEditor from './GitSourceEditor'

/** `volumeMounts` is a {name, path} list; it reuses the pair editor via a small mapping. */
function VolumeMountsEditor({ volumeMounts = [], onChange, volumeNames }) {
  const items = volumeMounts.map((mount) => ({ name: mount.name || '', value: mount.path || '' }))
  const handleUpdate = (next) => onChange(next.map((item) => ({ name: item.name, path: item.value })))

  return (
    <KeyValueArrayManager
      label="Volume mounts"
      items={items}
      onUpdate={handleUpdate}
      keyLabel="Volume component name"
      valueLabel="Mount path"
      keyPlaceholder="cache"
      valuePlaceholder="/home/user/.cache"
      addButtonText="Add volume mount"
      emptyMessage="No volumes mounted."
      helpText={
        volumeNames.length > 0
          ? `Must reference a volume component. Available: ${volumeNames.join(', ')}.`
          : 'Must reference the name of a volume component — define one first.'
      }
    />
  )
}

function ContainerEditor({ container = {}, onChange, id, volumeNames }) {
  const set = (field, value) => onChange({ ...container, [field]: value })

  return (
    <div>
      <FormInput
        name={`${id}-image`}
        label="Image"
        value={container.image || ''}
        onChange={(event) => set('image', event.target.value)}
        required
        placeholder="docker.io/library/node:18"
        helpText="Full container image reference."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormInput
          name={`${id}-memoryRequest`}
          label="Memory request"
          value={container.memoryRequest || ''}
          onChange={(event) => set('memoryRequest', event.target.value)}
          error={validators.quantity(container.memoryRequest)}
          placeholder="512Mi"
        />
        <FormInput
          name={`${id}-memoryLimit`}
          label="Memory limit"
          value={container.memoryLimit || ''}
          onChange={(event) => set('memoryLimit', event.target.value)}
          error={validators.quantity(container.memoryLimit)}
          placeholder="2Gi"
        />
        <FormInput
          name={`${id}-cpuRequest`}
          label="CPU request"
          value={container.cpuRequest || ''}
          onChange={(event) => set('cpuRequest', event.target.value)}
          error={validators.quantity(container.cpuRequest)}
          placeholder="500m"
        />
        <FormInput
          name={`${id}-cpuLimit`}
          label="CPU limit"
          value={container.cpuLimit || ''}
          onChange={(event) => set('cpuLimit', event.target.value)}
          error={validators.quantity(container.cpuLimit)}
          placeholder="1000m"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormBoolean
          name={`${id}-mountSources`}
          label="Mount sources"
          value={container.mountSources}
          onChange={(value) => set('mountSources', value)}
          helpText="Mount the project sources into the container. Defaults to true."
        />
        <FormInput
          name={`${id}-sourceMapping`}
          label="Source mapping"
          value={container.sourceMapping || ''}
          onChange={(event) => set('sourceMapping', event.target.value)}
          placeholder="/projects"
          helpText="Path in the container where sources are mounted. Defaults to /projects."
        />
      </div>

      <CollapsibleSection title="Endpoints" badge={container.endpoints?.length || 0}>
        <EndpointListEditor
          endpoints={container.endpoints || []}
          onChange={(value) => set('endpoints', value)}
          idPrefix={`${id}-container`}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Environment variables" badge={container.env?.length || 0}>
        <KeyValueArrayManager
          items={container.env || []}
          onUpdate={(value) => set('env', value)}
          keyLabel="Name"
          valueLabel="Value"
          keyPlaceholder="NODE_ENV"
          valuePlaceholder="development"
          addButtonText="Add environment variable"
          emptyMessage="No environment variables defined."
          helpText="PROJECT_SOURCE and PROJECTS_ROOT are reserved and cannot be redefined."
        />
      </CollapsibleSection>

      <CollapsibleSection title="Volume mounts" badge={container.volumeMounts?.length || 0}>
        <VolumeMountsEditor
          volumeMounts={container.volumeMounts || []}
          onChange={(value) => set('volumeMounts', value)}
          volumeNames={volumeNames}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Entrypoint override"
        badge={(container.command?.length || 0) + (container.args?.length || 0)}
        description="Override the image entrypoint. Leave empty to keep the image defaults."
      >
        <StringListManager
          label="Command"
          items={container.command || []}
          onChange={(value) => set('command', value)}
          placeholder="tail"
          addButtonText="Add command argument"
          emptyMessage="Image entrypoint is used."
        />
        <StringListManager
          label="Args"
          items={container.args || []}
          onChange={(value) => set('args', value)}
          placeholder="-f"
          addButtonText="Add arg"
          emptyMessage="Image arguments are used."
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Pod and annotations"
        badge={
          (container.deploymentAnnotation?.length || 0) +
          (container.serviceAnnotation?.length || 0) +
          (container.dedicatedPod === '' ? 0 : 1)
        }
      >
        <FormBoolean
          name={`${id}-dedicatedPod`}
          label="Dedicated pod"
          value={container.dedicatedPod}
          onChange={(value) => set('dedicatedPod', value)}
          helpText="Run this container in its own pod instead of the shared workspace pod. Defaults to false."
        />
        <KeyValueArrayManager
          label="Deployment annotations"
          items={container.deploymentAnnotation || []}
          onUpdate={(value) => set('deploymentAnnotation', value)}
          keyLabel="Annotation"
          addButtonText="Add deployment annotation"
          emptyMessage="No deployment annotations."
        />
        <KeyValueArrayManager
          label="Service annotations"
          items={container.serviceAnnotation || []}
          onUpdate={(value) => set('serviceAnnotation', value)}
          keyLabel="Annotation"
          addButtonText="Add service annotation"
          emptyMessage="No service annotations."
        />
      </CollapsibleSection>
    </div>
  )
}

function K8sLikeEditor({ source = {}, onChange, id, kindLabel }) {
  const set = (field, value) => onChange({ ...source, [field]: value })

  return (
    <div>
      <FormSelect
        name={`${id}-sourceType`}
        label="Manifest source"
        value={source.sourceType || 'uri'}
        onChange={(event) => set('sourceType', event.target.value)}
        options={K8S_LIKE_SOURCE_TYPES}
        placeholder=""
      />

      {source.sourceType === 'inlined' ? (
        <FormTextarea
          name={`${id}-inlined`}
          label="Inlined manifest"
          value={source.inlined || ''}
          onChange={(event) => set('inlined', event.target.value)}
          rows={8}
          required
          placeholder={`apiVersion: v1\nkind: Service\nmetadata:\n  name: my-service`}
          helpText={`Inlined ${kindLabel} manifest. Multiple documents separated by --- are allowed.`}
        />
      ) : (
        <FormInput
          name={`${id}-uri`}
          label="URI"
          value={source.uri || ''}
          onChange={(event) => set('uri', event.target.value)}
          error={validators.uri(source.uri)}
          required
          placeholder="manifests/deploy.yaml"
          helpText="Location of the manifest: a URL, or a path relative to the devfile."
        />
      )}

      <FormBoolean
        name={`${id}-deployByDefault`}
        label="Deploy by default"
        value={source.deployByDefault}
        onChange={(value) => set('deployByDefault', value)}
        helpText="Deploy the resource on workspace start, without an explicit apply command."
      />

      <CollapsibleSection title="Endpoints" badge={source.endpoints?.length || 0}>
        <EndpointListEditor
          endpoints={source.endpoints || []}
          onChange={(value) => set('endpoints', value)}
          idPrefix={id}
        />
      </CollapsibleSection>
    </div>
  )
}

function ImageEditor({ image = {}, onChange, id }) {
  const dockerfile = image.dockerfile || {}
  const set = (field, value) => onChange({ ...image, [field]: value })
  const setDockerfile = (field, value) => set('dockerfile', { ...dockerfile, [field]: value })

  return (
    <div>
      <FormInput
        name={`${id}-imageName`}
        label="Image name"
        value={image.imageName || ''}
        onChange={(event) => set('imageName', event.target.value)}
        required
        placeholder="quay.io/org/my-app:latest"
        helpText="Name of the image the Dockerfile is built into."
      />

      <FormBoolean
        name={`${id}-autoBuild`}
        label="Auto build"
        value={image.autoBuild}
        onChange={(value) => set('autoBuild', value)}
        helpText="Build the image on workspace start, without an explicit apply command."
      />

      <FormSelect
        name={`${id}-dockerfile-sourceType`}
        label="Dockerfile source"
        value={dockerfile.sourceType || 'uri'}
        onChange={(event) => setDockerfile('sourceType', event.target.value)}
        options={DOCKERFILE_SOURCE_TYPES}
        placeholder=""
      />

      {dockerfile.sourceType === 'devfileRegistry' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormInput
            name={`${id}-dockerfile-registry-id`}
            label="Registry id"
            value={dockerfile.devfileRegistry?.id || ''}
            onChange={(event) =>
              setDockerfile('devfileRegistry', { ...(dockerfile.devfileRegistry || {}), id: event.target.value })
            }
            required
            placeholder="python"
            helpText="Id of the Dockerfile in the devfile registry."
          />
          <FormInput
            name={`${id}-dockerfile-registry-url`}
            label="Registry URL"
            value={dockerfile.devfileRegistry?.registryUrl || ''}
            onChange={(event) =>
              setDockerfile('devfileRegistry', {
                ...(dockerfile.devfileRegistry || {}),
                registryUrl: event.target.value
              })
            }
            error={validators.uri(dockerfile.devfileRegistry?.registryUrl)}
            placeholder="https://registry.devfile.io"
            helpText="Defaults to the default devfile registry."
          />
        </div>
      )}

      {dockerfile.sourceType === 'git' && (
        <GitSourceEditor
          git={dockerfile.git || {}}
          onChange={(value) => setDockerfile('git', value)}
          idPrefix={`${id}-dockerfile-git`}
          singleRemote
          showFileLocation
        />
      )}

      {(dockerfile.sourceType === 'uri' || !dockerfile.sourceType) && (
        <FormInput
          name={`${id}-dockerfile-uri`}
          label="Dockerfile URI"
          value={dockerfile.uri || ''}
          onChange={(event) => setDockerfile('uri', event.target.value)}
          error={validators.uri(dockerfile.uri)}
          required
          placeholder="docker/Dockerfile"
          helpText="URL or path relative to the devfile."
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormInput
          name={`${id}-dockerfile-buildContext`}
          label="Build context"
          value={dockerfile.buildContext || ''}
          onChange={(event) => setDockerfile('buildContext', event.target.value)}
          placeholder="."
          helpText="Path of the source directory to build."
        />
        <FormBoolean
          name={`${id}-dockerfile-rootRequired`}
          label="Root required"
          value={dockerfile.rootRequired}
          onChange={(value) => setDockerfile('rootRequired', value)}
          helpText="The build needs root privileges."
        />
      </div>

      <StringListManager
        label="Build args"
        items={dockerfile.args || []}
        onChange={(value) => setDockerfile('args', value)}
        placeholder="--build-arg=VERSION=1.0"
        addButtonText="Add build arg"
        emptyMessage="No additional build arguments."
        helpText="Extra arguments passed to the image build."
      />
    </div>
  )
}

function VolumeEditor({ volume = {}, onChange, id }) {
  const set = (field, value) => onChange({ ...volume, [field]: value })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
      <FormInput
        name={`${id}-size`}
        label="Size"
        value={volume.size || ''}
        onChange={(event) => set('size', event.target.value)}
        error={validators.quantity(volume.size)}
        placeholder="2Gi"
        helpText="Storage size of the volume, e.g. 2Gi or 1024Mi."
      />
      <FormBoolean
        name={`${id}-ephemeral`}
        label="Ephemeral"
        value={volume.ephemeral}
        onChange={(value) => set('ephemeral', value)}
        helpText="Use emptyDir instead of a persistent volume. Defaults to false."
      />
    </div>
  )
}

/** Editor for the `components` array, reused for parent component overrides. */
export default function ComponentListEditor({ components = [], onChange, idPrefix = 'component' }) {
  const list = listHelpers(components, onChange)

  const volumeNames = components
    .filter((component) => component.componentType === 'volume')
    .map((component) => (component.name || '').trim())
    .filter(Boolean)

  const renderComponent = (component, index) => {
    const id = `${idPrefix}-${index}`
    const set = (field, value) => list.update(index, { [field]: value })

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormInput
            name={`${id}-name`}
            label="Name"
            value={component.name || ''}
            onChange={(event) => set('name', event.target.value)}
            error={validators.k8sName(component.name)}
            required
            placeholder="tools"
            helpText="Unique across all components."
          />
          <FormSelect
            name={`${id}-type`}
            label="Type"
            value={component.componentType || 'container'}
            onChange={(event) => set('componentType', event.target.value)}
            options={COMPONENT_TYPES}
            placeholder=""
          />
        </div>

        {component.componentType === 'container' && (
          <ContainerEditor
            container={component.container}
            onChange={(value) => set('container', value)}
            id={`${id}-container`}
            volumeNames={volumeNames}
          />
        )}

        {component.componentType === 'kubernetes' && (
          <K8sLikeEditor
            source={component.kubernetes}
            onChange={(value) => set('kubernetes', value)}
            id={`${id}-kubernetes`}
            kindLabel="Kubernetes"
          />
        )}

        {component.componentType === 'openshift' && (
          <K8sLikeEditor
            source={component.openshift}
            onChange={(value) => set('openshift', value)}
            id={`${id}-openshift`}
            kindLabel="OpenShift"
          />
        )}

        {component.componentType === 'volume' && (
          <VolumeEditor volume={component.volume} onChange={(value) => set('volume', value)} id={`${id}-volume`} />
        )}

        {component.componentType === 'image' && (
          <ImageEditor image={component.image} onChange={(value) => set('image', value)} id={`${id}-image`} />
        )}

        <CollapsibleSection title="Component attributes" badge={component.attributes ? 1 : 0}>
          <AttributesEditor
            name={`${id}-attributes`}
            value={component.attributes || ''}
            onChange={(value) => set('attributes', value)}
          />
        </CollapsibleSection>
      </div>
    )
  }

  return (
    <ArrayFieldManager
      items={components}
      onAdd={() => list.add(newComponent())}
      onRemove={list.remove}
      onMove={list.move}
      renderItem={renderComponent}
      itemTitle={(component, index) =>
        `${component.name || `Component ${index + 1}`} · ${component.componentType || 'container'}`
      }
      addButtonText="Add component"
      emptyMessage="No components defined."
    />
  )
}
