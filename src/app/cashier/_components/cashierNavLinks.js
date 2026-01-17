import {
  RiLayoutGridLine, // Dashboard (Tables)
  RiFileListLine, // Reports
} from "react-icons/ri";

export const CASHIER_LINKS = [
  {
    name: "Dashboard",
    path: "/cashier/dashboard",
    icon: RiLayoutGridLine,
  },
  {
      name: "Analytics",
      path: "/cashier/analytics",
      icon: RiLayoutGridLine, // Reusing icon or better one if imported
  },
  {
    name: "Reports",
    path: "/cashier/reports",
    icon: RiFileListLine,
  },
];
