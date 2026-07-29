(() => {
  "use strict";

  const songs = Array.isArray(window.SONGS) ? window.SONGS : [];
  const PAGE_SIZE = 10;
  const state = { query: "", genre: "all", recommendedOnly: false, visible: PAGE_SIZE, random: [] };

  const els = {
    searchInput: document.querySelector("#searchInput"),
    clearSearch: document.querySelector("#clearSearch"),
    genreSelect: document.querySelector("#genreSelect"),
    recommendToggle: document.querySelector("#recommendToggle"),
    resetFilters: document.querySelector("#resetFilters"),
    songGrid: document.querySelector("#songGrid"),
    songCount: document.querySelector("#songCount"),
    emptyState: document.querySelector("#emptyState"),
    loadMore: document.querySelector("#loadMore"),
    randomCount: document.querySelector("#randomCount"),
    decreaseCount: document.querySelector("#decreaseCount"),
    increaseCount: document.querySelector("#increaseCount"),
    randomButton: document.querySelector("#randomButton"),
    randomResultSection: document.querySelector("#randomResultSection"),
    randomGrid: document.querySelector("#randomGrid"),
    rerollButton: document.querySelector("#rerollButton"),
    copyRandomButton: document.querySelector("#copyRandomButton"),
    toast: document.querySelector("#toast"),
    newSongGrid: document.querySelector("#newSongGrid"),
    newSongsSection: document.querySelector("#newSongsSection"),
    totalSongCount: document.querySelector("#totalSongCount"),
    newSongCount: document.querySelector("#newSongCount")
  };

  const normalize = (value) => String(value ?? "").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
  const requestText = (song) => `[노래신청] ${song.artist} - ${song.title}`;

  function getFilteredSongs() {
    const q = normalize(state.query);
    return songs.filter((song) => {
      const matchesQuery = !q || normalize(`${song.title} ${song.artist}`).includes(q);
      const matchesGenre = state.genre === "all" || song.genre === state.genre;
      const matchesRecommended = !state.recommendedOnly || song.recommended;
      return matchesQuery && matchesGenre && matchesRecommended;
    });
  }

  function populateGenres() {
    const genres = [...new Set(songs.map((song) => song.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
    genres.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      els.genreSelect.append(option);
    });
  }

  function createSongCard(song, index) {
    const card = document.createElement("article");
    card.className = "song-card";
    if (song.isNew) card.classList.add("is-new");

    const number = document.createElement("div");
    number.className = "song-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const info = document.createElement("div");
    info.className = "song-info";

    const title = document.createElement("h3");
    title.className = "song-title";
    title.textContent = song.title;

    const meta = document.createElement("div");
    meta.className = "song-meta";

    const artist = document.createElement("span");
    artist.textContent = song.artist;

    const genre = document.createElement("span");
    genre.className = "genre-pill";
    genre.textContent = song.genre;

    meta.append(artist, genre);
    if (song.isNew) {
      const newBadge = document.createElement("span");
      newBadge.className = "new-inline-badge";
      newBadge.textContent = "✦ NEW";
      meta.append(newBadge);
    }
    if (song.recommended) {
      const badge = document.createElement("span");
      badge.className = "recommend-badge";
      badge.textContent = "✦ 추천";
      meta.append(badge);
    }
    info.append(title, meta);

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "song-copy";
    copyButton.textContent = "복사";
    copyButton.setAttribute("aria-label", `${song.title} 신청 문구 복사`);
    copyButton.addEventListener("click", () => copyToClipboard(requestText(song), `${song.title} 신청 문구를 복사했어요.`));

    card.append(number, info, copyButton);
    return card;
  }


  function renderNewSongs() {
    const newSongs = songs.filter((song) => song.isNew);
    els.totalSongCount.textContent = String(songs.length);
    els.newSongCount.textContent = String(newSongs.length);
    els.newSongsSection.hidden = newSongs.length === 0;
    els.newSongGrid.replaceChildren(...newSongs.map((song) => {
      const card = document.createElement("article");
      card.className = "new-song-card";
      const badge = document.createElement("span");
      badge.className = "new-badge";
      badge.textContent = "NEW";
      const title = document.createElement("h3");
      title.textContent = song.title;
      const artist = document.createElement("p");
      artist.textContent = `${song.artist} · ${song.genre}`;
      card.append(badge, title, artist);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${song.title} 신청 문구 복사`);
      const copy = () => copyToClipboard(requestText(song), `${song.title} 신청 문구를 복사했어요.`);
      card.addEventListener("click", copy);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); copy(); }
      });
      return card;
    }));
  }

  function renderSongs() {
    const filtered = getFilteredSongs();
    const visibleSongs = filtered.slice(0, state.visible);

    els.songGrid.replaceChildren(...visibleSongs.map(createSongCard));
    els.songCount.textContent = String(filtered.length);
    els.emptyState.hidden = filtered.length !== 0;
    els.loadMore.hidden = state.visible >= filtered.length || filtered.length === 0;
  }

  function updateRandomLabel() {
    const count = clampCount();
    els.randomButton.textContent = `${count}곡 랜덤 뽑기`;
  }

  function clampCount() {
    const parsed = Number.parseInt(els.randomCount.value, 10);
    const next = Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : 1;
    els.randomCount.value = String(next);
    return next;
  }

  function pickRandomSongs() {
    const pool = [...getFilteredSongs()];
    if (pool.length === 0) {
      showToast("현재 조건에서 뽑을 수 있는 노래가 없어요.");
      return;
    }
    const count = Math.min(clampCount(), pool.length);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.random = pool.slice(0, count);
    els.randomGrid.replaceChildren(...state.random.map(createSongCard));
    els.randomResultSection.hidden = false;
    els.randomResultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copyToClipboard(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast(successMessage);
    }
  }

  let toastTimer;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function resetVisibleAndRender() {
    state.visible = PAGE_SIZE;
    renderSongs();
  }

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    resetVisibleAndRender();
  });
  els.clearSearch.addEventListener("click", () => {
    els.searchInput.value = "";
    state.query = "";
    els.searchInput.focus();
    resetVisibleAndRender();
  });
  els.genreSelect.addEventListener("change", (event) => {
    state.genre = event.target.value;
    resetVisibleAndRender();
  });
  els.recommendToggle.addEventListener("click", () => {
    state.recommendedOnly = !state.recommendedOnly;
    els.recommendToggle.setAttribute("aria-pressed", String(state.recommendedOnly));
    resetVisibleAndRender();
  });
  els.resetFilters.addEventListener("click", () => {
    state.query = "";
    state.genre = "all";
    state.recommendedOnly = false;
    els.searchInput.value = "";
    els.genreSelect.value = "all";
    els.recommendToggle.setAttribute("aria-pressed", "false");
    resetVisibleAndRender();
  });
  els.loadMore.addEventListener("click", () => {
    state.visible += PAGE_SIZE;
    renderSongs();
  });
  els.randomCount.addEventListener("input", updateRandomLabel);
  els.randomCount.addEventListener("blur", updateRandomLabel);
  els.decreaseCount.addEventListener("click", () => {
    els.randomCount.value = String(Math.max(1, clampCount() - 1));
    updateRandomLabel();
  });
  els.increaseCount.addEventListener("click", () => {
    els.randomCount.value = String(Math.min(10, clampCount() + 1));
    updateRandomLabel();
  });
  els.randomButton.addEventListener("click", pickRandomSongs);
  els.rerollButton.addEventListener("click", pickRandomSongs);
  els.copyRandomButton.addEventListener("click", () => {
    if (state.random.length === 0) return;
    const text = state.random.map((song, index) => `${index + 1}. ${requestText(song)}`).join("\n");
    copyToClipboard(text, "랜덤 신청곡 목록을 복사했어요.");
  });

  populateGenres();
  renderNewSongs();
  updateRandomLabel();
  renderSongs();
})();
