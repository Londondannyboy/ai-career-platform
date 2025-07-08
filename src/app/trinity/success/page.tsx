'use client';

export default function TrinitySuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon
                points="50,10 90,80 10,80"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-blue-400"
              />
              <circle cx="50" cy="35" r="3" fill="currentColor" className="text-blue-400" />
              <circle cx="70" cy="65" r="3" fill="currentColor" className="text-green-400" />
              <circle cx="30" cy="65" r="3" fill="currentColor" className="text-purple-400" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            Trinity Created Successfully! 🔺
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Your Trinity ritual is complete. Your professional identity has been crystallized 
            into the three eternal questions.
          </p>
          
          <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-green-300">✅ What was created:</h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>🔺 <strong>Your Trinity Statement</strong> - Quest, Service, and Pledge</li>
              <li>🔒 <strong>Quest Seal</strong> - Cryptographic commitment to your Trinity</li>
              <li>⚙️ <strong>Coaching Preferences</strong> - Default focus distribution (34/33/33)</li>
              <li>📊 <strong>Evolution Tracking</strong> - History of your Trinity creation</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <a 
              href="/trinity/dashboard" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors mr-4"
            >
              View Trinity Dashboard
            </a>
            
            <a 
              href="/quest/enhanced" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Trinity-Focused Coaching
            </a>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Your Trinity is now part of the Quest system and will influence your coaching experience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}