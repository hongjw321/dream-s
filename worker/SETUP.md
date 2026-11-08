# Dream-S AI 분석 API 설정

이 폴더는 GitHub Pages에 API 키를 노출하지 않고 Cloudflare Worker에서 Gemini API를 호출하기 위한 백엔드입니다.

## 1. Gemini API 키 만들기
1. https://aistudio.google.com/apikey 에 접속해 Google 계정으로 로그인합니다.
2. API 키를 생성합니다.
3. 키를 GitHub 코드, HTML, JavaScript 또는 공개 문서에 붙여 넣지 마세요.

## 2. Cloudflare Worker 만들기
1. https://dash.cloudflare.com/ 에 로그인합니다.
2. Workers & Pages → Create → Worker로 이동해 `dream-s-api`라는 Worker를 만듭니다.
3. Quick Edit 또는 코드 편집 화면에서 `worker/src/index.js`의 내용을 붙여 넣고 Deploy합니다.
4. Worker → Settings → Variables and Secrets → Add → Secret을 선택합니다.
5. 변수 이름은 `GEMINI_API_KEY`, 값은 Google AI Studio에서 만든 키로 저장하고 Deploy합니다.
6. Worker의 `https://dream-s-api.<계정>.workers.dev` 주소를 복사합니다.

## 3. 홈페이지에 Worker 주소 연결
`assets/app.js` 맨 위의 `DREAM_API_URL` 값을 복사한 Worker 주소로 바꿉니다.
예: `const DREAM_API_URL = "https://dream-s-api.example.workers.dev";`
저장 후 GitHub에 커밋하면 Pages가 배포됩니다.

## 4. 무료 사용 관련 주의
- Gemini API는 모델별 무료 등급 및 요청 한도가 있으며 변경될 수 있습니다. 무료 한도 초과 시 429 오류가 발생할 수 있습니다.
- Gemini 무료 등급에서는 제출한 콘텐츠가 Google 제품 및 모델 개선에 사용될 수 있습니다. 실제 고객의 꿈 내용을 다루기 전에 이 점을 이용자에게 고지하고, 민감한 개인정보를 입력하지 않도록 안내하세요.
- Cloudflare Workers 무료 플랜은 일일 요청 한도가 있습니다. 무료 한도는 변경될 수 있으므로 배포 시 공식 요금표를 확인하세요.
- 공개 서비스 전에는 인증, IP/계정 단위 사용량 제한, 악용 방지, 개인정보 처리방침, 이용약관을 추가해야 합니다.

## 5. 현재 구현 범위
- Worker는 `POST / ` 요청을 받아 꿈 내용을 검증하고 Gemini 2.5 Flash-Lite에 분석을 요청합니다.
- CORS는 현재 GitHub Pages 도메인 `https://hongjw321.github.io`만 허용합니다.
- 이미지 생성은 아직 호출하지 않습니다. 5번 항목에서 이미지 생성용 영문 프롬프트만 제공합니다.
