const statsTitles = {
  monthly: "monthly stats",
  yearly: "yearly stats",
  "all-time": "all-time stats"
};

document.querySelectorAll("[data-stats-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.statsTarget;
    const statsBox = button.closest(".home-stats");

    if (!statsBox) {
      return;
    }

    statsBox.querySelectorAll("[data-stats-panel]").forEach((panel) => {
      const isActive = panel.dataset.statsPanel === target;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });

    statsBox.querySelectorAll("[data-stats-target]").forEach((dot) => {
      const isActive = dot === button;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });

    const heading = statsBox.querySelector("[data-stats-heading]");

    if (heading) {
      heading.textContent = statsTitles[target];
    }
  });
});

const sidebarToggle = document.querySelector(".sidebar-toggle");

const setSidebarState = (isHidden) => {
  document.body.classList.toggle("is-sidebar-hidden", isHidden);

  if (sidebarToggle) {
    sidebarToggle.innerHTML = isHidden
      ? '<i class="fa-solid fa-angles-right" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';
    sidebarToggle.setAttribute("aria-label", isHidden ? "show sidebar" : "hide sidebar");
    sidebarToggle.setAttribute("title", isHidden ? "show sidebar" : "hide sidebar");
    sidebarToggle.setAttribute("aria-pressed", String(isHidden));
  }
};

setSidebarState(localStorage.getItem("moonLitSidebarHidden") === "true");

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    const isHidden = !document.body.classList.contains("is-sidebar-hidden");
    localStorage.setItem("moonLitSidebarHidden", String(isHidden));
    setSidebarState(isHidden);
  });
}

const sharedFriendFilter = document.querySelector("#shared-friend-filter");

if (sharedFriendFilter) {
  const sharedShelf = sharedFriendFilter.closest(".shared-shelf");
  const sharedBookItems = sharedShelf ? [...sharedShelf.querySelectorAll("[data-shared-friends]")] : [];
  const emptyFilterMessage = sharedShelf ? sharedShelf.querySelector(".empty-filter-message") : null;

  sharedFriendFilter.addEventListener("input", () => {
    const query = sharedFriendFilter.value.trim().toLowerCase();
    let visibleCount = 0;

    sharedBookItems.forEach((item) => {
      const friendNames = item.dataset.sharedFriends.toLowerCase();
      const isVisible = !query || friendNames.includes(query);
      item.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (emptyFilterMessage) {
      emptyFilterMessage.hidden = visibleCount > 0;
    }
  });
}

const bookBreadcrumb = document.querySelector(".breadcrumb-trail");

if (bookBreadcrumb && window.location.pathname.endsWith("book.html")) {
  const source = new URLSearchParams(window.location.search).get("from");
  const sourceLink = bookBreadcrumb.querySelector("a");

  if (sourceLink && source === "library") {
    sourceLink.href = "library.html";
    sourceLink.textContent = "my library";
  }

  if (sourceLink && source === "shared") {
    sourceLink.href = "shared.html";
    sourceLink.textContent = "shared library";
  }
}
