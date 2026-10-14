import { ENDPOINT_EXPOSURES, ENDPOINT_PROTOCOLS, newEndpoint } from '../../utils/constants'
import { validators } from '../../utils/validation'
import FormInput from '../forms/FormInput'
import FormSelect from '../forms/FormSelect'
import FormBoolean from '../forms/FormBoolean'
import AttributesEditor from '../forms/AttributesEditor'
import CollapsibleSection from '../forms/CollapsibleSection'
import KeyValueArrayManager from '../forms/KeyValueArrayManager'
import ArrayFieldManager, { listHelpers } from '../forms/ArrayFieldManager'

/** Editor for `endpoints`, shared by container, kubernetes and openshift components. */
export default function EndpointListEditor({ endpoints = [], onChange, idPrefix }) {
  const list = listHelpers(endpoints, onChange)

  const renderEndpoint = (endpoint, index) => {
    const id = `${idPrefix}-endpoint-${index}`
    const set = (field, value) => list.update(index, { [field]: value })

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormInput
            name={`${id}-name`}
            label="Name"
            value={endpoint.name || ''}
            onChange={(event) => set('name', event.target.value)}
            error={validators.k8sName(endpoint.name)}
            required
            placeholder="http-3000"
            helpText="Unique across all components"
          />
          <FormInput
            name={`${id}-targetPort`}
            label="Target port"
            type="number"
            value={endpoint.targetPort ?? ''}
            onChange={(event) => set('targetPort', event.target.value)}
            error={validators.port(endpoint.targetPort)}
            required
            placeholder="3000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormSelect
            name={`${id}-protocol`}
            label="Protocol"
            value={endpoint.protocol || ''}
            onChange={(event) => set('protocol', event.target.value)}
            options={ENDPOINT_PROTOCOLS}
            placeholder="Default (http)"
          />
          <FormSelect
            name={`${id}-exposure`}
            label="Exposure"
            value={endpoint.exposure || ''}
            onChange={(event) => set('exposure', event.target.value)}
            options={ENDPOINT_EXPOSURES}
            placeholder="Default (public)"
            helpText="public: outside the cluster · internal: cluster only · none: not exposed"
          />
        </div>

        <CollapsibleSection
          title="Advanced endpoint settings"
          badge={(endpoint.annotation?.length || 0) + (endpoint.path ? 1 : 0) + (endpoint.attributes ? 1 : 0)}
        >
          <FormInput
            name={`${id}-path`}
            label="Path"
            value={endpoint.path || ''}
            onChange={(event) => set('path', event.target.value)}
            placeholder="/api"
            helpText="Path of the endpoint URL"
          />
          <FormBoolean
            name={`${id}-secure`}
            label="Secure"
            value={endpoint.secure}
            onChange={(value) => set('secure', value)}
            helpText="Describes whether the endpoint should be secured and protected by some authentication process."
          />
          <KeyValueArrayManager
            label="Annotations"
            items={endpoint.annotation || []}
            onUpdate={(value) => set('annotation', value)}
            keyLabel="Annotation"
            valuePlaceholder="value"
            helpText="Annotations added to the underlying Kubernetes Ingress or OpenShift Route."
            addButtonText="Add annotation"
          />
          <AttributesEditor
            name={`${id}-attributes`}
            value={endpoint.attributes || ''}
            onChange={(value) => set('attributes', value)}
            helpText="Free-form YAML map, e.g. discoverable, urlRewriteSupported, type: main."
          />
        </CollapsibleSection>
      </div>
    )
  }

  return (
    <ArrayFieldManager
      items={endpoints}
      onAdd={() => list.add(newEndpoint())}
      onRemove={list.remove}
      onMove={list.move}
      renderItem={renderEndpoint}
      itemTitle={(endpoint, index) => endpoint.name || `Endpoint ${index + 1}`}
      addButtonText="Add endpoint"
      emptyMessage="No endpoints defined."
    />
  )
}
