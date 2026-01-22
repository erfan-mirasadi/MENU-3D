import { useRestaurantData } from "./useRestaurantData";
import { useMemo, useCallback } from "react";

export const useRestaurantFeatures = () => {
    const { restaurant, loading } = useRestaurantData();

    // Memoize the features object so it only updates when restaurant.features changes
    const featureState = useMemo(() => {
        // Default configuration (Safe Fallback)
        const defaults = {
            menu: true,
            waiter: true,
            cashier: true,
            kitchen: true,
            ordering_enabled: true
        };

        if (loading) {
            return {
                features: defaults,
                loading: true
            };
        }
        
        // Safety: If not loading, but no restaurant (e.g. error or not found),
        // return defaults and loading: false to prevent infinite loops.
        if (!restaurant) {
            return {
                features: defaults,
                loading: false
            };
        }

        // Merge defaults with actual features
        const features = { ...defaults, ...(restaurant.features || {}) };
        console.log("Features:", features);
        
        return {
            features,
            loading: false
        };
    }, [restaurant?.features, loading]); 

    // Stable helper function
    const isEnabled = useCallback((feature) => {
        return !!featureState.features[feature];
    }, [featureState.features]);

    return {
        features: featureState.features,
        loading: featureState.loading,
        isEnabled
    };
};
