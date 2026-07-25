// Lightweight, no framework — keeps page load fast.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".fit-quiz-widget").forEach((widget) => {
    const trigger = widget.querySelector(".fit-quiz-trigger");
    const panel = widget.querySelector(".fit-quiz-panel");
    const form = widget.querySelector(".fit-quiz-form");
    const productId = widget.dataset.productId;
    const shop = widget.dataset.shop;

    const stepForm = widget.querySelector('[data-step="form"]');
    const stepResult = widget.querySelector('[data-step="result"]');
    const stepEmpty = widget.querySelector('[data-step="empty"]');

    const resultSize = widget.querySelector("[data-result-size]");
    const resultLabel = widget.querySelector("[data-result-label]");
    const confidenceFill = widget.querySelector("[data-confidence-fill]");
    const confidenceText = widget.querySelector("[data-confidence-text]");
    const retryButton = widget.querySelector("[data-retry]");

    function showStep(step) {
      [stepForm, stepResult, stepEmpty].forEach((el) => {
        el.hidden = el !== step;
      });
    }

    trigger.addEventListener("click", () => {
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });

    retryButton?.addEventListener("click", () => {
      showStep(stepForm);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = {
        productId,
        heightCm: Number(formData.get("heightCm")),
        weightKg: Number(formData.get("weightKg")),
        fitPreference: formData.get("fitPreference"),
      };

      const submitBtn = form.querySelector(".fit-quiz-submit");
      const submitText = submitBtn.querySelector(".fit-quiz-submit-text");
      submitBtn.disabled = true;
      submitText.textContent = "Checking…";

      try {
        const res = await fetch(`https://${shop}/apps/fit-quiz/api/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.recommendedSize) {
          resultSize.textContent = data.recommendedSize;
          resultLabel.textContent = data.reasoning || "Based on your height and weight";
          const pct = Math.round((data.confidence ?? 0) * 100);
          confidenceFill.style.width = `${pct}%`;
          confidenceText.textContent = `${pct}% match`;
          showStep(stepResult);
        } else {
          showStep(stepEmpty);
        }
      } catch (err) {
        stepEmpty.querySelector(".fit-quiz-empty-text").textContent =
          "Something went wrong — please try again.";
        showStep(stepEmpty);
      } finally {
        submitBtn.disabled = false;
        submitText.textContent = "Get my size";
      }
    });
  });
});