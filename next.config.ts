import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: '/Users/casa/Documents/gestion-socios-web',  // Verifica que esta ruta sea correcta
  },
};

export default nextConfig;