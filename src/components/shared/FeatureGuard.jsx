import { useRestaurantFeatures } from "@/app/hooks/useRestaurantFeatures";

/**
 * FeatureGuard Component
 * 
 * Conditionally renders children based on enabled restaurant features.
 * 
 * Props:
 * - feature: string (key from features object, e.g., 'kitchen', 'waiter')
 * - fallback: ReactNode (optional content to show if feature is disabled)
 * - children: ReactNode
 */
const FeatureGuard = ({ feature, fallback = null, children }) => {
    const { isEnabled, loading } = useRestaurantFeatures();

    // While loading, we can deciding to show nothing, or a loading state. 
    // For now, avoiding layout shift might be best, but let's just return nothing or children depending on strategy.
    // If it's critical logic, maybe wait. If it's just UI, maybe hide.
    if (loading) return null; 

    if (isEnabled(feature)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default FeatureGuard;
