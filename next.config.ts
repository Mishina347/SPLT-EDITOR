const isProd = process.env.NODE_ENV === 'production';

const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js が「SSR（サーバーサイドレンダリング」ではなく「SSG（静的サイト生成）」を使用していること。
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: 'export',
  // 注: この機能は、SSG モードで Next.js イメージ・コンポーネントを使用するために必要です。
  // 別の回避方法については https://nextjs.org/docs/messages/export-image-api を参照してください。
  images: {
    unoptimized: true,
  },
  // assetPrefix を設定してください。さもないとサーバーはアセットを適切に解決できません。
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

export default nextConfig;