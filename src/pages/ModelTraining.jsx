import { useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'

const models = ['Random Forest', 'Logistic Regression', 'SVM', 'KNN']

function ModelTraining() {
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [progress] = useState(74)
  const [accuracy] = useState(91.2)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Model Training</h2>
        <p className="mt-1 text-sm text-slate-500">Select a model and preview the training status</p>

        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
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
          <Button fullWidth={false} className="px-6">
            Train Model
          </Button>
        </div>

        <div className="mt-8 space-y-5">
          <ProgressBar value={progress} label="Training Progress" />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <p className="text-sm text-slate-500">Selected Model</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{selectedModel}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Current Accuracy</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xl font-semibold text-slate-900">{accuracy}%</p>
                <Badge tone="low">Stable</Badge>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ModelTraining
