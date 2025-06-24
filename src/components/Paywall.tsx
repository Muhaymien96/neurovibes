import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Brain, 
  Heart,
  Star,
  RefreshCw
} from 'lucide-react';
import { useSubscriptionStore } from '../store/subscription';
import { SubscriptionPackage } from '../lib/revenuecat';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, feature }) => {
  const {
    offerings,
    loading,
    error,
    fetchOfferings,
    makePurchase,
    restorePurchases,
    devModeEnabled
  } = useSubscriptionStore();

  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isOpen && offerings.length === 0) {
      fetchOfferings();
    }
  }, [isOpen, offerings.length, fetchOfferings]);

  useEffect(() => {
    // Auto-select annual package if available
    if (offerings.length > 0 && !selectedPackage) {
      const defaultOffering = offerings[0];
      const annualPackage = defaultOffering.packages.find(pkg => 
        pkg.packageType === 'ANNUAL'
      );
      const monthlyPackage = defaultOffering.packages.find(pkg => 
        pkg.packageType === 'MONTHLY'
      );
      
      setSelectedPackage(annualPackage || monthlyPackage || defaultOffering.packages[0]);
    }
  }, [offerings, selectedPackage]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    try {
      const success = await makePurchase(selectedPackage);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      onClose();
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const getFeatureMessage = () => {
    if (!feature) return "Unlock the full power of MindMesh";
    
    const featureMessages: { [key: string]: string } = {
      'voice_interaction': 'Voice interaction requires MindMesh Pro',
      'advanced_ai': 'Advanced AI coaching requires MindMesh Pro',
      'unlimited_tasks': 'Unlimited tasks require MindMesh Pro',
      'mood_insights': 'Advanced mood insights require MindMesh Pro',
      'brain_dump_unlimited': 'Unlimited brain dumps require MindMesh Pro',
      'focus_buddy': 'Focus Buddy features require MindMesh Pro',
    };
    
    return featureMessages[feature] || "This feature requires MindMesh Pro";
  };

  const getSavingsPercentage = (monthlyPrice: number, annualPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = ((monthlyCost - annualPrice) / monthlyCost) * 100;
    return Math.round(savings);
  };

  if (!isOpen) return null;

  const proFeatures = [
    { icon: Brain, text: "Advanced AI coaching with memory" },
    { icon: Sparkles, text: "Voice interaction with ElevenLabs TTS" },
    { icon: Zap, text: "Unlimited tasks and brain dumps" },
    { icon: Heart, text: "Advanced mood insights and trends" },
    { icon: Star, text: "Focus Buddy and real-time sessions" },
    { icon: Crown, text: "Priority support and early access" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Crown className="h-8 w-8 text-yellow-300" />
              <h2 className="text-3xl font-bold">MindMesh Pro</h2>
            </div>
            <p className="text-xl opacity-90 mb-2">{getFeatureMessage()}</p>
            <p className="opacity-75">
              Unlock advanced features designed specifically for neurodivergent minds
            </p>
            
            {devModeEnabled && (
              <div className="mt-4 bg-yellow-500/20 border border-yellow-300 rounded-lg p-3">
                <p className="text-yellow-100 text-sm font-medium">
                  🚧 Dev Mode Active - Purchases are simulated
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Features */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">What you'll get:</h3>
              <div className="space-y-4">
                {proFeatures.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <IconComponent className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Choose your plan:</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading plans...</p>
                </div>
              ) : offerings.length > 0 ? (
                <div className="space-y-4">
                  {offerings[0].packages.map((pkg) => {
                    const isSelected = selectedPackage?.identifier === pkg.identifier;
                    const isAnnual = pkg.packageType === 'ANNUAL';
                    const monthlyPackage = offerings[0].packages.find(p => p.packageType === 'MONTHLY');
                    
                    let savingsText = '';
                    if (isAnnual && monthlyPackage) {
                      const savings = getSavingsPercentage(
                        parseFloat(monthlyPackage.product.price),
                        parseFloat(pkg.product.price)
                      );
                      savingsText = `Save ${savings}%`;
                    }

                    return (
                      <div
                        key={pkg.identifier}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isAnnual && (
                          <div className="absolute -top-2 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Most Popular
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {pkg.packageType === 'MONTHLY' ? 'Monthly' : 'Annual'}
                            </h4>
                            <p className="text-sm text-gray-600">{pkg.product.description}</p>
                            {savingsText && (
                              <p className="text-sm text-green-600 font-medium">{savingsText}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {pkg.product.priceString}
                            </div>
                            <div className="text-sm text-gray-600">
                              {pkg.packageType === 'MONTHLY' ? 'per month' : 'per year'}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Unable to load subscription plans</p>
                  <button
                    onClick={fetchOfferings}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Purchase Button */}
              {selectedPackage && (
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      `Start Pro - ${selectedPackage.product.priceString}`
                    )}
                  </button>
                  
                  <button
                    onClick={handleRestore}
                    className="w-full text-indigo-600 hover:text-indigo-700 py-2 font-medium"
                  >
                    Restore Purchases
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              Cancel anytime. No commitments. Your subscription will be charged to your account and will automatically renew unless cancelled at least 24 hours before the end of the current period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};