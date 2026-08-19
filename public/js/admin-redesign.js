(() => {
  "use strict";

  const admin = document.getElementById("adminDashboard");

  if (!admin) {
    return;
  }

  admin.classList.add("cr-admin-shell");

  const sectionWithHeading = (text) =>
    [...admin.querySelectorAll("section")].find((section) =>
      [...section.querySelectorAll("h1, h2, h3")].some((heading) =>
        heading.textContent
          .trim()
          .toLowerCase()
          .includes(text.toLowerCase())
      )
    );

  const analytics = sectionWithHeading("complaint analytics");
  const queue = sectionWithHeading("all complaints");

  if (
    analytics &&
    queue &&
    analytics.parentElement === queue.parentElement
  ) {
    analytics.parentElement.insertBefore(queue, analytics);
  }

  if (
    analytics &&
    !analytics.querySelector(".cr-analytics-toggle")
  ) {
    const heading = [
      ...analytics.querySelectorAll("h1, h2, h3"),
    ].find((item) =>
      item.textContent
        .trim()
        .toLowerCase()
        .includes("complaint analytics")
    );

    const tools = document.createElement("div");
    tools.className = "cr-section-tools";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cr-analytics-toggle";
    button.textContent = "Hide Analytics";
    button.setAttribute("aria-expanded", "true");
    button.setAttribute(
      "aria-label",
      "Hide complaint analytics"
    );

    if (heading) {
      heading.parentNode.insertBefore(tools, heading);
      tools.append(heading, button);
    } else {
      analytics.prepend(tools);
      tools.append(button);
    }

    const analyticsContent = analytics.querySelectorAll(
      ".analytics-summary, .analytics-grid"
    );

    button.addEventListener("click", () => {
      const isExpanded =
        button.getAttribute("aria-expanded") === "true";

      analyticsContent.forEach((section) => {
        section.style.display = isExpanded ? "none" : "";
      });

      button.textContent = isExpanded
        ? "View Analytics"
        : "Hide Analytics";

      button.setAttribute(
        "aria-expanded",
        String(!isExpanded)
      );

      button.setAttribute(
        "aria-label",
        isExpanded
          ? "View complaint analytics"
          : "Hide complaint analytics"
      );
    });
  }

  const compactCards = () => {
    admin
      .querySelectorAll(".complaint-item")
      .forEach((card) => {
        card.classList.add("cr-compact-card");

        card
          .querySelectorAll(".complaint-evidence img")
          .forEach((image) => {
            image.tabIndex = 0;
            image.setAttribute("role", "button");
            image.setAttribute(
              "aria-label",
              "Open evidence image"
            );
          });
      });
  };

  compactCards();

  const cardObserver = new MutationObserver(() => {
    compactCards();
  });

  cardObserver.observe(admin, {
    childList: true,
    subtree: true,
  });

  let lightbox = document.querySelector(".cr-lightbox");

  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "cr-lightbox";
    lightbox.hidden = true;

    lightbox.innerHTML = `
      <button
        type="button"
        aria-label="Close image"
      >
        &times;
      </button>

      <img
        src=""
        alt="Complaint evidence preview"
      />
    `;

    document.body.append(lightbox);
  }

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";

    const preview = lightbox.querySelector("img");

    if (preview) {
      preview.src = "";
    }
  };

  const openLightbox = (source, alt) => {
    const preview = lightbox.querySelector("img");

    if (!preview || !source) {
      return;
    }

    preview.src = source;
    preview.alt =
      alt || "Complaint evidence preview";

    lightbox.hidden = false;
    document.body.style.overflow = "hidden";

    const closeButton =
      lightbox.querySelector("button");

    if (closeButton) {
      closeButton.focus();
    }
  };

  admin.addEventListener("click", (event) => {
    const image = event.target.closest(
      ".complaint-evidence img"
    );

    if (image) {
      openLightbox(
        image.currentSrc || image.src,
        image.alt
      );
    }
  });

  admin.addEventListener("keydown", (event) => {
    const image = event.target.closest(
      ".complaint-evidence img"
    );

    if (
      image &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();

      openLightbox(
        image.currentSrc || image.src,
        image.alt
      );
    }
  });

  lightbox.addEventListener("click", (event) => {
    if (
      event.target === lightbox ||
      event.target.closest("button")
    ) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !lightbox.hidden
    ) {
      closeLightbox();
    }
  });
})();
