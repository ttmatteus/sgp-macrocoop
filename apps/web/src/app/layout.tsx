import './global.css';

export const metadata = {
  title: 'GDC Macrocoop',
  description: 'Sistema de Gestão de Cooperados',
};

// aplicado antes do React hidratar pra nao piscar o tema errado no reload.
// repetido sem SSR pra nao depender do client component montar primeiro.
const SCRIPT_TEMA = `(() => {
  try {
    const prefs = ['auto', 'claro', 'escuro'];
    const salvo = window.localStorage.getItem('sgp:tema');
    const pref = prefs.includes(salvo) ? salvo : 'auto';
    const hora = new Date().getHours();
    const noturno = pref === 'escuro' || (pref === 'auto' && (hora >= 18 || hora < 6));
    document.documentElement.classList.toggle('dark', noturno);
  } catch {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
