import dynamic from "next/dynamic";

const ClassicLayout = dynamic(
  () => import("@/components/templates/classic/ClassicLayout"),
);
const ImmersiveLayout = dynamic(
  () => import("@/components/templates/immersive/ImmersiveLayout"),
);
const MinimalLayout = dynamic(
  () => import("@/components/templates/minimal/MinimalLayout"),
);
const ModernLayout = dynamic(
  () => import("@/components/templates/modern/ModernLayout"),
);
const ThreeDLayout = dynamic(
  () => import("@/components/templates/three-d/ThreeDLayout"),
);

export default function ClientWrapper({
  restaurant,
  categories,
  tableId,
  featuredProducts,
  isGuestMode,
}) {
  const style = restaurant.template_style;
  const sharedProps = {
    restaurant,
    categories,
    tableId,
    featuredProducts,
    isGuestMode,
  };

  switch (style) {
    case "modern":
      return <ModernLayout {...sharedProps} />;
    case "classic":
      return <ClassicLayout {...sharedProps} />;
    case "minimal":
      return <MinimalLayout {...sharedProps} />;
    case "immersive":
      return <ImmersiveLayout {...sharedProps} />;
    case "three-d":
      return <ThreeDLayout {...sharedProps} />;
    default:
      return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
          <p>⚠️ Template not found!</p>
        </div>
      );
  }
}
