const messages = [1, 2, 3, 4, 5].map(i => document.getElementById("msg" + i)).concat(document.getElementById("dev-warning"));
const enterBtn = document.getElementById("enter-btn");
const skipBtn = document.getElementById("skip-btn");
const intro = document.getElementById("intro");
const panel = document.getElementById("main-panel");

async function showIntro() {
    messages.forEach(el => el.classList.add("opacity-0"));
    enterBtn.classList.add("opacity-0");

    await new Promise(r => setTimeout(r, 100));

    for (let i = 0; i < messages.length; i++) {
        messages[i].classList.remove("opacity-0");
        messages[i].classList.add("opacity-100");
        await new Promise(r => setTimeout(r, 1200));
    }

    enterBtn.classList.remove("opacity-0");
    enterBtn.classList.add("opacity-100");
}

function skipIntro() {
    intro.classList.add("fade-out");

    setTimeout(() => {
        intro.classList.add("hidden");
        panel.classList.remove("hidden");

        setTimeout(() => {
            panel.classList.remove("opacity-0", "scale-95", "translate-y-4");
            panel.classList.add("opacity-100", "scale-100", "translate-y-0");
        }, 50);
    }, 600);
}

enterBtn.onclick = skipIntro;
skipBtn.onclick = skipIntro;

showIntro();
