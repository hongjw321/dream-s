const ALLOWED_ORIGIN = "https://hongjw321.github.io";
const MODEL = "gemini-3.1-flash-lite";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (origin !== ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "POST 요청만 허용됩니다." }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: "서버에 AI API 키가 설정되지 않았습니다." }, 503);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }

    const dream = typeof body.dream === "string" ? body.dream.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 60) : "";
    const emotion = typeof body.emotion === "string" ? body.emotion.slice(0, 40) : "기억나지 않음";
    const when = typeof body.when === "string" ? body.when.slice(0, 40) : "미상";

    if (dream.length < 10) return json({ error: "꿈 내용을 10자 이상 입력해 주세요." }, 400);
    if (dream.length > 5000) return json({ error: "꿈 내용은 5,000자 이내로 입력해 주세요." }, 413);

    const prompt = `너는 AI 꿈 분석가 '몽환(Dream-S)'이다. 다정하고 신비로우면서도 과장하지 않는 전문적인 한국어로 답한다.
사용자의 꿈을 칼 융의 분석심리학에서 영감을 얻은 상징적 관점과 동양 전통 꿈해몽의 문화적 상징 관점으로 함께 살펴본다.
중요 원칙:
- 꿈은 미래를 확정하거나 실제 사건을 예언하는 근거가 아니다. 길흉 해석은 민속적·문화적 관점임을 분명히 한다.
- 사용자의 실제 정신질환, 성격, 억압된 욕망을 진단하거나 단정하지 않는다. 가능한 해석으로 표현한다.
- 꿈속 인물이나 상징에 고정된 보편적 의미가 있다고 주장하지 않는다. 사용자의 감정과 맥락을 우선한다.
- 불길한 징조를 단정하거나 공포·불안을 조장하지 않는다.
- 심리 시나리오는 창작물로 표시한다.
- 이미지 프롬프트는 영어로, 핵심 장면과 조명·색감·구도·매체 스타일을 구체적으로 작성한다. 이미지 안에 글자나 워터마크는 넣지 않는다.

입력 정보:
꿈 제목: ${title || "미지정"}
꿈 내용: ${dream}
꿈에서 느낀 감정: ${emotion}
꿈을 꾼 시기: ${when}

다음 5개 항목을 빠짐없이 작성한다.
1. 🌙 꿈의 요약과 분위기: 핵심 내용과 지배적인 감정을 한두 문장으로 요약.
2. 🧠 심리학적 분석 (칼 융의 무의식 관점): 상징, 감정, 현재 삶의 고민과 연결할 수 있는 가능성을 3~5문장으로 설명. 진단 금지.
3. 🌾 전통적 길흉화복 (동양적 해몽): 전통 민속 해몽에서의 상징적 풀이와 현실에서 참고할 태도. 예언이 아님을 짧게 표시.
4. 🎬 심리 시나리오: 영화 예고편 스타일의 로그라인과 짧은 스토리. 사용자가 주인공.
5. 🎨 AI 이미지 생성을 위한 프롬프트: 영어 이미지 생성 프롬프트 1개.

결과는 지정된 JSON 구조로만 출력한다.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    let upstream;
    try {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 2200,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                psychology: { type: "STRING" },
                tradition: { type: "STRING" },
                screenplay: { type: "STRING" },
                imagePrompt: { type: "STRING" }
              },
              required: ["summary", "psychology", "tradition", "screenplay", "imagePrompt"]
            }
          }
        })
      });
    } catch {
      return json({ error: "AI 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 502);
    }

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = upstream.status === 429
        ? "현재 무료 AI 사용량이 많습니다. 잠시 후 다시 시도해 주세요."
        : upstream.status === 400 || upstream.status === 404
          ? "AI 모델 요청을 처리하지 못했습니다. 관리자 설정을 확인해 주세요."
          : "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      return json({ error: message }, upstream.status === 429 ? 429 : 502);
    }

    const text = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!text) return json({ error: "분석 결과를 받지 못했습니다. 꿈 내용을 조금 바꿔 다시 시도해 주세요." }, 502);
    try {
      const report = JSON.parse(text);
      const keys = ["summary", "psychology", "tradition", "screenplay", "imagePrompt"];
      if (!keys.every(key => typeof report[key] === "string" && report[key].length > 0)) throw new Error("invalid schema");
      return json({ report });
    } catch {
      return json({ error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." }, 502);
    }
  }
};
