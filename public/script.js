const img = document.getElementById("image")
const btn = document.getElementById("submit")
const out = document.getElementById("output")
const spinner = document.getElementById("spinner")
const preview = document.getElementById("preview")
const previewImg = document.getElementById("preview-img")

img.onchange = () => {
    const file = img.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = e => {
            previewImg.src = e.target.result
            preview.classList.remove("hidden")
        }
        reader.readAsDataURL(file)
    } else {
        preview.classList.add("hidden")
        previewImg.src = ""
    }
}

btn.onclick = async () => {
    const file = img.files[0]
    if (!file) return

    out.classList.add("hidden")
    spinner.classList.remove("hidden")

    const form = new FormData()
    form.append("img", file)
    form.append("text", `Evaluate this face using only visual cues from the uploaded image. The face must appear real, human, and photographically accurate — ignore stylized, cartoon, AI, or game characters entirely.

Return only this JSON format:
{
  "rating": (decimal from 0.0 to 10.0),
  "analysis": "strict, technical breakdown of facial features"
}

Your judgment must be harsh and precise. Do NOT default to high scores. Only consider:
- Facial symmetry
- Bone structure (jawline, cheekbones, brow)
- Nose proportion
- Eye spacing and shape
- Lip fullness and balance
- Skin clarity and evenness
- Proportional harmony of the whole face

Reject or give extremely low scores (e.g. 0.0–2.0) for non-human, cartoon, or distorted faces.

Do not be polite, vague, or forgiving. Your rating must reflect strict aesthetics, not style or emotion.`)

    const res = await fetch("/ask", { method: "POST", body: form })
    const data = await res.json()

    spinner.classList.add("hidden")

    let raw = data.reply.trim()
    raw = raw.replace(/^```json|^```|```$/g, "").trim()
    const result = JSON.parse(raw)

    out.innerHTML = `
    <div class="text-center text-6xl font-bold text-[#4eaaff] mb-6">${result.rating}</div>
    <div class="text-white text-sm leading-relaxed">${result.analysis}</div>
  `
    out.classList.remove("hidden")
}
