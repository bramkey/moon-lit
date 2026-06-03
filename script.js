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

const bookTitleInput = document.querySelector("#book-title");
const bookAuthorInput = document.querySelector("#book-author");
const bookPagesInput = document.querySelector("#book-pages");
const bookCoverUrlInput = document.querySelector("#book-cover-url");
const bookOpenLibraryKeyInput = document.querySelector("#book-open-library-key");
const openLibraryStatus = document.querySelector("#open-library-status");
const openLibraryResults = document.querySelector("#open-library-results");
const openLibraryPreview = document.querySelector("#open-library-preview");
const openLibraryPreviewImage = document.querySelector("#book-cover-preview");
const openLibraryPreviewTitle = document.querySelector("#open-library-preview-title");
const openLibraryPreviewMeta = document.querySelector("#open-library-preview-meta");
const manualBookNote = document.querySelector("#manual-book-note");

if (bookTitleInput && openLibraryResults) {
  let openLibraryTimer;
  let openLibraryController;

  const tagMatchers = {
    horror: ["horror", "ghost", "ghost stories", "monster"],
    fantasy: ["fantasy", "magic", "dragon", "faerie", "fairy", "mythology"],
    "sci-fi": ["science fiction", "sci fi", "sci-fi", "space", "time travel"],
    romance: ["romance", "love stories", "dating"],
    mystery: ["mystery", "detective"],
    thriller: ["thriller", "suspense", "psychological fiction"],
    "young-adult": ["young adult", "juvenile fiction", "teenagers", "children's 12-up"],
    paranormal: ["paranormal", "vampire", "vampires", "werewolf", "werewolves", "occult", "supernatural"],
    adventure: ["adventure", "quests", "survival"],
    historical: ["historical fiction", "history", "historical"],
    dystopian: ["dystopian", "dystopia", "apocalyptic", "post-apocalyptic"],
    contemporary: ["contemporary", "social themes", "interpersonal relations"],
    literary: ["literary fiction", "american fiction", "english fiction"],
    nonfiction: ["nonfiction", "non-fiction", "biography", "science", "essays"],
    memoir: ["memoir", "autobiography"],
    poetry: ["poetry", "poems"],
    manga: ["manga"],
    classic: ["classic", "classics"],
    cozy: ["cozy", "cozy mystery"],
    dark: ["dark fantasy", "dark romance", "gothic"],
    nsfw: ["erotica", "adult fiction"],
    long: [],
    short: []
  };

  const setOpenLibraryStatus = (message) => {
    if (openLibraryStatus) {
      openLibraryStatus.textContent = message;
    }
  };

  const getCoverUrl = (book, size = "M") => {
    if (!book.cover_i) {
      return "";
    }

    return `https://covers.openlibrary.org/b/id/${book.cover_i}-${size}.jpg`;
  };

  const getBookMeta = (book) => {
    const author = book.author_name?.[0] || "unknown author";
    const year = book.first_publish_year ? `, ${book.first_publish_year}` : "";
    const pages = book.number_of_pages_median ? `, ${book.number_of_pages_median} pages` : "";

    return `${author}${year}${pages}`;
  };

  const hideOpenLibraryResults = () => {
    openLibraryResults.hidden = true;
    openLibraryResults.innerHTML = "";
  };

  const setManualBookNote = (isVisible) => {
    if (manualBookNote) {
      manualBookNote.hidden = !isVisible;
    }
  };

  const updateTagSelections = (book) => {
    const tagInputs = [...document.querySelectorAll('input[name="tags"]')];
    const subjectList = [
      ...(book.subject || []),
      ...(book.subject_facet || []),
      ...(book.subjects || []),
      ...(book.subject_places || []),
      ...(book.subject_people || []),
      ...(book.subject_times || [])
    ];
    const subjects = subjectList.join(" ").toLowerCase();
    const titleText = [
      book.title,
      book.subtitle,
      book.full_title,
      book.title_suggest
    ].filter(Boolean).join(" ").toLowerCase();
    const pages = Number(book.number_of_pages_median) || 0;
    const matchedTags = new Set();

    Object.entries(tagMatchers).forEach(([tag, keywords]) => {
      if (keywords.some((keyword) => subjects.includes(keyword))) {
        matchedTags.add(tag);
      }
    });

    const titleSuggestsGraphicNovel = /\b(graphic novel|comic|comics|manga)\b/.test(titleText);
    const subjectsSuggestGraphicNovel = subjectList.some((subject) =>
      /\b(graphic novels?|comic books?|comics|manga)\b/i.test(subject)
    );

    if (titleSuggestsGraphicNovel || (subjectsSuggestGraphicNovel && /\bgraphic novel\b/.test(titleText))) {
      matchedTags.add("graphic-novel");
    }

    if (pages >= 500) {
      matchedTags.add("long");
    }

    if (pages > 0 && pages <= 220) {
      matchedTags.add("short");
    }

    tagInputs.forEach((input) => {
      input.checked = matchedTags.has(input.value);
    });

    return matchedTags.size;
  };

  const getOpenLibraryWorkDetails = async (book) => {
    if (!book.key) {
      return {};
    }

    try {
      const response = await fetch(`https://openlibrary.org${book.key}.json`);

      if (!response.ok) {
        return {};
      }

      return await response.json();
    } catch {
      return {};
    }
  };

  const selectOpenLibraryBook = async (book) => {
    const coverUrl = getCoverUrl(book, "L");

    bookTitleInput.value = book.title || "";
    setOpenLibraryStatus("adding book details and tags...");

    if (bookAuthorInput) {
      bookAuthorInput.value = book.author_name?.[0] || "";
    }

    if (bookPagesInput && book.number_of_pages_median) {
      bookPagesInput.value = book.number_of_pages_median;
    }

    if (bookCoverUrlInput) {
      bookCoverUrlInput.value = coverUrl;
    }

    if (bookOpenLibraryKeyInput) {
      bookOpenLibraryKeyInput.value = book.key || "";
    }

    const workDetails = await getOpenLibraryWorkDetails(book);
    const tagCount = updateTagSelections({ ...book, ...workDetails });
    hideOpenLibraryResults();
    setOpenLibraryStatus(
      tagCount
        ? `book found. matched ${tagCount} tags.`
        : "book found. no matching tags found."
    );

    if (openLibraryPreview && openLibraryPreviewImage && coverUrl) {
      openLibraryPreview.hidden = false;
      openLibraryPreviewImage.src = coverUrl;
      openLibraryPreviewImage.alt = `${book.title || "selected book"} cover`;

      if (openLibraryPreviewTitle) {
        openLibraryPreviewTitle.textContent = book.title || "selected book";
      }

      if (openLibraryPreviewMeta) {
        openLibraryPreviewMeta.textContent = getBookMeta(book);
      }
    }
  };

  const renderOpenLibraryResults = (books) => {
    const usefulBooks = books.filter((book) => book.title).slice(0, 5);
    openLibraryResults.innerHTML = "";

    if (!usefulBooks.length) {
      hideOpenLibraryResults();
      setManualBookNote(true);
      setOpenLibraryStatus("no matches found.");
      return;
    }

    setManualBookNote(false);

    usefulBooks.forEach((book) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const coverUrl = getCoverUrl(book, "S");
      const copy = document.createElement("span");
      const title = document.createElement("span");
      const meta = document.createElement("span");

      button.type = "button";

      if (coverUrl) {
        const cover = document.createElement("img");
        cover.src = coverUrl;
        cover.alt = "";
        button.append(cover);
      } else {
        const fallback = document.createElement("span");
        const fallbackIcon = document.createElement("i");
        fallback.className = "open-library-cover-fallback";
        fallback.setAttribute("aria-hidden", "true");
        fallbackIcon.className = "fa-solid fa-book";
        fallback.append(fallbackIcon);
        button.append(fallback);
      }

      copy.className = "open-library-result-copy";
      title.className = "open-library-result-title";
      meta.className = "open-library-result-meta";
      title.textContent = book.title;
      meta.textContent = getBookMeta(book);
      copy.append(title, meta);
      button.append(copy);
      button.addEventListener("click", () => selectOpenLibraryBook(book));
      item.append(button);
      openLibraryResults.append(item);
    });

    openLibraryResults.hidden = false;
    setOpenLibraryStatus("book found. choose a match.");
  };

  const searchOpenLibrary = async (query) => {
    if (openLibraryController) {
      openLibraryController.abort();
    }

    openLibraryController = new AbortController();
    setManualBookNote(false);
    setOpenLibraryStatus("searching...");

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,subject_facet`,
        { signal: openLibraryController.signal }
      );
      const data = await response.json();
      renderOpenLibraryResults(data.docs || []);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      hideOpenLibraryResults();
      setManualBookNote(false);
      setOpenLibraryStatus("search is unavailable right now.");
    }
  };

  bookTitleInput.addEventListener("input", () => {
    const query = bookTitleInput.value.trim();
    window.clearTimeout(openLibraryTimer);

    if (query.length < 3) {
      hideOpenLibraryResults();
      setManualBookNote(false);
      setOpenLibraryStatus("type a title to search.");
      return;
    }

    openLibraryTimer = window.setTimeout(() => searchOpenLibrary(query), 350);
  });

  document.addEventListener("click", (event) => {
    if (!openLibraryResults.contains(event.target) && event.target !== bookTitleInput) {
      hideOpenLibraryResults();
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
