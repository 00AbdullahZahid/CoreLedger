import './globals.css';

export const metadata = {
  title: 'CFT Budget',
  description: 'Personal budget tracker for CoreFusion Technologies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
