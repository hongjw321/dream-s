// Cloudflare Worker 배포 후 아래 주소를 본인의 workers.dev 주소로 변경하세요.
const DREAM_API_URL = "https://dream-s-api.hongjw321.workers.dev/";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#dream-form");
  const result = document.querySelector("#dream-result");
  if (!form || !result) return;

  const button = form.querySelector(".submit-btn");
  const showError = (message) => {
    result.hidden = false;
    result.innerHTML = '<div class="result-error"></div>';
    result.querySelector(".result-error").textContent = message;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") || ""),
      dream: String(data.get("dream") || "").trim(),
      emotion: String(data.get("emotion") || "기억나지 않음"),
      when: String(data.get("when") || "미상")
    };
    if (payload.dream.length < 10) {
      showError("꿈의 내용을 10자 이상 자세히 적어주세요.");
      return;
    }
    if (!DREAM_API_URL || DREAM_API_URL.includes("YOUR-WORKER")) {
      showError("AI 분석 서버 연결이 아직 완료되지 않았어요. GitHub의 assets/app.js에 Cloudflare Worker 주소를 설정한 뒤 이용할 수 있습니다.");
      return;
    }

    button.disabled = true;
    button.innerHTML = '꿈속 이야기를 읽고 있어요 <span class="loading-orb">✧</span>';
    result.hidden = false;
    result.innerHTML = '<div class="loading-state"><div class="loading-moon">☾</div><h3>당신의 꿈을 읽고 있어요.</h3><p>꿈의 상징과 감정의 흐름을 살펴보는 중입니다.<br>잠시만 기다려 주세요.</p></div>';
    result.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const response = await fetch(DREAM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "분석 요청에 실패했습니다.");
      if (!data.report) throw new Error("분석 결과를 확인할 수 없습니다.");
      renderReport(result, data.report);
    } catch (error) {
      showError(error.message || "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      button.disabled = false;
      button.innerHTML = '내 꿈 분석 시작하기 <span>↗</span>';
    }
  });
});

function renderReport(container, report) {
  const sections = [
    ["01", "🌙 꿈의 요약과 분위기", report.summary],
    ["02", "🧠 심리학적 분석", report.psychology],
    ["03", "🌾 전통적 길흉화복", report.tradition],
    ["04", "🎬 심리 시나리오", report.screenplay],
  ];
  container.innerHTML = "";
  const heading = document.createElement("div");
  heading.className = "result-heading";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "DREAM-S / YOUR PERSONAL DREAM REPORT";
  const title = document.createElement("h2");
  title.textContent = "몽환의 신비로운 꿈 분석 리포트";
  heading.append(eyebrow, title);
  container.append(heading);

  sections.forEach(([number, label, content]) => {
    const article = document.createElement("article");
    article.className = "result-section";
    const h3 = document.createElement("h3");
    h3.textContent = label;
    const p = document.createElement("p");
    p.textContent = content;
    article.append(h3, p);
    container.append(article);
  });
  const disclaimer = document.createElement("p");
  disclaimer.className = "result-disclaimer";
  disclaimer.textContent = "꿈 해석은 자기이해와 문화적 상징을 위한 참고 콘텐츠이며, 미래를 예측하거나 심리 상태를 진단하지 않습니다.";
  container.append(disclaimer);
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}
