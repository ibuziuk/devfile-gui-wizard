import { useState, useEffect, useMemo } from 'react'
import { useWizard } from '../../hooks/useWizardState'
import { useYamlGenerator } from '../../hooks/useYamlGenerator'
import { validateDevfile } from '../../utils/validation'
import { copyToClipboard, downloadYamlFile } from '../../utils/downloadFile'
import Button from '../common/Button'
import Card from '../common/Card'

export default function YamlPreview({ inSidebar = false }) {
  const { state } = useWizard()
  const { generateYaml } = useYamlGenerator()
  const [yamlContent, setYamlContent] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setYamlContent(generateYaml(state.devfileData)), 300)
    return () => clearTimeout(timer)
  }, [state.devfileData, generateYaml])

  const { errors, warnings } = useMemo(() => validateDevfile(state.devfileData), [state.devfileData])

  const handleCopy = async () => {
    try {
      await copyToClipboard(yamlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className={inSidebar ? 'sticky top-4' : ''}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">devfile.yaml</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} className="text-xs px-2 py-1">
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadYamlFile(yamlContent, 'devfile.yaml')}
            className="text-xs px-2 py-1"
          >
            Download
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-3 text-xs">
        {errors.length > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800">
            {errors.length} error{errors.length === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
            Schema valid
          </span>
        )}
        {warnings.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800">
            {warnings.length} warning{warnings.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className={`bg-gray-900 rounded-lg p-4 overflow-auto ${inSidebar ? 'max-h-[32rem]' : 'max-h-96'}`}>
        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{yamlContent}</pre>
      </div>
    </Card>
  )
}
