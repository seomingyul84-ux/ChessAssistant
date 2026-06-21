import "./globals.css"; // 만약 빌드 에러가 나면 이 줄을 지우거나 프로젝트에 globals.css를 추가해줘.

export const metadata = {
  title: "ChessNote - 수제 엔진 자가대국",
  description: "초경량 스톡피시 17 기반 강화 루프 시뮬레이터",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
