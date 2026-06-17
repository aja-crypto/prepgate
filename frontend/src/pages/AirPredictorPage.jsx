// AIR Predictor Page
import { useState } from 'react';
import AirPredictor from '../components/gate/AirPredictor';

const HowItWorks = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl hover:bg-primary/8 transition-colors"
      >
        <div>
          <div className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="text-lg">📊</span> How AIR Predictor Works
          </div>
          <p className="text-xs text-text3 mt-1">
            Estimate your potential GATE rank based on mock scores
          </p>
        </div>
        <span className="text-lg text-text3">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="bg-bg-2 border border-border rounded-b-xl p-4 -mt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-border">
              <div className="text-primary font-bold mb-1">1</div>
              <div className="text-xs text-text2">Analyzes your recent 3 mock scores</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-primary font-bold mb-1">2</div>
              <div className="text-xs text-text2">Calculates average score & percentile</div>
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="text-primary font-bold mb-1">3</div>
              <div className="text-xs text-text2">Estimates rank range using heuristic mapping</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AirPredictorPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">🏆 AIR Predictor</h1>

      <HowItWorks />

      <AirPredictor />

      <div className="mt-6 bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text mb-3">What affects your rank?</h3>
        <div className="space-y-2 text-xs text-text2">
          <p>• Exam difficulty level</p>
          <p>• Competition strength (number of candidates)</p>
          <p>• Normalization process</p>
          <p>• Your consistency across all subjects</p>
        </div>
      </div>
    </div>
  );
}