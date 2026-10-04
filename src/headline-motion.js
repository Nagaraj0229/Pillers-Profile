const headings = document.querySelectorAll(".hero h1, .section-heading h2, .approach h2");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function makeLine(index) {
  const line = document.createElement("span");
  line.className = "typewriter-title";
  line.setAttribute("aria-hidden", "true");
  line.style.setProperty("--line-index", index);
  const content = document.createElement("span");
  content.className = "typewriter-content";
  line.append(content);
  return { line, content };
}

function prepareHeading(heading) {
  const accessibleText = heading.innerText.replace(/\s+/g, " ").trim();
  const sourceNodes = [...heading.childNodes];
  heading.setAttribute("aria-label", accessibleText);
  heading.classList.add("typewriter-heading");
  heading.replaceChildren();

  const lines = [];
  let current = makeLine(0);
  for (const node of sourceNodes) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
      lines.push(current);
      heading.append(current.line, document.createElement("br"));
      current = makeLine(lines.length);
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") current.line.classList.add("is-accent");
    current.content.append(node);
  }
  lines.push(current);
  heading.append(current.line);

  for (const { line } of lines) {
    if (!line.classList.contains("is-accent")) line.classList.add("is-static");
  }

  return lines;
}

const configured = [...headings].map((heading) => ({ heading, lines: prepareHeading(heading) }));

function measureLines() {
  for (const { heading, lines } of configured) {
    for (const { line, content } of lines) {
      const text = content.textContent;
      const characters = typeof Intl.Segmenter === "function"
        ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].length
        : Array.from(text).length;
      const availableWidth = heading.clientWidth;
      const naturalWidth = content.getBoundingClientRect().width;
      const headingFontSize = Number.parseFloat(getComputedStyle(heading).fontSize);
      if (availableWidth > 0 && naturalWidth > availableWidth) {
        line.style.fontSize = `${headingFontSize * availableWidth / naturalWidth}px`;
      } else {
        line.style.removeProperty("font-size");
      }
      line.style.setProperty("--typewriter-width", `${content.getBoundingClientRect().width}px`);
      line.style.setProperty("--typewriter-steps", Math.max(characters, 1));
    }
  }
}

function startVisibleHeadings() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.classList.toggle("typewriter-is-playing", entry.isIntersecting);
    }
  }, { threshold: 0.25, rootMargin: "0px 0px -5% 0px" });

  for (const { heading } of configured) observer.observe(heading);
}

document.fonts.ready.then(() => {
  measureLines();
  window.addEventListener("resize", () => requestAnimationFrame(measureLines), { passive: true });
  if (reducedMotion.matches) {
    document.documentElement.classList.add("reduce-typewriter-motion");
    return;
  }
  if ("IntersectionObserver" in window) startVisibleHeadings();
  else for (const { heading } of configured) heading.classList.add("typewriter-is-playing");
});

reducedMotion.addEventListener("change", (event) => {
  document.documentElement.classList.toggle("reduce-typewriter-motion", event.matches);
});
