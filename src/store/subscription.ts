import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  revenueCatService, 
  SubscriptionOffering, 
  SubscriptionPackage, 
  UserSubscription 
} from '../lib/revenuecat';

interface SubscriptionState {
  // Subscription status
  subscription: UserSubscription | null;
  offerings: SubscriptionOffering[];
  loading: boolean;
  error: string | null;
  
  // Dev mode
  devModeEnabled: boolean;
  
  // Actions
  initializeRevenueCat: (userId: string) => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  makePurchase: (packageToPurchase: SubscriptionPackage) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  setDevMode: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  isSubscribed: () => boolean;
  hasEntitlement: (entitlementId: string) => boolean;
  getActiveProductId: () => string | null;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      offerings: [],
      loading: false,
      error: null,
      devModeEnabled: false,

      initializeRevenueCat: async (userId: string) => {
        try {
          set({ loading: true, error: null });
          
          await revenueCatService.initialize();
          await revenueCatService.setUserId(userId);
          
          // Check subscription status after initialization
          await get().checkSubscriptionStatus();
          
          set({ loading: false });
        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize subscription service',
            loading: false 
          });
        }
      },

      checkSubscriptionStatus: async () => {
        const { devModeEnabled } = get();
        
        // If dev mode is enabled, simulate a subscribed state
        if (devModeEnabled) {
          set({
            subscription: {
              isActive: true,
              productIdentifier: 'dev_mode_pro',
              purchaseDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
              willRenew: true,
              entitlements: {
                'pro': {
                  identifier: 'pro',
                  productIdentifier: 'dev_mode_pro',
                  isActive: true,
                  willRenew: true,
                  originalPurchaseDate: new Date().toISOString(),
                  latestPurchaseDate: new Date().toISOString(),
                  expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  store: 'app_store',
                  isSandbox: true,
                  unsubscribeDetectedAt: null,
                  billingIssueDetectedAt: null,
                } as any
              }
            }
          });
          return;
        }

        try {
          set({ loading: true, error: null });
          const subscription = await revenueCatService.getCustomerInfo();
          set({ subscription, loading: false });
        } catch (error) {
          console.error('Failed to check subscription status:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to check subscription status',
            loading: false 
          });
        }
      },

      fetchOfferings: async () => {
        const { devModeEnabled } = get();
        
        // If dev mode is enabled, return mock offerings
        if (devModeEnabled) {
          set({
            offerings: [
              {
                identifier: 'default',
                serverDescription: 'Default offering',
                packages: [
                  {
                    identifier: 'monthly',
                    packageType: 'MONTHLY',
                    product: {
                      identifier: 'mindmesh_pro_monthly',
                      description: 'MindMesh Pro Monthly Subscription',
                      title: 'MindMesh Pro (Monthly)',
                      price: '12.99',
                      priceString: '$12.99',
                      currencyCode: 'USD',
                    },
                    offeringIdentifier: 'default',
                  },
                  {
                    identifier: 'annual',
                    packageType: 'ANNUAL',
                    product: {
                      identifier: 'mindmesh_pro_annual',
                      description: 'MindMesh Pro Annual Subscription',
                      title: 'MindMesh Pro (Annual)',
                      price: '99.99',
                      priceString: '$99.99',
                      currencyCode: 'USD',
                    },
                    offeringIdentifier: 'default',
                  },
                ],
              },
            ]
          });
          return;
        }

        try {
          set({ loading: true, error: null });
          const offerings = await revenueCatService.getOfferings();
          set({ offerings, loading: false });
        } catch (error) {
          console.error('Failed to fetch offerings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch subscription plans',
            loading: false 
          });
        }
      },

      makePurchase: async (packageToPurchase: SubscriptionPackage) => {
        const { devModeEnabled } = get();
        
        // If dev mode is enabled, simulate a successful purchase
        if (devModeEnabled) {
          set({
            subscription: {
              isActive: true,
              productIdentifier: packageToPurchase.product.identifier,
              purchaseDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              willRenew: true,
              entitlements: {
                'pro': {
                  identifier: 'pro',
                  productIdentifier: packageToPurchase.product.identifier,
                  isActive: true,
                  willRenew: true,
                  originalPurchaseDate: new Date().toISOString(),
                  latestPurchaseDate: new Date().toISOString(),
                  expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  store: 'app_store',
                  isSandbox: true,
                  unsubscribeDetectedAt: null,
                  billingIssueDetectedAt: null,
                } as any
              }
            }
          });
          return true;
        }

        try {
          set({ loading: true, error: null });
          const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
          
          // Update subscription status
          await get().checkSubscriptionStatus();
          
          set({ loading: false });
          return true;
        } catch (error) {
          console.error('Failed to make purchase:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to complete purchase',
            loading: false 
          });
          return false;
        }
      },

      restorePurchases: async () => {
        const { devModeEnabled } = get();
        
        if (devModeEnabled) {
          // In dev mode, just check current status
          await get().checkSubscriptionStatus();
          return;
        }

        try {
          set({ loading: true, error: null });
          await revenueCatService.restorePurchases();
          
          // Update subscription status
          await get().checkSubscriptionStatus();
          
          set({ loading: false });
        } catch (error) {
          console.error('Failed to restore purchases:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to restore purchases',
            loading: false 
          });
        }
      },

      setDevMode: (enabled: boolean) => {
        set({ devModeEnabled: enabled });
        
        // If enabling dev mode, immediately update subscription status
        if (enabled) {
          get().checkSubscriptionStatus();
        } else {
          // If disabling dev mode, clear subscription and check real status
          set({ subscription: null });
          get().checkSubscriptionStatus();
        }
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Computed getters
      isSubscribed: () => {
        const { subscription, devModeEnabled } = get();
        
        if (devModeEnabled) {
          return true;
        }
        
        return subscription?.isActive || false;
      },

      hasEntitlement: (entitlementId: string) => {
        const { subscription, devModeEnabled } = get();
        
        if (devModeEnabled) {
          return true;
        }
        
        return subscription?.entitlements[entitlementId]?.isActive || false;
      },

      getActiveProductId: () => {
        const { subscription } = get();
        return subscription?.productIdentifier || null;
      },
    }),
    {
      name: 'mindmesh-subscription',
      partialize: (state) => ({
        devModeEnabled: state.devModeEnabled,
      }),
    }
  )
);