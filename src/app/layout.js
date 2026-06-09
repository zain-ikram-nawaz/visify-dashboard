import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
  title: 'Visify — 3D Product Configurator',
  description: 'Give your store a 3D product configurator in minutes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}