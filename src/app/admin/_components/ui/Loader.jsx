import { RiLoader4Line } from "react-icons/ri";

export default function Loader({ size = "large", className = "" }) {
  const sizeClasses = {
    small: "text-xl",
    medium: "text-4xl",
    large: "text-6xl",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <RiLoader4Line
        className={`animate-spin text-primary ${
          sizeClasses[size] || sizeClasses.medium
        }`}
      />
    </div>
  );
}
