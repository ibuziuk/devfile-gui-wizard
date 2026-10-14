import { useWizard } from '../../hooks/useWizardState'
import WizardProgressBar from './WizardProgressBar'
import Card from '../common/Card'

import MetadataStep from '../steps/MetadataStep'
import ParentStep from '../steps/ParentStep'
import ProjectsStep from '../steps/ProjectsStep'
import ComponentsStep from '../steps/ComponentsStep'
import CommandsStep from '../steps/CommandsStep'
import EventsStep from '../steps/EventsStep'
import VariablesStep from '../steps/VariablesStep'
import ReviewStep from '../steps/ReviewStep'

const STEP_COMPONENTS = [
  MetadataStep,
  ParentStep,
  ProjectsStep,
  ComponentsStep,
  CommandsStep,
  EventsStep,
  VariablesStep,
  ReviewStep
]

export default function WizardContainer() {
  const { state } = useWizard()
  const Step = STEP_COMPONENTS[state.currentStep] || MetadataStep

  return (
    <div>
      <WizardProgressBar />
      <Card className="wizard-step">
        <Step />
      </Card>
    </div>
  )
}
