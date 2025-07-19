const img = document.getElementById("image");
const btn = document.getElementById("submit");
const tips = document.getElementById("tips");
const out = document.getElementById("output");
const spinner = document.getElementById("spinner");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");
const notesPanel = document.getElementById("notes-panel");

img.onchange = () => {
  const file = img.files[0];
  if (file) {
    btn.classList.remove("hidden");
    tips.classList.remove("hidden");

    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    btn.classList.add("hidden");
    tips.classList.add("hidden");
    preview.classList.add("hidden");
    previewImg.src = "";
  }
};

btn.onclick = async () => await analyzeFace("analyze");
tips.onclick = async () => await analyzeFace("tips");

function getEmoji(score) {
  if (score >= 8) return "😍";
  if (score >= 6) return "😊";
  if (score >= 4) return "😐";
  return "😕";
}

async function analyzeFace(type) {
  const file = img.files[0];
  if (!file) return;

  out.classList.add("hidden");
  notesPanel.classList.add("hidden");
  spinner.classList.remove("hidden");

  // 🔽 Load guide.txt
  let guideText = "";
  try {
    const res = await fetch("/guide.txt");
    guideText = await res.text();
  } catch (e) {
    console.error("Could not load guide.txt:", e);
  }

  const form = new FormData();
  form.append("img", file);

  // 🔽 Prompt for AI
  const analyzePrompt = `
You are a brutally honest facial aesthetics evaluator. Your task is to strictly analyze only real human faces — no sugarcoating.

If the image is not a real human face, reply:
{ "error": "Image does not contain a recognizable human face." }

Celebrities, models, influencers — rate them like anyone else. Do not inflate scores based on recognition or fame.

If valid, return ONLY this JSON:
{
  "overall": number,
  "potential": number,
  "features": {
    "eyes": number,
    "nose": number,
    "lips": number,
    "skin": number,
    "jawline": number,
    "cheekbones": number,
    "hairline": number
  },
  "notes": "Blunt and professional critique. Mention every flaw in plain language."
}

🔍 Use the following scoring rules and rating guide:
${guideText}
`;

  const tipsPrompt = `
You are a strict beauty coach. Based only on the visual appearance in this image, return JSON:
{
  "current_score": number,
  "potential_score": number,
  "suggestions": ["harsh but helpful tip 1", "tip 2", "tip 3"]
}

Tips should focus only on visible, natural aspects: grooming, skin clarity, lighting, posture, hydration, etc. No surgery, apps, or filters. Be concise and blunt.
`;

  form.append("text", type === "analyze" ? analyzePrompt : tipsPrompt);

  try {
    const res = await fetch("/ask", { method: "POST", body: form });
    const data = await res.json();
    spinner.classList.add("hidden");

    if (!data.reply) {
      out.innerHTML = `<div class="text-red-500">AI gave no reply. Try again.</div>`;
      out.classList.remove("hidden");
      return;
    }

    let raw = data.reply.trim().replace(/^```json|^```|```$/g, "").trim();
    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      out.innerHTML = `<div class="text-red-500">Invalid AI response. Try again.</div>`;
      out.classList.remove("hidden");
      return;
    }

    if (result.error) {
      out.innerHTML = `<div class="text-red-500">${result.error}</div>`;
      out.classList.remove("hidden");
      return;
    }

    if (type === "analyze" && !result.features) {
      out.innerHTML = `<div class="text-red-500">Incomplete analysis. Try again.</div>`;
      out.classList.remove("hidden");
      return;
    }

    if (type === "analyze") {
      const featureHTML = Object.entries(result.features).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const color = value >= 8 ? 'green-400' : value >= 6 ? 'yellow-400' : 'red-400';
        return `
          <div class="bg-black/30 backdrop-blur-md p-4 rounded-2xl">
            <div class="text-sm uppercase text-gray-300">${label}</div>
            <div class="text-2xl font-medium text-white">${value.toFixed(1)} ${getEmoji(value)}</div>
            <div class="h-1.5 bg-white/20 rounded-full mt-2">
              <div class="h-full bg-${color} rounded-full" style="width:${value * 10}%"></div>
            </div>
          </div>`;
      }).join("");

      const overallColor = result.overall >= 8 ? 'green-400' : result.overall >= 6 ? 'yellow-400' : 'red-400';
      const potentialColor = result.potential >= 8 ? 'green-400' : result.potential >= 6 ? 'yellow-400' : 'red-400';

      out.innerHTML = `
        <div class="bg-black/30 backdrop-blur-md p-6 rounded-3xl w-full mb-4">
          <div class="text-sm uppercase text-gray-300">Overall</div>
          <div class="text-4xl font-semibold text-white">${result.overall.toFixed(1)} ${getEmoji(result.overall)}</div>
          <div class="h-2 bg-white/20 rounded-full mt-3">
            <div class="h-full bg-${overallColor} rounded-full" style="width:${result.overall * 10}%"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-2">
          <div class="bg-black/30 backdrop-blur-md p-4 rounded-2xl">
            <div class="text-sm uppercase text-gray-300">Potential</div>
            <div class="text-2xl font-medium text-white">${result.potential.toFixed(1)} ${getEmoji(result.potential)}</div>
            <div class="h-1.5 bg-white/20 rounded-full mt-2">
              <div class="h-full bg-${potentialColor} rounded-full" style="width:${result.potential * 10}%"></div>
            </div>
          </div>
          ${featureHTML}
        </div>`;

      notesPanel.innerHTML = `<div class="text-gray-300 text-base leading-relaxed">${result.notes}</div>`;
      notesPanel.classList.remove("hidden");

    } else {
      const currentColor = result.current_score >= 8 ? 'green-400' : result.current_score >= 6 ? 'yellow-400' : 'red-400';
      const potentialColor = result.potential_score >= 8 ? 'green-400' : result.potential_score >= 6 ? 'yellow-400' : 'red-400';

      out.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-black/30 backdrop-blur-md p-4 rounded-2xl">
            <div class="text-sm uppercase text-gray-300">Current Score</div>
            <div class="text-2xl font-medium text-white">${result.current_score.toFixed(1)} ${getEmoji(result.current_score)}</div>
            <div class="h-1.5 bg-white/20 rounded-full mt-2">
              <div class="h-full bg-${currentColor} rounded-full" style="width:${result.current_score * 10}%"></div>
            </div>
          </div>
          <div class="bg-black/30 backdrop-blur-md p-4 rounded-2xl">
            <div class="text-sm uppercase text-gray-300">Potential Score</div>
            <div class="text-2xl font-medium text-white">${result.potential_score.toFixed(1)} ${getEmoji(result.potential_score)}</div>
            <div class="h-1.5 bg-white/20 rounded-full mt-2">
              <div class="h-full bg-${potentialColor} rounded-full" style="width:${result.potential_score * 10}%"></div>
            </div>
          </div>
        </div>
        <div class="bg-black/30 backdrop-blur-md p-4 rounded-2xl mt-4 text-left text-gray-300 leading-relaxed space-y-2">
          ${result.suggestions.map(s => `<div>• ${s}</div>`).join("")}
        </div>`;
    }

    out.classList.remove("hidden");
  } catch (err) {
    spinner.classList.add("hidden");
    out.innerHTML = `<div class="text-red-500">Server error. Please try again.</div>`;
    out.classList.remove("hidden");
  }
}
