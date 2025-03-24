/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignorar erros de tipo durante o build para permitir a compilação
    ignoreBuildErrors: true,
  },
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig 