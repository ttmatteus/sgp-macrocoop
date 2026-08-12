import './global.css';

export const metadata = {
  title: 'GDC Macrocoop',
  description: 'Sistema de Gestão de Cooperativas',
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

// o safari do ios trava o valor de "dvh" depois que a barra de endereco
// esconde/aparece (bug conhecido), e como usamos overflow-hidden junto,
// o conteudo que nao cabe nesse valor errado fica cortado. --app-height
// recalcula via JS (visualViewport quando disponivel, senao innerHeight)
// toda vez que o viewport muda de verdade
const SCRIPT_ALTURA = `(() => {
  try {
    const definir = () => {
      const altura = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', altura + 'px');
    };
    definir();
    window.addEventListener('resize', definir);
    window.addEventListener('orientationchange', definir);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', definir);
    }
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
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ALTURA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
