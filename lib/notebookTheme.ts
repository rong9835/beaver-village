// 대문(app/page.tsx)에서 시작된 "손글씨 공책" 테마를 여러 페이지가 같이 쓰면서
// 값이 흩어지지 않도록 여기 한 곳에 모아둠.

// 줄노트 배경 무늬.
export const NOTEBOOK_LINES_STYLE = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0 37px, #dfe6ea 37px 38px)",
  backgroundPosition: "0 60px",
};

// 손글씨체(Gaegu)는 제목·버튼 같은 짧은 글자는 예쁘지만, 긴 문단을 읽을 땐
// 가독성이 떨어짐. 실제로 읽어야 하는 본문 텍스트에는 이 서체를 따로 적용함.
export const READABLE_BODY_STYLE = {
  fontFamily:
    '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
};
