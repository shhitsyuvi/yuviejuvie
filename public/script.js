const img = document.getElementById("image");
const btn = document.getElementById("submit");
const tips = document.getElementById("tips");
const out = document.getElementById("output");
const spinner = document.getElementById("spinner");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");

img.onchange = () => {
    const file = img.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            previewImg.src = e.target.result;
            preview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    } else {
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
    spinner.classList.remove("hidden");

    const form = new FormData();
    form.append("img", file);
    form.append("text", type === "analyze" ? `
You're a face aesthetics expert. Analyze this face and return JSON:
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
  "notes": "brief summary in simple words"
}
Rate each on a 1–10 scale with decimals (e.g. 6.7). Only use visible structure and proportion. Be highly accurate, not kind or mean. If the person is still attractive overall, reflect that fairly.
` : `
You're a beauty advisor. Based on this face, return JSON:
{
  "current_score": number,
  "potential_score": number,
  "suggestions": [
    "tip1",
    "tip2",
    "tip3"
  ]
}
Use decimals 1–10 (e.g. 6.4). Give only natural, realistic tips. No surgery or extreme advice. Use simple language.
`);

    const res = await fetch("/ask", { method: "POST", body: form });
    const data = await res.json();
    spinner.classList.add("hidden");

    let raw = data.reply.trim().replace(/^```json|^```|```$/g, "").trim();
    const result = JSON.parse(raw);

    if (type === "analyze") {
        const featureHTML = Object.entries(result.features)
            .map(([key, value]) => {
                let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let color = value >= 8 ? 'green-400' : value >= 6 ? 'yellow-400' : 'red-400';
                return `
        <div class="bg-neutral-900 p-4 rounded-xl shadow-md">
          <div class="text-sm uppercase text-gray-400">${label}</div>
          <div class="text-2xl font-bold text-white">${value.toFixed(1)} ${getEmoji(value)}</div>
          <div class="h-1.5 bg-gray-700 rounded-full mt-2">
            <div class="h-full bg-${color} rounded-full" style="width:${value * 10}%"></div>
          </div>
        </div>`;
            }).join("");

        out.innerHTML = `
      <div class="text-white text-4xl font-bold mb-2">Overall: ${result.overall.toFixed(1)} ${getEmoji(result.overall)}</div>
      <div class="text-blue-400 text-lg mb-4">Potential: ${result.potential.toFixed(1)} ${getEmoji(result.potential)}</div>
      <div class="grid grid-cols-2 gap-4 text-left">${featureHTML}</div>
      <div class="text-sm mt-4 text-gray-300">${result.notes}</div>`;
    } else {
        out.innerHTML = `
      <div class="text-white text-3xl font-bold mb-2">Current Score: ${result.current_score.toFixed(1)} ${getEmoji(result.current_score)}</div>
      <div class="text-blue-400 text-xl mb-2">Potential Score: ${result.potential_score.toFixed(1)} ${getEmoji(result.potential_score)}</div>
      <div class="text-left mt-4 text-gray-300 space-y-2">
        ${result.suggestions.map(s => `<div>• ${s}</div>`).join("")}
      </div>`;
    }

    out.classList.remove("hidden");
}
