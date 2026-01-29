/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wnkjimwfvkcogmhplpvt.supabase.co",
        port: "",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "media.menu-3d.com",
      },
    ],
  },

  transpilePackages: [
    "three",
    "@react-three/drei",
    "@react-three/fiber",
    "three-stdlib",
  ],
};

export default nextConfig;
