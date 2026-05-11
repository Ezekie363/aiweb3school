import { defineNavbarConfig } from 'vuepress-theme-plume';

export const zhNavbar = defineNavbarConfig([
  { text: '开始学习', link: '/zh/' },
  { text: 'AI 基础', link: '/zh/handbook/ai/llm/' },
  { text: 'Web3 基础', link: '/zh/handbook/web3/network/' },
  { text: 'AI × Web3 Bridge', link: '/zh/handbook/bridge/chain-aware-context/' },
  { text: '前沿探索', link: '/zh/handbook/tracks/agentic-commerce/' },
]);

export const enNavbar = defineNavbarConfig([
  { text: 'Start Learning', link: '/en/' },
  { text: 'AI Foundations', link: '/en/ai-fundamentals/' },
  { text: 'Web3 Foundations', link: '/en/blockchain-basics/' },
  { text: 'AI × Web3', link: '/en/ai-agents/' },
]);
