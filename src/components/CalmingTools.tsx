import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Wind, 
  Waves, 
  Mountain, 
  Play, 
  Pause, 
  RotateCcw,
  Flower2,
  Sun,
  Moon
} from 'lucide-react';

export const CalmingTools: React.FC = () => {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingCycle, setBreathingCycle] = useState(0);

  // Breathing exercise timing (in seconds)
  const breathingPattern = {
    inhale: 4,
    hold: 4,
    exhale: 6,
    pause: 2
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          const currentPhaseTime = breathingPattern[breathingPhase];
          
          if (prev >= currentPhaseTime) {
            // Move to next phase
            switch (breathingPhase) {
              case 'inhale':
                setBreathingPhase('hold');
                break;
              case 'hold':
                setBreathingPhase('exhale');
                break;
              case 'exhale':
                setBreathingPhase('pause');
                break;
              case 'pause':
                setBreathingPhase('inhale');
                setBreathingCycle(prev => prev + 1);
                break;
            }
            return 0;
          }
          
          return prev + 0.1;
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isBreathingActive, breathingPhase]);

  const startBreathing = () => {
    setIsBreathingActive(true);
    setActiveExercise('breathing');
    setBreathingPhase('inhale');
    setBreathingTimer(0);
    setBreathingCycle(0);
  };

  const stopBreathing = () => {
    setIsBreathingActive(false);
    setActiveExercise(null);
  };

  const resetBreathing = () => {
    setIsBreathingActive(false);
    setBreathingPhase('inhale');
    setBreathingTimer(0);
    setBreathingCycle(0);
  };

  const getBreathingScale = () => {
    const progress = breathingTimer / breathingPattern[breathingPhase];
    
    switch (breathingPhase) {
      case 'inhale':
        return 1 + (progress * 0.5); // Scale from 1 to 1.5
      case 'hold':
        return 1.5; // Stay at max size
      case 'exhale':
        return 1.5 - (progress * 0.5); // Scale from 1.5 to 1
      case 'pause':
        return 1; // Stay at min size
      default:
        return 1;
    }
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe in slowly...';
      case 'hold':
        return 'Hold your breath...';
      case 'exhale':
        return 'Breathe out slowly...';
      case 'pause':
        return 'Pause and relax...';
      default:
        return 'Ready to begin';
    }
  };

  const groundingTechniques = [
    {
      title: "5-4-3-2-1 Technique",
      description: "Ground yourself by identifying:",
      steps: [
        "5 things you can see",
        "4 things you can touch",
        "3 things you can hear",
        "2 things you can smell",
        "1 thing you can taste"
      ]
    },
    {
      title: "Body Scan",
      description: "Notice physical sensations:",
      steps: [
        "Start at the top of your head",
        "Slowly move attention down your body",
        "Notice any tension or sensations",
        "Breathe into areas of tension",
        "End at your toes"
      ]
    },
    {
      title: "Safe Place Visualization",
      description: "Imagine a place where you feel completely safe:",
      steps: [
        "Picture the details of this place",
        "Notice the colors, sounds, and smells",
        "Feel the safety and comfort",
        "Stay here as long as you need",
        "Remember you can return anytime"
      ]
    }
  ];

  const muscleGroups = [
    { name: "Face & Jaw", instruction: "Scrunch your face, then relax" },
    { name: "Shoulders", instruction: "Lift shoulders to ears, then drop" },
    { name: "Arms & Hands", instruction: "Make fists and tense arms, then release" },
    { name: "Chest", instruction: "Take a deep breath and hold, then exhale" },
    { name: "Stomach", instruction: "Tighten stomach muscles, then relax" },
    { name: "Legs", instruction: "Tense thigh and calf muscles, then release" },
    { name: "Feet", instruction: "Point toes and tense feet, then relax" }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Calming Tools</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Take a moment to center yourself with these gentle exercises designed to reduce anxiety and promote calm.
        </p>
      </div>

      {/* Breathing Exercise */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-100">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-blue-900 flex items-center justify-center space-x-2">
            <Wind className="h-6 w-6" />
            <span>Guided Breathing</span>
          </h3>
          
          {/* Breathing Circle */}
          <div className="relative flex items-center justify-center h-64">
            <div 
              className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center"
              style={{ 
                transform: `scale(${getBreathingScale()})`,
                boxShadow: `0 0 ${20 * getBreathingScale()}px rgba(59, 130, 246, 0.5)`
              }}
            >
              <Heart className="h-8 w-8 text-white" />
            </div>
            
            {/* Breathing instruction */}
            <div className="absolute bottom-0 text-center">
              <p className="text-lg font-medium text-blue-900">
                {isBreathingActive ? getBreathingInstruction() : 'Ready to begin'}
              </p>
              {isBreathingActive && (
                <p className="text-sm text-blue-700 mt-1">
                  Cycle {breathingCycle + 1} • {breathingPhase}
                </p>
              )}
            </div>
          </div>

          {/* Breathing Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isBreathingActive ? stopBreathing : startBreathing}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isBreathingActive 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isBreathingActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span>{isBreathingActive ? 'Stop' : 'Start Breathing'}</span>
            </button>
            
            <button
              onClick={resetBreathing}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
            <p><strong>4-4-6-2 Breathing Pattern:</strong> Inhale for 4 seconds, hold for 4, exhale for 6, pause for 2</p>
          </div>
        </div>
      </div>

      {/* Grounding Techniques */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
        <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center space-x-2">
          <Mountain className="h-6 w-6" />
          <span>Grounding Techniques</span>
        </h3>
        
        <div className="grid gap-6">
          {groundingTechniques.map((technique, index) => (
            <div key={index} className="bg-white/70 p-6 rounded-xl border border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-2">{technique.title}</h4>
              <p className="text-green-800 mb-4">{technique.description}</p>
              <ol className="space-y-2">
                {technique.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {stepIndex + 1}
                    </span>
                    <span className="text-green-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Progressive Muscle Relaxation */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
        <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center space-x-2">
          <Flower2 className="h-6 w-6" />
          <span>Progressive Muscle Relaxation</span>
        </h3>
        
        <div className="space-y-4">
          <p className="text-purple-800 mb-6">
            Tense each muscle group for 5 seconds, then relax for 10 seconds. Notice the difference between tension and relaxation.
          </p>
          
          <div className="grid gap-4">
            {muscleGroups.map((group, index) => (
              <div key={index} className="bg-white/70 p-4 rounded-lg border border-purple-200 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-900">{group.name}</h4>
                  <p className="text-sm text-purple-700">{group.instruction}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-600">5s tense</span>
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-xs text-purple-600">10s relax</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-purple-700 bg-purple-100 p-3 rounded-lg mt-6">
            <p><strong>Tip:</strong> Start from the top and work your way down. Take your time and focus on the contrast between tension and relaxation.</p>
          </div>
        </div>
      </div>

      {/* Quick Calm Reminders */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
        <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center space-x-2">
          <Sun className="h-5 w-5" />
          <span>Quick Calm Reminders</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/70 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium">This feeling is temporary</p>
            <p className="text-sm text-amber-700">Anxiety and overwhelm will pass. You've gotten through difficult moments before.</p>
          </div>
          
          <div className="bg-white/70 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium">You are safe right now</p>
            <p className="text-sm text-amber-700">In this moment, you are physically safe. Your nervous system is just being protective.</p>
          </div>
          
          <div className="bg-white/70 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium">One thing at a time</p>
            <p className="text-sm text-amber-700">You don't have to solve everything right now. Focus on just the next small step.</p>
          </div>
          
          <div className="bg-white/70 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium">Your brain is doing its best</p>
            <p className="text-sm text-amber-700">Neurodivergent minds work differently, not wrong. Be gentle with yourself.</p>
          </div>
        </div>
      </div>
    </div>
  );
};