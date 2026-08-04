import './global.css';

export const metadata = {
  title: 'SGP Macrocoop',
  description: 'Sistema de Gestão de Cooperados',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
