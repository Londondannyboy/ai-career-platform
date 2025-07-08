'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrinityRitualProps {
  onComplete: (trinityData: {
    quest: string;
    service: string;
    pledge: string;
    trinity_type: 'F' | 'L' | 'M';
    trinity_type_description: string;
  }) => void;
  onClose: () => void;
}

type RitualStep = 'introduction' | 'foundation_choice' | 'quest' | 'service' | 'pledge' | 'confirmation';

const TrinityRitual: React.FC<TrinityRitualProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState<RitualStep>('introduction');
  const [trinityData, setTrinityData] = useState({
    quest: '',
    service: '',
    pledge: '',
    trinity_type: '' as 'F' | 'L' | 'M' | '',
    trinity_type_description: ''
  });
  const [isTyping, setIsTyping] = useState(false);

  // Sacred geometry styling with golden ratio proportions
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: [0.04, 0.62, 0.23, 0.98] }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.5 }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.04, 0.62, 0.23, 0.98] }
    },
    exit: { 
      opacity: 0, 
      y: -30,
      transition: { duration: 0.4 }
    }
  };

  const handleNext = () => {
    const stepOrder: RitualStep[] = ['introduction', 'foundation_choice', 'quest', 'service', 'pledge', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: RitualStep[] = ['introduction', 'foundation_choice', 'quest', 'service', 'pledge', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const updateTrinityData = (field: string, value: string) => {
    setTrinityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (trinityData.quest && trinityData.service && trinityData.pledge && trinityData.trinity_type) {
      onComplete(trinityData as any);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'introduction':
        return (
          <motion.div
            key="introduction"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center max-w-2xl mx-auto"
          >
            <div className="mb-8">
              {/* Sacred Triangle Symbol */}
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-blue-400"
                  />
                  <circle cx="50" cy="35" r="2" fill="currentColor" className="text-blue-400" />
                  <circle cx="70" cy="65" r="2" fill="currentColor" className="text-green-400" />
                  <circle cx="30" cy="65" r="2" fill="currentColor" className="text-purple-400" />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              The Quest Trinity Ritual
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Welcome to something profound. You're about to participate in a ritual that transforms 
              professional networking from transaction to transformation.
            </p>
            
            <p className="text-lg text-gray-400 mb-8">
              This isn't typical onboarding. You'll answer three eternal questions that form the 
              foundation of your professional identity. Take your time. Be honest. Be bold.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-blue-300">The Three Eternal Questions</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-gray-300"><strong>Quest:</strong> What drives you?</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-gray-300"><strong>Service:</strong> How do you serve?</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span className="text-gray-300"><strong>Pledge:</strong> What do you commit to?</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Begin the Ritual
            </button>
          </motion.div>
        );

      case 'foundation_choice':
        return (
          <motion.div
            key="foundation_choice"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Choose Your Relationship with Identity</h2>
            
            <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl mx-auto">
              This choice reflects deep human psychology about professional identity. 
              How do you see your Trinity statements?
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Foundation Quest */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  trinityData.trinity_type === 'F' 
                    ? 'border-stone-400 bg-stone-900/50' 
                    : 'border-gray-600 bg-gray-800/30 hover:border-stone-500'
                }`}
                onClick={() => {
                  updateTrinityData('trinity_type', 'F');
                  updateTrinityData('trinity_type_description', 'These define who I am. Keep them unchanged.');
                }}
              >
                <div className="text-4xl mb-4">🗿</div>
                <h3 className="text-xl font-bold mb-3 text-stone-300">Foundation Quest</h3>
                <p className="text-gray-400 mb-4">
                  "These define who I am. Keep them unchanged."
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Immutable professional anchors</li>
                  <li>• Stability and consistency</li>
                  <li>• Long-term commitment</li>
                </ul>
              </motion.div>

              {/* Living Trinity */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  trinityData.trinity_type === 'L' 
                    ? 'border-green-400 bg-green-900/50' 
                    : 'border-gray-600 bg-gray-800/30 hover:border-green-500'
                }`}
                onClick={() => {
                  updateTrinityData('trinity_type', 'L');
                  updateTrinityData('trinity_type_description', 'I want to grow and evolve these over time.');
                }}
              >
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-xl font-bold mb-3 text-green-300">Living Trinity</h3>
                <p className="text-gray-400 mb-4">
                  "I want to grow and evolve these over time."
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Evolutionary identity</li>
                  <li>• Growth and adaptation</li>
                  <li>• Flexible development</li>
                </ul>
              </motion.div>

              {/* Mixed Approach */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  trinityData.trinity_type === 'M' 
                    ? 'border-purple-400 bg-purple-900/50' 
                    : 'border-gray-600 bg-gray-800/30 hover:border-purple-500'
                }`}
                onClick={() => {
                  updateTrinityData('trinity_type', 'M');
                  updateTrinityData('trinity_type_description', 'Some elements permanent, others evolving.');
                }}
              >
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold mb-3 text-purple-300">Mixed Approach</h3>
                <p className="text-gray-400 mb-4">
                  "Some elements permanent, others evolving."
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Strategic combination</li>
                  <li>• Selective permanence</li>
                  <li>• Balanced stability</li>
                </ul>
              </motion.div>
            </div>

            {trinityData.trinity_type && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 rounded-lg p-6 mb-8"
              >
                <h4 className="font-semibold mb-2">Your Choice:</h4>
                <p className="text-gray-300">{trinityData.trinity_type_description}</p>
              </motion.div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!trinityData.trinity_type}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Continue to Questions
              </button>
            </div>
          </motion.div>
        );

      case 'quest':
        return (
          <motion.div
            key="quest"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-600"
                  />
                  <circle cx="50" cy="35" r="4" fill="currentColor" className="text-blue-400" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-blue-300">What is your Quest?</h2>
              <p className="text-lg text-gray-400">
                Your professional mission, from the pragmatic to the profound. 
                What drives you forward?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <textarea
                  value={trinityData.quest}
                  onChange={(e) => updateTrinityData('quest', e.target.value)}
                  placeholder="To master artificial intelligence and use it to democratize access to personalized education..."
                  className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Be specific, be bold, be honest</span>
                  <span>{trinityData.quest.length}/500</span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold mb-2 text-blue-300">Quest Examples:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• "To revolutionize healthcare through AI-driven diagnostics"</li>
                  <li>• "To build sustainable technology that helps solve climate change"</li>
                  <li>• "To create products that make complex technology accessible to everyone"</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={trinityData.quest.trim().length < 10}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Continue to Service
              </button>
            </div>
          </motion.div>
        );

      case 'service':
        return (
          <motion.div
            key="service"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-600"
                  />
                  <circle cx="70" cy="65" r="4" fill="currentColor" className="text-green-400" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-green-300">How do you Serve?</h2>
              <p className="text-lg text-gray-400">
                The deeper why behind your professional life. 
                Who or what do you ultimately serve?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <textarea
                  value={trinityData.service}
                  onChange={(e) => updateTrinityData('service', e.target.value)}
                  placeholder="I serve underrepresented communities by creating technology that amplifies their voices..."
                  className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-green-400 focus:outline-none resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Think beyond yourself - who benefits from your work?</span>
                  <span>{trinityData.service.length}/500</span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold mb-2 text-green-300">Service Examples:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• "Small business owners who struggle with technology adoption"</li>
                  <li>• "Future generations who will inherit our environmental choices"</li>
                  <li>• "Students from low-income families seeking quality education"</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={trinityData.service.trim().length < 10}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Continue to Pledge
              </button>
            </div>
          </motion.div>
        );

      case 'pledge':
        return (
          <motion.div
            key="pledge"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-600"
                  />
                  <circle cx="30" cy="65" r="4" fill="currentColor" className="text-purple-400" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-purple-300">What is your Pledge?</h2>
              <p className="text-lg text-gray-400">
                Your way of being, not just doing. 
                How will you pursue your Quest and Service?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <textarea
                  value={trinityData.pledge}
                  onChange={(e) => updateTrinityData('pledge', e.target.value)}
                  placeholder="To stay curious, build with integrity, and lift others as I rise..."
                  className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>A personal vow of conduct and character</span>
                  <span>{trinityData.pledge.length}/500</span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold mb-2 text-purple-300">Pledge Examples:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• "To remain humble, curious, and always learning"</li>
                  <li>• "To build with integrity and never compromise on quality"</li>
                  <li>• "To elevate others and create opportunities for growth"</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={trinityData.pledge.trim().length < 10}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Review Trinity
              </button>
            </div>
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div
            key="confirmation"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gradient"
                  />
                  <circle cx="50" cy="35" r="3" fill="currentColor" className="text-blue-400" />
                  <circle cx="70" cy="65" r="3" fill="currentColor" className="text-green-400" />
                  <circle cx="30" cy="65" r="3" fill="currentColor" className="text-purple-400" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">Your Trinity Complete</h2>
              <p className="text-lg text-gray-400">
                Review your Trinity statements. Once confirmed, they will be sealed with a 
                cryptographic Quest Seal according to your chosen approach.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-blue-300 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-400 mr-3"></span>
                  Quest
                </h3>
                <p className="text-gray-300">{trinityData.quest}</p>
              </div>

              <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-green-300 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-400 mr-3"></span>
                  Service
                </h3>
                <p className="text-gray-300">{trinityData.service}</p>
              </div>

              <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center">
                  <span className="w-3 h-3 rounded-full bg-purple-400 mr-3"></span>
                  Pledge
                </h3>
                <p className="text-gray-300">{trinityData.pledge}</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
              <h4 className="font-semibold mb-2">Trinity Type:</h4>
              <p className="text-gray-300">{trinityData.trinity_type_description}</p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-600 hover:from-blue-600 hover:via-green-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
              >
                Complete the Ritual
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-gray-900 rounded-xl border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2 mb-4">
              {['introduction', 'foundation_choice', 'quest', 'service', 'pledge', 'confirmation'].map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    currentStep === step 
                      ? 'bg-blue-400' 
                      : index < ['introduction', 'foundation_choice', 'quest', 'service', 'pledge', 'confirmation'].indexOf(currentStep)
                      ? 'bg-green-400'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TrinityRitual;