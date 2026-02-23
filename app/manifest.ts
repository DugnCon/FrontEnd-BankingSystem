// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Horizon Banking',
    short_name: 'Horizon',
    description: 'Hệ thống ngân hàng trực tuyến an toàn, tiện lợi - Kết nối Plaid, chuyển tiền Dwolla, theo dõi giao dịch realtime',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0066cc',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Icon riêng cho maskable (tạo từ tool maskable.app nếu cần adaptive icon Android)
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    // screenshots tạm bỏ để tránh lỗi type (optional, không bắt buộc cho PWA cơ bản)
    // Nếu Next.js update type sau này, bạn add lại
  };
}