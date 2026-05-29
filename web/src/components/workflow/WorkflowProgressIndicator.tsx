import React from 'react';

interface Props {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  onStepClick: (stepIndex: number) => void;
}

export const WorkflowProgressIndicator: React.FC<Props> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick
}) => {
  return (
    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
      {/* Steps List */}
      <div className="flex items-center justify-between gap-1 select-none">
        {steps.map((stepName, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;

          return (
            <React.Fragment key={stepName}>
              {/* Step circle item */}
              <div 
                onClick={() => onStepClick(stepNumber)}
                className={`flex flex-col items-center group cursor-pointer flex-1 transition-all duration-200`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-black transition-all ${
                  isActive 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-110' 
                    : isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}>
                  {stepNumber}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 hidden md:block text-center truncate w-full max-w-[80px] ${
                  isActive 
                    ? 'text-indigo-400 font-extrabold' 
                    : isCompleted 
                    ? 'text-emerald-400/80'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  {stepName.split(' ')[0]}
                </span>
              </div>

              {/* Connecting line */}
              {index < totalSteps - 1 && (
                <div className={`h-[2px] flex-1 min-w-[15px] -mt-4 transition-all duration-300 ${
                  currentStep > stepNumber 
                    ? 'bg-emerald-500/40' 
                    : 'bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
