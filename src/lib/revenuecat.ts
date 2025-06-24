import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesEntitlementInfo 
} from 'revenuecat-purchases';

// RevenueCat configuration
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;

export interface SubscriptionOffering {
  identifier: string;
  serverDescription: string;
  packages: SubscriptionPackage[];
}

export interface SubscriptionPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: string;
    priceString: string;
    currencyCode: string;
  };
  offeringIdentifier: string;
}

export interface UserSubscription {
  isActive: boolean;
  productIdentifier?: string;
  purchaseDate?: string;
  expirationDate?: string;
  willRenew?: boolean;
  entitlements: { [key: string]: PurchasesEntitlementInfo };
}

class RevenueCatService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized || !REVENUECAT_API_KEY) {
      return;
    }

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });
      
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<SubscriptionOffering[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      return Object.values(offerings.all).map((offering: PurchasesOffering) => ({
        identifier: offering.identifier,
        serverDescription: offering.serverDescription,
        packages: offering.availablePackages.map((pkg: PurchasesPackage) => ({
          identifier: pkg.identifier,
          packageType: pkg.packageType,
          product: {
            identifier: pkg.product.identifier,
            description: pkg.product.description,
            title: pkg.product.title,
            price: pkg.product.price.toString(),
            priceString: pkg.product.priceString,
            currencyCode: pkg.product.currencyCode,
          },
          offeringIdentifier: pkg.offeringIdentifier,
        })),
      }));
    } catch (error) {
      console.error('Failed to get RevenueCat offerings:', error);
      throw error;
    }
  }

  async purchasePackage(packageToPurchase: SubscriptionPackage): Promise<CustomerInfo> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Find the actual RevenueCat package
      const offerings = await Purchases.getOfferings();
      const offering = offerings.all[packageToPurchase.offeringIdentifier];
      
      if (!offering) {
        throw new Error('Offering not found');
      }

      const rcPackage = offering.availablePackages.find(
        pkg => pkg.identifier === packageToPurchase.identifier
      );

      if (!rcPackage) {
        throw new Error('Package not found');
      }

      const { customerInfo } = await Purchases.purchasePackage(rcPackage);
      return customerInfo;
    } catch (error) {
      console.error('Failed to purchase package:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<UserSubscription> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check for active entitlements
      const activeEntitlements = Object.values(customerInfo.entitlements.active);
      const isActive = activeEntitlements.length > 0;
      
      let productIdentifier: string | undefined;
      let purchaseDate: string | undefined;
      let expirationDate: string | undefined;
      let willRenew: boolean | undefined;

      if (isActive && activeEntitlements[0]) {
        const entitlement = activeEntitlements[0];
        productIdentifier = entitlement.productIdentifier;
        purchaseDate = entitlement.originalPurchaseDate;
        expirationDate = entitlement.expirationDate;
        willRenew = entitlement.willRenew;
      }

      return {
        isActive,
        productIdentifier,
        purchaseDate,
        expirationDate,
        willRenew,
        entitlements: customerInfo.entitlements.active,
      };
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
      throw error;
    }
  }
}

export const revenueCatService = new RevenueCatService();