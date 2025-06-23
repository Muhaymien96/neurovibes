import React from 'react';
import { Brain, CheckSquare, BarChart3, Lightbulb, Target, Sparkles, Check } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Your AI-powered focus companion
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of neurodivergent-friendly productivity with Gemini AI
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Brain className="h-6 w-6 text-indigo-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Enhanced AI Coaching</h4>
            <p className="text-gray-600 leading-relaxed">
              Advanced AI powered by Google's Gemini that learns from your patterns and provides 
              deeply personalized, contextual guidance with natural voice interaction.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <CheckSquare className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Smart Task Management</h4>
            <p className="text-gray-600 leading-relaxed">
              Break down overwhelming tasks into manageable sub-tasks, set up recurring tasks, 
              and organize with drag-and-drop reordering designed for neurodivergent minds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="h-6 w-6 text-pink-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Mood Insights & Trends</h4>
            <p className="text-gray-600 leading-relaxed">
              Track your mood, energy, and focus levels with beautiful visualizations and 
              AI-powered insights that reveal patterns and correlations with your productivity.
            </p>
          </div>
        </div>

        {/* Detailed Features */}
        <div className="space-y-16 mt-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Enhanced AI Coaching</h2>
              <p className="text-gray-600 mb-6">
                Our AI coach powered by Google's Gemini learns from your historical data to provide deeply personalized guidance. 
                It understands your productive hours, mood patterns, and task completion habits to offer the most relevant support.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Contextual coaching based on your patterns</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Natural voice interaction with warm TTS</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Personalized task breakdown strategies</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl">
              <Brain className="h-16 w-16 text-indigo-600 mb-4" />
              <p className="text-indigo-800 italic">
                "Based on your patterns, you tend to be most productive around 10 AM. 
                Let's break this overwhelming task into 3 smaller steps that match your energy levels."
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl order-2 md:order-1">
              <BarChart3 className="h-16 w-16 text-purple-600 mb-4" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Mood Trend</span>
                  <span className="text-sm font-semibold text-purple-800">↗ Improving</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Mood Insights</h2>
              <p className="text-gray-600 mb-6">
                Track your mood, energy, and focus levels with beautiful trend visualizations. 
                Our AI analyzes correlations between your mood and productivity to provide actionable insights.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Visual trend charts and patterns</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Mood-productivity correlations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Personalized recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};