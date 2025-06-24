import React from 'react';
import { Brain, CheckSquare, BarChart3, Zap, Shield, Heart, Mail, Phone, Clock, Star, Check, ArrowRight, Lightbulb, Target, Sparkles } from 'lucide-react';

interface ContentPagesProps {
  page: 'features' | 'pricing' | 'help' | 'contact' | 'privacy';
}

export const ContentPages: React.FC<ContentPagesProps> = ({ page }) => {
  const renderFeatures = () => (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Features Built for <span className="text-indigo-600">Neurodivergent Minds</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          MindMesh combines cutting-edge AI with neurodivergent-friendly design to help you focus, organize, and thrive.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            icon: Brain,
            title: "AI-Powered Coaching",
            description: "Get personalized guidance from Gemini AI that understands your patterns and provides contextual support.",
            color: "indigo"
          },
          {
            icon: CheckSquare,
            title: "Smart Task Management",
            description: "Break down overwhelming tasks into manageable sub-tasks with drag-and-drop reordering and recurring tasks.",
            color: "purple"
          },
          {
            icon: BarChart3,
            title: "Mood & Energy Tracking",
            description: "Track your mood, energy, and focus levels with beautiful visualizations and AI-powered insights.",
            color: "pink"
          },
          {
            icon: Lightbulb,
            title: "Brain Dump Processing",
            description: "Capture thoughts anytime, anywhere. AI automatically categorizes and organizes your brain dumps.",
            color: "yellow"
          },
          {
            icon: Target,
            title: "Smart Reminders",
            description: "Context-aware reminders that adapt to your energy levels and productive hours.",
            color: "green"
          },
          {
            icon: Sparkles,
            title: "Voice Interaction",
            description: "Natural voice input with ElevenLabs TTS for a conversational AI coaching experience.",
            color: "blue"
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
              <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the plan that works best for your neurodivergent journey. All plans include our core AI coaching features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">$0</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Basic AI coaching</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Up to 50 tasks</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Mood tracking</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Brain dump (10/day)</span>
            </li>
          </ul>
          <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors">
            Get Started Free
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-indigo-600 text-white rounded-2xl p-8 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Pro</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold">$12</span>
            <span className="text-indigo-200">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-400" />
              <span>Advanced AI coaching with history</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-400" />
              <span>Unlimited tasks & subtasks</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-400" />
              <span>Advanced mood insights</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-400" />
              <span>Unlimited brain dumps</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-400" />
              <span>Voice interaction</span>
            </li>
          </ul>
          <button className="w-full bg-white text-indigo-600 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
            Start Pro Trial
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Team</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">$25</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Everything in Pro</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Team collaboration</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Priority support</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Custom workflows</span>
            </li>
          </ul>
          <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelp = () => (
    <div className="space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Help Center</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get the most out of MindMesh with our comprehensive guides and tutorials.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            title: "Getting Started",
            description: "Learn the basics of MindMesh and set up your account",
            articles: ["Creating your first task", "Setting up mood tracking", "Understanding AI coaching"]
          },
          {
            title: "AI Coaching",
            description: "Make the most of your AI coach and voice interactions",
            articles: ["How to talk to your AI coach", "Understanding AI responses", "Voice input tips"]
          },
          {
            title: "Task Management",
            description: "Master advanced task management features",
            articles: ["Creating subtasks", "Setting up recurring tasks", "Using tags effectively"]
          },
          {
            title: "Mood Tracking",
            description: "Track and understand your mood patterns",
            articles: ["Daily mood logging", "Reading mood trends", "Mood-productivity insights"]
          },
          {
            title: "Brain Dump",
            description: "Capture and organize your thoughts",
            articles: ["Using voice brain dumps", "AI categorization", "Processing thoughts"]
          },
          {
            title: "Troubleshooting",
            description: "Common issues and how to resolve them",
            articles: ["Voice input not working", "AI not responding", "Performance problems"]
          }
        ].map((section, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{section.description}</p>
            <ul className="space-y-2">
              {section.articles.map((article, articleIndex) => (
                <li key={articleIndex}>
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center space-x-1">
                    <span>{article}</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Still Need Help?</h2>
        <p className="text-indigo-700 mb-6">
          Our support team is here to help you succeed with MindMesh.
        </p>
        <div className="flex justify-center space-x-4">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
            Contact Support
          </button>
          <button className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors">
            Join Community
          </button>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-gray-600">support@mindmesh.ai</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Support Hours</p>
                <p className="text-gray-600">Monday - Friday, 9 AM - 6 PM PST</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-indigo-600">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-12 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-lg text-gray-600">
          Last updated: January 2025
        </p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Privacy</h2>
          <p className="text-gray-600 mb-4">
            At MindMesh, we understand that privacy is especially important for neurodivergent individuals. 
            We are committed to protecting your personal information and being transparent about how we collect, 
            use, and share your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
              <p className="text-gray-600">
                When you create an account, we collect your email address and any optional profile information you provide.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Data</h3>
              <p className="text-gray-600">
                We collect information about how you use MindMesh, including tasks created, mood entries, 
                and interactions with our AI coach to provide personalized experiences.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Data</h3>
              <p className="text-gray-600">
                When you use voice features, we process your speech to provide AI coaching responses. 
                Voice data is processed securely and not stored permanently.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Provide personalized AI coaching and task management features</li>
            <li>Analyze patterns to offer insights about your productivity and mood</li>
            <li>Improve our services and develop new features</li>
            <li>Send important updates about your account and our services</li>
            <li>Ensure the security and integrity of our platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
          <p className="text-gray-600 mb-4">
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>End-to-end encryption for sensitive data</li>
            <li>Secure data centers with 24/7 monitoring</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal data on a need-to-know basis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
          <p className="text-gray-600 mb-4">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Access and download your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of non-essential communications</li>
            <li>Control how your data is used for personalization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
          <p className="text-gray-600 mb-4">
            MindMesh integrates with third-party services to enhance functionality:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Google Gemini AI:</strong> For AI coaching responses (data processed securely)</li>
            <li><strong>ElevenLabs:</strong> For text-to-speech functionality</li>
            <li><strong>Supabase:</strong> For secure data storage and authentication</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy or how we handle your data, 
            please contact us at <a href="mailto:privacy@mindmesh.ai" className="text-indigo-600 hover:text-indigo-700">privacy@mindmesh.ai</a>.
          </p>
        </section>
      </div>
    </div>
  );

  switch (page) {
    case 'features':
      return renderFeatures();
    case 'pricing':
      return renderPricing();
    case 'help':
      return renderHelp();
    case 'contact':
      return renderContact();
    case 'privacy':
      return renderPrivacy();
    default:
      return <div>Page not found</div>;
  }
};