function createTooltip(element, content) {
  element.addEventListener("mouseenter", (e) => {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = content;

    // Position the tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 5}px`;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;

    document.body.appendChild(tooltip);

    element.addEventListener(
      "mouseleave",
      () => {
        tooltip.remove();
      },
      { once: true }
    );
  });
}
