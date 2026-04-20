import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { useAppContext } from '../context/AppContext'

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

const pipelineSteps = [
  'Load data from MongoDB / CSV',
  'Preprocess missing values and duplicates',
  'Engineer engagement features',
  'Split data 80/20',
  'Train selected algorithm',
  'Evaluate accuracy, precision, recall, F1',
  'Save model artifact for prediction',
]

const featureGroups = [
  'Attendance (%)',
  'Assignment Score',
  'Internal Marks',
  'Study Hours',
  'Classroom Interaction',
  'Assessment Score',
  'Interview Score',
]

const modelDescriptions = {
  'Random Forest': 'Best overall choice for mixed academic data and non-linear patterns.',
  'Logistic Regression': 'Fast baseline classifier for pass/fail and risk segmentation.',
  SVM: 'Strong option for smaller datasets with clear decision boundaries.',
  KNN: 'Simple benchmark model, useful for comparison and local similarity checks.',
}

function ModelTraining() {
  const { currentUser } = useAppContext()
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [crossValidationFolds, setCrossValidationFolds] = useState('5')
  const [trainSplit, setTrainSplit] = useState(80)
  const [earlyStoppingPatience, setEarlyStoppingPatience] = useState('8')
  const [enableFeatureScaling, setEnableFeatureScaling] = useState(true)
  const [enableAutoTuning, setEnableAutoTuning] = useState(true)
  const [classWeightMode, setClassWeightMode] = useState('balanced')
  const [progress, setProgress] = useState(0)
  const [trainingState, setTrainingState] = useState('idle')
  const [trainingLog, setTrainingLog] = useState([])

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

  const predictedRiskLevel = useMemo(() => {
    if (performance.accuracy >= 90) {
      return 'Low'
    }

    if (performance.accuracy >= 85) {
      return 'Medium'
    }

    return 'High'
  }, [performance.accuracy])

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
    setTrainingLog([
      'Loaded academic records from data source',
      `Selected ${selectedModel} for training`,
      `Using ${crossValidationFolds}-fold validation and ${trainSplit}% train split`,
      'Feature scaling and class balancing applied',
      'Evaluation metrics computed and model artifact prepared',
    ])
  }

  const handleReset = () => {
    setProgress(0)
    setTrainingState('idle')
    setTrainingLog([])
  }

  const isTraining = trainingState === 'running'
  const canTrain = currentUser?.role === 'admin'
  const trainButtonLabel = isTraining ? 'Training...' : trainingState === 'completed' ? 'Retrain Model' : 'Train Model'
  const trainingStateLabel = trainingState.charAt(0).toUpperCase() + trainingState.slice(1)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Model Training</h2>
        <p className="text-sm text-slate-500">
          Converts raw student academic data into a predictive engine for score estimation and risk classification.
        </p>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Training Configuration</h3>
            <p className="mt-1 text-sm text-slate-500">
              Configure the algorithm, preprocessing settings, and validation strategy before training.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Training Mode</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={canTrain ? 'high' : 'low'}>{canTrain ? 'Admin Access' : 'Read Only'}</Badge>
              <span className="text-sm text-slate-600">Only admin can train and publish model metrics.</span>
            </div>
          </div>
        </div>

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

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="border border-slate-200 p-4 shadow-none">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Input Feature Set</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {featureGroups.map((feature) => (
                <span key={feature} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                  {feature}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Final score or performance class is used as the target label depending on whether regression or classification is enabled.
            </p>
          </Card>

          <Card className="border border-slate-200 p-4 shadow-none">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Model Guidance</h3>
            <div className="mt-4 space-y-3">
              {models.map((model) => {
                const isActive = model === selectedModel
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setSelectedModel(model)}
                    className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-indigo-400/70 bg-indigo-950/35 shadow-[0_0_20px_rgba(91,140,255,0.28)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{model}</p>
                      <p className="mt-1 text-sm text-slate-500">{modelDescriptions[model]}</p>
                    </div>
                    {isActive ? <Badge tone="high">Selected</Badge> : <Badge tone="low">Compare</Badge>}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <Card className="mt-6 border border-slate-200 p-4 shadow-none">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Data Pipeline</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pipelineSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">Step {index + 1}</p>
                    <p className="text-sm text-slate-500">{step}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

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
            Missing values are handled before training. Derived features such as engagement index and average performance can be added in preprocessing.
          </p>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button fullWidth={false} className="px-6" onClick={handleTrainModel} disabled={isTraining || !canTrain}>
            {trainButtonLabel}
          </Button>
          <Button fullWidth={false} variant="outline" className="px-6" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {!canTrain ? (
          <p className="mt-3 text-sm text-amber-700">Training controls are reserved for admin users.</p>
        ) : null}

        <div className="mt-8 space-y-5">
          <ProgressBar value={progress} label="Training Progress" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-slate-500">Selected Model</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">{selectedModel}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Training Status</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900 sm:text-xl">{trainingStateLabel}</p>
                <Badge tone={trainingStateTone[trainingState]}>{trainingStateLabel}</Badge>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Accuracy</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">{performance.accuracy}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Precision</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">{performance.precision}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Recall</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">{performance.recall}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">F1-Score</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900 sm:text-xl">{performance.f1Score}%</p>
                <Badge tone={performance.f1Score >= 90 ? 'high' : 'medium'}>
                  {performance.f1Score >= 90 ? 'Excellent' : 'Improving'}
                </Badge>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Predicted Risk</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900 sm:text-xl">{predictedRiskLevel}</p>
                <Badge tone={predictedRiskLevel === 'Low' ? 'high' : predictedRiskLevel === 'Medium' ? 'medium' : 'low'}>
                  {predictedRiskLevel}
                </Badge>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Training Flow</p>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Load data</li>
                <li>Preprocess and normalize</li>
                <li>Train model</li>
                <li>Evaluate metrics</li>
                <li>Save model artifact</li>
              </ol>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Training Log</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {trainingLog.length ? (
                  trainingLog.map((entry) => (
                    <div key={entry} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      {entry}
                    </div>
                  ))
                ) : (
                  <p>No training started yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ModelTraining
