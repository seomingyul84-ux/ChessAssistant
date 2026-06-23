export const metadata = {
  title: 'ChessAssistant',
  description: 'AI Chess Analysis and Training Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}

