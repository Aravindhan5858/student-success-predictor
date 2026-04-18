import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'

const models = ['Random Forest', 'Logistic Regression', 'SVM', 'KNN']

const baseModelScores = {
  'Random Forest': { accuracy: 90.7, precision: 89.3, recall: 88.2, f1Score: 88.7 },
  'Logistic Regression': { accuracy: 86.9, precision: 85.5, recall: 84.4, f1Score: 84.9 },
  SVM: { accuracy: 88.1, precision: 87.2, recall: 86.6, f1Score: 86.8 },
  KNN: { accuracy: 84.6, precision: 83.8, recall: 82.5, f1Score: 83.1 },
}

const trainingStateTone = {
  idle: 'low',
  running: 'medium',
  completed: 'high',
}

function ModelTraining() {
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [crossValidationFolds, setCrossValidationFolds] = useState('5')
  const [trainSplit, setTrainSplit] = useState(80)
  const [earlyStoppingPatience, setEarlyStoppingPatience] = useState('8')
  const [enableFeatureScaling, setEnableFeatureScaling] = useState(true)
  const [enableAutoTuning, setEnableAutoTuning] = useState(true)
  const [classWeightMode, setClassWeightMode] = useState('balanced')
  const [progress, setProgress] = useState(0)
  const [trainingState, setTrainingState] = useState('idle')

  const performance = useMemo(() => {
    const baseScores = baseModelScores[selectedModel]
    const foldBoost = Number(crossValidationFolds) >= 7 ? 0.6 : 0.2
    const splitBoost = trainSplit >= 80 ? 0.4 : 0.1
    const featureScalingBoost = enableFeatureScaling ? 0.3 : -0.2
    const tuningBoost = enableAutoTuning ? 0.9 : 0
    const classWeightBoost = classWeightMode === 'balanced' ? 0.2 : 0
    const totalBoost = foldBoost + splitBoost + featureScalingBoost + tuningBoost + classWeightBoost

    return {
      accuracy: Math.min(97.9, Number((baseScores.accuracy + totalBoost).toFixed(1))),
      precision: Math.min(97.9, Number((baseScores.precision + totalBoost * 0.9).toFixed(1))),
      recall: Math.min(97.9, Number((baseScores.recall + totalBoost * 0.95).toFixed(1))),
      f1Score: Math.min(97.9, Number((baseScores.f1Score + totalBoost * 0.92).toFixed(1))),
    }
  }, [selectedModel, crossValidationFolds, trainSplit, enableFeatureScaling, enableAutoTuning, classWeightMode])

  useEffect(() => {
    if (trainingState !== 'running') {
      return undefined
    }

    const progressInterval = setInterval(() => {
      setProgress((previousProgress) => {
        const nextProgress = Math.min(100, previousProgress + Math.floor(Math.random() * 12) + 8)

        if (nextProgress >= 100) {
          setTrainingState('completed')
        }

        return nextProgress
      })
    }, 600)

    return () => clearInterval(progressInterval)
  }, [trainingState])

  const handleTrainModel = () => {
    setProgress(0)
    setTrainingState('running')
  }

  const isTraining = trainingState === 'running'
  const trainButtonLabel = isTraining ? 'Training...' : trainingState === 'completed' ? 'Retrain Model' : 'Train Model'
  const trainingStateLabel = trainingState.charAt(0).toUpperCase() + trainingState.slice(1)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Model Training</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure training options and run model tuning for better prediction performance.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Select Algorithm</label>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Train/Test Split</label>
            <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-700">
                <span>Training Data</span>
                <span className="font-semibold text-slate-900">{trainSplit}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={90}
                step={5}
                value={trainSplit}
                onChange={(event) => setTrainSplit(Number(event.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <Card className="mt-6 border border-slate-200 p-4 shadow-none">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Training Features</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Cross-Validation Folds</label>
              <select
                value={crossValidationFolds}
                onChange={(event) => setCrossValidationFolds(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="3">3-fold</option>
                <option value="5">5-fold</option>
                <option value="7">7-fold</option>
                <option value="10">10-fold</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Class Weight Strategy</label>
              <select
                value={classWeightMode}
                onChange={(event) => setClassWeightMode(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="balanced">Balanced</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Early Stopping Patience</label>
              <input
                type="number"
                min={3}
                max={20}
                step={1}
                value={earlyStoppingPatience}
                onChange={(event) => setEarlyStoppingPatience(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={enableFeatureScaling}
                  onChange={(event) => setEnableFeatureScaling(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Enable Feature Scaling
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={enableAutoTuning}
                  onChange={(event) => setEnableAutoTuning(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Enable Auto Hyperparameter Tuning
              </label>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Early stopping set to {earlyStoppingPatience} epochs with {crossValidationFolds}-fold cross-validation.
          </p>
        </Card>

        <div className="mt-6">
          <Button fullWidth={false} className="px-6" onClick={handleTrainModel} disabled={isTraining}>
            {trainButtonLabel}
          </Button>
        </div>

        <div className="mt-8 space-y-5">
          <ProgressBar value={progress} label="Training Progress" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-slate-500">Selected Model</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{selectedModel}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Training Status</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xl font-semibold text-slate-900">{trainingStateLabel}</p>
                <Badge tone={trainingStateTone[trainingState]}>{trainingStateLabel}</Badge>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Accuracy</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{performance.accuracy}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Precision</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{performance.precision}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Recall</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{performance.recall}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">F1-Score</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xl font-semibold text-slate-900">{performance.f1Score}%</p>
                <Badge tone={performance.f1Score >= 90 ? 'high' : 'medium'}>
                  {performance.f1Score >= 90 ? 'Excellent' : 'Improving'}
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ModelTraining
