import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
  title: 'Visify — 3D Product Configurator',
  description: 'Give your store a 3D product configurator in minutes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0E0E1A',
              color: '#E4E4F0',
              border: '1px solid #22223A',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
