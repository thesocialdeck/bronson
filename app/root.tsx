import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';
import './tailwind.css';
import { ToastContainer, useToast } from '~/components/shared/Toast';
import { InstallPrompt } from '~/components/pwa/InstallPrompt';
import { OfflineIndicator } from '~/components/pwa/OfflineIndicator';
import { usePWA } from '~/hooks/usePWA';

export const links: LinksFunction = () => [
  { rel: 'manifest', href: '/manifest.json' },
  { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
  { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' },
  { rel: 'apple-touch-icon', href: '/icon-192.png' },
];

export const meta: MetaFunction = () => {
  return [
    { title: 'Bronson - Family Scheduler for Busy Parents' },
    { name: 'description', content: 'The family scheduling app built for time-poor parents. Capture events instantly, spot conflicts, and never miss a birthday.' },
    { name: 'theme-color', content: '#9333ea' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Bronson' },
    { name: 'mobile-web-app-capable', content: 'yes' },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { toasts, dismiss } = useToast();
  usePWA(); // Register service worker

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <OfflineIndicator />
      <InstallPrompt />
      <Outlet />
    </>
  );
}
