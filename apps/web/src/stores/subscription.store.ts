/**
 * Abonelik durumu — premium plan takibi.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PremiumFeature, isFeatureEnabled } from "~/lib/features";

interface SubscriptionState {
  plan: "free" | "plus" | "family" | null;
  status: "active" | "cancelled" | "past_due" | "trialing" | null;
  currentPeriodEnd: number | null;
  isFeatureEnabled: (feature: PremiumFeature) => boolean;
  _set: (updates: Partial<Omit<SubscriptionState, "isFeatureEnabled" | "_set">>) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: null,
      status: null,
      currentPeriodEnd: null,

      isFeatureEnabled: (feature: PremiumFeature) => {
        const { plan, status } = get();
        const isPremium = (plan === "plus" || plan === "family") && status === "active";
        return isFeatureEnabled(feature, isPremium);
      },

      _set: (updates) => set(updates),
    }),
    {
      name: "mahfuz-subscription",
      partialize: (s) => ({
        plan: s.plan,
        status: s.status,
        currentPeriodEnd: s.currentPeriodEnd,
      }),
    }
  )
);
