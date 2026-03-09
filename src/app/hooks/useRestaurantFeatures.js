import { useRestaurantData } from "./useRestaurantData";
import { useCallback } from "react";

export const useRestaurantFeatures = () => {
  const { features, loading } = useRestaurantData();
  const isEnabled = useCallback(
    (feature) => {
      return !!features[feature];
    },
    [features],
  );

  return {
    features,
    loading,
    isEnabled,
  };
};
