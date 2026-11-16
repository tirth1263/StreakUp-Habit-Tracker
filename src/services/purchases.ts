/**
 * StreakUp Pro on phones, through RevenueCat.
 *
 * To take real payments:
 *  1. Create the one-time product in App Store Connect / Google Play Console.
 *  2. In RevenueCat, attach it to an entitlement called "pro" and add it to
 *     your current offering.
 *  3. Put your public SDK keys in a .env file (see .env.example).
 *
 * Until keys are set the app runs in DEMO MODE: "Unlock Pro" works without
 * charging anything, so you can test every Pro feature in Expo Go.
 */
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const ENTITLEMENT = 'pro';

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

export const isDemoStore = !apiKey;

let configured = false;
function ensureConfigured() {
  if (!configured && apiKey) {
    Purchases.configure({ apiKey });
    configured = true;
  }
}

/** Ask the store whether this user owns Pro. null = no store (demo mode). */
export async function fetchProStatus(): Promise<boolean | null> {
  if (isDemoStore) return null;
  ensureConfigured();
  const info = await Purchases.getCustomerInfo();
  return ENTITLEMENT in info.entitlements.active;
}

/** The price to show on the button, e.g. "$3.99". */
export async function getProPrice(): Promise<string | null> {
  if (isDemoStore) return null;
  ensureConfigured();
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages[0]?.product.priceString ?? null;
}

/** Returns true if Pro is now unlocked, false if the user backed out. */
export async function purchasePro(): Promise<boolean> {
  if (isDemoStore) return true;
  ensureConfigured();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) throw new Error('StreakUp Pro is not available in the store yet.');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return ENTITLEMENT in customerInfo.entitlements.active;
  } catch (e: any) {
    if (e?.userCancelled) return false;
    throw e;
  }
}

export async function restorePro(): Promise<boolean> {
  if (isDemoStore) return false;
  ensureConfigured();
  const info = await Purchases.restorePurchases();
  return ENTITLEMENT in info.entitlements.active;
}
