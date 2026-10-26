import type { NextConfig } from 'next';
import { existsSync,readFileSync } from 'node:fs';
const saved=existsSync('.build-dir')?readFileSync('.build-dir','utf8').trim():'.cambium-dev';
const distDir=process.env.VERCEL?'.next':process.env.CAMBIUM_BUILD_DIR || (process.env.NODE_ENV==='development'?'.cambium-dev':saved);
if(distDir!=='.next'&&!/^\.cambium-(build\/[a-zA-Z0-9-]+|dev)$/.test(distDir))throw new Error('Invalid local build directory');
const config:NextConfig={distDir,env:{NEXT_PUBLIC_CAMBIUM_VERSION:process.env.VERCEL_GIT_COMMIT_SHA||distDir},serverExternalPackages:['pdf-parse','mammoth'],experimental:{cpus:1,staticGenerationMaxConcurrency:1},poweredByHeader:false,devIndicators:false};
export default config;

