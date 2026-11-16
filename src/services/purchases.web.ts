/**
 * Website stand-in for the store. App-store purchases only exist inside the
 * phone apps, so the web demo always runs in demo mode: "Unlock Pro" is free
 * and nothing is charged.
 */
export const isDemoStore = true;

export async function fetchProStatus(): Promise<boolean | null> {
  return null;
}

export async function getProPrice(): Promise<string | null> {
  return null;
}

export async function purchasePro(): Promise<boolean> {
  return true;
}

export async function restorePro(): Promise<boolean> {
  return false;
}
