import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // External packages for server components
    serverExternalPackages: ['pdfjs-dist'],

    // Webpack configuration for pdfjs-dist
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Ignore the worker file on the server side
            config.resolve.alias = {
                ...config.resolve.alias,
                'pdfjs-dist/legacy/build/pdf.worker.mjs': false,
            };
        }
        return config;
    },
    // Silence Turbopack vs Webpack warning
    turbopack: {},
};

export default nextConfig;