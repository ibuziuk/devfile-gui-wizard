import FormInput from '../forms/FormInput'
import KeyValueArrayManager from '../forms/KeyValueArrayManager'

/**
 * Editor for the shared git source shape (`remotes` + `checkoutFrom`) used by
 * projects, starter projects, dependent projects and Dockerfile image sources.
 */
export default function GitSourceEditor({
  git = {},
  onChange,
  idPrefix,
  singleRemote = false,
  showFileLocation = false
}) {
  const remotes = git.remotes || []
  const set = (field, value) => onChange({ ...git, [field]: value })
  const setCheckout = (field, value) =>
    onChange({ ...git, checkoutFrom: { ...(git.checkoutFrom || {}), [field]: value } })

  const remoteNames = remotes.map((remote) => (remote.name || '').trim()).filter(Boolean)
  const checkoutRemote = git.checkoutFrom?.remote || ''
  const checkoutRemoteError =
    checkoutRemote && !remoteNames.includes(checkoutRemote)
      ? 'Must match one of the remote names defined above'
      : remotes.length > 1 && !checkoutRemote
        ? 'Required when more than one remote is configured'
        : null

  return (
    <div>
      <KeyValueArrayManager
        label="Remotes"
        items={remotes}
        onUpdate={(value) => set('remotes', value)}
        keyLabel="Remote name"
        valueLabel="Repository URL"
        keyPlaceholder="origin"
        valuePlaceholder="https://github.com/org/repo.git"
        addButtonText="Add remote"
        emptyMessage="At least one remote is required."
        disableAdd={singleRemote && remotes.length >= 1}
        helpText={
          singleRemote
            ? 'Exactly one remote may be defined here.'
            : 'If more than one remote is defined, a checkout remote is mandatory.'
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormInput
          name={`${idPrefix}-checkout-remote`}
          label="Checkout from remote"
          value={checkoutRemote}
          onChange={(event) => setCheckout('remote', event.target.value)}
          error={checkoutRemoteError}
          placeholder={remoteNames[0] || 'origin'}
          helpText="Defaults to the only remote when a single one is configured."
        />
        <FormInput
          name={`${idPrefix}-checkout-revision`}
          label="Revision"
          value={git.checkoutFrom?.revision || ''}
          onChange={(event) => setCheckout('revision', event.target.value)}
          placeholder="main"
          helpText="Branch, tag or commit id. Defaults to the default branch."
        />
      </div>

      {showFileLocation && (
        <FormInput
          name={`${idPrefix}-fileLocation`}
          label="Dockerfile location"
          value={git.fileLocation || ''}
          onChange={(event) => set('fileLocation', event.target.value)}
          placeholder="docker/Dockerfile"
          helpText="Location of the Dockerfile in the git repository, relative to its root."
        />
      )}
    </div>
  )
}
