/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow transpiling the shared workspace package.
  transpilePackages: ['@ai-gen/shared'],
  experimental: {
    typedRoutes: true,
  },
  // The shared package ships TypeScript sources with ESM-style `.js` import
  // specifiers (the standard NodeNext/Bundler idiom). Webpack needs to be
  // told to resolve those `.js` paths to `.ts`/`.tsx` at build time.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
