import { servicePillars } from "./services.js";

const links = document.querySelector("#pillar-links");
const panel = document.querySelector("#pillar-list");
const count = document.querySelector("#slide-count");
const progress = document.querySelector("#carousel-progress-fill");
let activeIndex = 0;

function renderNavigation() {
  links.replaceChildren(...servicePillars.map((pillar, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pillar-step";
    button.dataset.index = index;
    button.setAttribute("aria-label", `Show service ${pillar.number}: ${pillar.name}`);
    button.setAttribute("aria-pressed", String(index === activeIndex));
    button.innerHTML = `<span>${pillar.number}</span><span class="nav-verb">${pillar.verb}</span>`;
    return button;
  }));
}

function renderPillar(index) {
  activeIndex = (index + servicePillars.length) % servicePillars.length;
  const pillar = servicePillars[activeIndex];
  const previous = servicePillars[(activeIndex - 1 + servicePillars.length) % servicePillars.length];
  const next = servicePillars[(activeIndex + 1) % servicePillars.length];
  const previewControl = (direction, destination) => `
    <div class="slide-control slide-control-${direction.toLowerCase()}">
      <button id="${direction === "PREVIOUS" ? "previous-pillar" : "next-pillar"}" class="slide-arrow" type="button" aria-label="${direction === "PREVIOUS" ? "Previous" : "Next"} service: ${destination.number} ${destination.verb}, ${destination.name}">${direction === "PREVIOUS" ? "←" : "→"}</button>
      <div class="slide-preview" aria-hidden="true">
        <div class="slide-preview-art"><span class="preview-orbit"></span><b>${destination.number}</b><i>${destination.verb}</i></div>
        <div class="slide-preview-copy"><span class="preview-direction">${direction}</span><strong>${destination.number} &nbsp;${destination.verb}</strong><span class="preview-name">${destination.name}</span></div>
      </div>
    </div>`;
  panel.innerHTML = `
    <article class="pillar pillar-${pillar.color}" id="service-${pillar.id}" aria-labelledby="title-${pillar.id}">
      ${previewControl("PREVIOUS", previous)}
      ${previewControl("NEXT", next)}
      <div class="pillar-identity"><span class="pillar-number">${pillar.number}</span><span class="pillar-verb">${pillar.verb}</span><div class="pillar-visual scene-${pillar.id}" aria-hidden="true"></div></div>
      <div class="pillar-content"><p class="eyebrow">SERVICE ${pillar.number} <span class="eyebrow-divider">/</span> ${pillar.verb}</p><h3 id="title-${pillar.id}">${pillar.name}</h3><p class="pillar-tagline">${pillar.tagline}</p><p class="pillar-overview">${pillar.overview}</p><div class="capabilities"><h4>CORE CAPABILITIES</h4><ul>${pillar.capabilities.map((capability) => `<li>${capability}</li>`).join("")}</ul></div><a class="pillar-more" href="mailto:hello.lingooffical@gmail.com?subject=${encodeURIComponent(`Tell me more about ${pillar.name}`)}">Discuss this capability <span aria-hidden="true">↗</span></a></div>
      <span class="pillar-index" aria-hidden="true">${pillar.number}</span>
    </article>`;
  count.textContent = `${pillar.number} / ${String(servicePillars.length).padStart(2, "0")}`;
  progress.style.width = `${((activeIndex + 1) / servicePillars.length) * 100}%`;
  renderNavigation();
}

links.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (button) renderPillar(Number(button.dataset.index));
});
panel.addEventListener("click", (event) => {
  if (event.target.closest("#previous-pillar")) {
    renderPillar(activeIndex - 1);
    panel.querySelector("#previous-pillar").focus();
  }
  if (event.target.closest("#next-pillar")) {
    renderPillar(activeIndex + 1);
    panel.querySelector("#next-pillar").focus();
  }
});
renderPillar(activeIndex);
