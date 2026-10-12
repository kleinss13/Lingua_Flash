/* Lingua — lógica de tarjetas, estudio, importación/exportación y tema. */
(() => {
  "use strict";
  const STORAGE_KEY = "lingua.cards.v1";
  const THEME_KEY = "lingua.theme.v1";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  let cards = loadCards();
  let theme = localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  let deck = [];
  let index = 0;
  let checked = false;
  function loadMissedIds() {
    try { return new Set(JSON.parse(localStorage.getItem("lingua.missed.v1") || "[]")); }
    catch { return new Set(); }
  }
  let session = { correct: 0, wrong: 0, missedIds: loadMissedIds() };
  function persistMissedIds() {
    try { localStorage.setItem("lingua.missed.v1", JSON.stringify([...session.missedIds])); } catch {}
  }
  let toastTimer;

  const els = {
    themeToggle: $("#themeToggle"), exportBtn: $("#exportBtn"), importBtn: $("#importBtn"), importFile: $("#importFile"),
    totalStat: $("#totalStat"), accuracyStat: $("#accuracyStat"), errorsStat: $("#errorsStat"), cardCountBadge: $("#cardCountBadge"),
    tabs: $$(".tab"), views: { home: $("#homeView"), study: $("#studyView"), cards: $("#cardsView"), add: $("#addView") },
    shuffleBtn: $("#shuffleBtn"), studyMode: $("#studyMode"), progressText: $("#progressText"), studyEmpty: $("#studyEmpty"),
    quizCard: $("#quizCard"), cardPosition: $("#cardPosition"), promptText: $("#promptText"), answerForm: $("#answerForm"),
    answerInput: $("#answerInput"), checkBtn: $("#checkBtn"), feedback: $("#feedback"), nextBtn: $("#nextBtn"),
    sessionScore: $("#sessionScore"), searchInput: $("#searchInput"), cardsEmpty: $("#cardsEmpty"), cardList: $("#cardList"),
    cardForm: $("#cardForm"), editId: $("#editId"), spanishInput: $("#spanishInput"), translationInput: $("#translationInput"),
    formTitle: $("#formTitle"), saveCardBtn: $("#saveCardBtn"), cancelEditBtn: $("#cancelEditBtn"), toast: $("#toast"), studyTitle: $("#studyTitle"), studyEyebrow: $("#studyEyebrow")
  };

  function loadCards() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(c => c && typeof c.id === "string" && typeof c.spanish === "string" && typeof c.translation === "string") : [];
    } catch { return []; }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      $("#saveStatus").textContent = "Guardado en este dispositivo";
    } catch {
      $("#saveStatus").textContent = "No se pudo guardar";
      showToast("No hay espacio disponible para guardar los cambios.");
    }
  }
  function normalize(text) {
    return text.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,;:¡'"]/g, "").replace(/\s+/g, " ");
  }
  function makeId() {
    return globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2500);
  }
  function setTheme(next) {
    theme = next;
    document.documentElement.dataset.theme = theme;
    els.themeToggle.textContent = theme === "dark" ? "☀" : "☾";
    els.themeToggle.setAttribute("aria-label", theme === "dark" ? "Activar tema claro" : "Activar tema oscuro");
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#11131d" : "#f7f8fc";
    localStorage.setItem(THEME_KEY, theme);
  }
  function switchView(view) {
    if (view === "errors") { els.studyMode.value = "errors"; view = "study"; }
    else if (view === "study") els.studyMode.value = "all";
    Object.entries(els.views).forEach(([name, node]) => node.hidden = name !== view);
    els.tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
    if (view === "cards") renderList();
    if (view === "study") { els.studyTitle.textContent = els.studyMode.value === "errors" ? "Repasa tus errores" : "Translate the words"; els.studyEyebrow.textContent = els.studyMode.value === "errors" ? "MODO REPASO" : "MODO TEST"; startDeck(false); }
    if (view === "add") setTimeout(() => els.spanishInput.focus({ preventScroll: true }), 80);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateStats() {
    els.totalStat.textContent = cards.length;
    if (els.cardCountBadge) els.cardCountBadge.textContent = cards.length;
    els.accuracyStat.textContent = session.correct + session.wrong ? `${Math.round(session.correct / (session.correct + session.wrong) * 100)}%` : "—";
    els.errorsStat.textContent = session.missedIds.size;
    els.sessionScore.textContent = `${session.correct} aciertos · ${session.wrong} fallos`;
  }
  function newSession() {
    session = { correct: 0, wrong: 0, missedIds: loadMissedIds() };
    updateStats();
  }
  function currentDeck() {
    const base = els.studyMode.value === "errors" ? cards.filter(c => session.missedIds.has(c.id)) : cards;
    return base.slice();
  }
  function startDeck(shuffle = false) {
    deck = currentDeck();
    if (shuffle) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    index = 0;
    checked = false;
    renderStudy();
  }
  function renderStudy() {
    deck = deck.filter(c => cards.some(saved => saved.id === c.id));
    const mode = els.studyMode.value;
    const fresh = currentDeck();
    // Keep the order chosen by shuffle until the deck has been exhausted.
    if (!deck.length || !deck.some(c => fresh.some(f => f.id === c.id)) || index >= deck.length) {
      deck = fresh;
      index = 0;
    } else {
      deck = deck.filter(c => fresh.some(f => f.id === c.id));
    }
    const hasCards = deck.length > 0 && cards.length > 0;
    els.studyEmpty.hidden = hasCards;
    els.quizCard.hidden = !hasCards;
    els.progressText.textContent = hasCards ? `${Math.min(index + 1, deck.length)} / ${deck.length}` : "0 / 0";
    if (!hasCards) {
      els.studyEmpty.querySelector("h3").textContent = cards.length ? (mode === "errors" ? "¡Todo al día!" : "No hay tarjetas para estudiar") : "Tu primera tarjeta te espera";
      els.studyEmpty.querySelector("p").textContent = cards.length ? (mode === "errors" ? "No has fallado ninguna tarjeta en esta sesión." : "Añade una tarjeta para empezar.") : "Añade una palabra o frase para empezar a practicar.";
      els.studyEmpty.querySelector("button").hidden = cards.length > 0;
      updateStats();
      return;
    }
    if (index >= deck.length) index = 0;
    const card = deck[index];
    els.cardPosition.textContent = `Tarjeta ${index + 1}`;
    els.promptText.textContent = card.spanish;
    els.answerInput.value = "";
    els.answerInput.disabled = false;
    els.checkBtn.disabled = false;
    els.checkBtn.hidden = false;
    els.checkBtn.innerHTML = 'Comprobar <span>↵</span>';
    els.feedback.hidden = true;
    els.feedback.className = "feedback";
    els.nextBtn.hidden = true;
    checked = false;
    updateStats();
  }
  function validateAnswer(event) {
    event?.preventDefault();
    if (checked || !deck[index]) return;
    const answer = els.answerInput.value.trim();
    if (!answer) { els.answerInput.focus(); return; }
    checked = true;
    const card = deck[index];
    const correct = normalize(answer) === normalize(card.translation);
    if (correct) {
      session.correct++;
      // Al acertar una tarjeta en el repaso, deja de figurar como error pendiente.
      if (els.studyMode.value === "errors") { session.missedIds.delete(card.id); persistMissedIds(); }
    } else {
      session.wrong++;
      session.missedIds.add(card.id);
      persistMissedIds();
    }
    els.feedback.hidden = false;
    els.feedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
    els.feedback.innerHTML = correct
      ? "<strong>¡Correcto! ✨</strong> Buena memoria. Sigue así."
      : `<strong>No del todo.</strong> La respuesta correcta es: <b>${escapeHTML(card.translation)}</b>`;
    els.answerInput.disabled = true;
    els.checkBtn.hidden = true;
    els.nextBtn.hidden = false;
    els.nextBtn.textContent = index === deck.length - 1 ? "Terminar sesión ✓" : "Siguiente tarjeta →";
    updateStats();
  }
  function nextCard() {
    if (!checked) return;
    if (index >= deck.length - 1) {
      showToast("Sesión completada. ¡Buen trabajo!");
      startDeck(false);
      return;
    }
    index++;
    renderStudy();
    els.answerInput.focus({ preventScroll: true });
  }
  function renderList() {
    const query = normalize(els.searchInput.value);
    const filtered = cards.filter(c => normalize(c.spanish).includes(query) || normalize(c.translation).includes(query));
    els.cardList.innerHTML = "";
    els.cardsEmpty.hidden = cards.length > 0;
    if (!cards.length) {
      els.cardsEmpty.querySelector("h3").textContent = "Aún no hay tarjetas";
      els.cardsEmpty.querySelector("p").textContent = "Guarda vocabulario que quieras recordar.";
    } else if (!filtered.length) {
      els.cardsEmpty.hidden = false;
      els.cardsEmpty.querySelector("h3").textContent = "No hay coincidencias";
      els.cardsEmpty.querySelector("p").textContent = "Prueba con otra palabra o traducción.";
    }
    filtered.forEach(card => {
      const row = document.createElement("article");
      row.className = "saved-card";
      const main = document.createElement("div");
      main.className = "saved-card-main";
      const source = document.createElement("strong"); source.textContent = card.spanish;
      const target = document.createElement("span"); target.textContent = card.translation;
      main.append(source, target);
      const actions = document.createElement("div"); actions.className = "saved-card-actions";
      const edit = document.createElement("button"); edit.className = "small-action"; edit.type = "button"; edit.title = "Editar tarjeta"; edit.setAttribute("aria-label", `Editar ${card.spanish}`); edit.textContent = "✎";
      edit.addEventListener("click", () => editCard(card.id));
      const del = document.createElement("button"); del.className = "small-action delete"; del.type = "button"; del.title = "Eliminar tarjeta"; del.setAttribute("aria-label", `Eliminar ${card.spanish}`); del.textContent = "×";
      del.addEventListener("click", () => deleteCard(card.id));
      actions.append(edit, del); row.append(main, actions); els.cardList.append(row);
    });
  }
  function editCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    els.editId.value = card.id;
    els.spanishInput.value = card.spanish;
    els.translationInput.value = card.translation;
    els.formTitle.textContent = "Editar tarjeta";
    els.saveCardBtn.innerHTML = 'Guardar cambios <span>→</span>';
    els.cancelEditBtn.hidden = false;
    switchView("add");
  }
  function resetEditor() {
    els.cardForm.reset();
    els.editId.value = "";
    els.formTitle.textContent = "Nueva tarjeta";
    els.saveCardBtn.innerHTML = 'Guardar tarjeta <span>→</span>';
    els.cancelEditBtn.hidden = true;
  }
  function deleteCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card || !confirm(`¿Eliminar la tarjeta «${card.spanish}»? Esta acción no se puede deshacer.`)) return;
    cards = cards.filter(c => c.id !== id);
    session.missedIds.delete(id);
    persistMissedIds();
    persist(); renderList(); startDeck(false); updateStats();
    showToast("Tarjeta eliminada.");
  }
  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function exportJSON() {
    const payload = { app: "Lingua", version: 1, exportedAt: new Date().toISOString(), cards };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `lingua-tarjetas-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("Exportación preparada.");
  }
  async function importJSON(file) {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const imported = Array.isArray(raw) ? raw : raw.cards;
      if (!Array.isArray(imported)) throw new Error("El JSON no contiene una lista de tarjetas.");
      const clean = imported.map(item => {
        if (!item || typeof item.spanish !== "string" || typeof item.translation !== "string" || !item.spanish.trim() || !item.translation.trim()) return null;
        return { id: makeId(), spanish: item.spanish.trim().slice(0, 500), translation: item.translation.trim().slice(0, 500) };
      }).filter(Boolean);
      if (!clean.length) throw new Error("No se encontraron tarjetas válidas.");
      const replace = confirm(`Se han encontrado ${clean.length} tarjetas válidas.\nAceptar = reemplazar las actuales.\nCancelar = añadirlas a las actuales.`);
      cards = replace ? clean : [...cards, ...clean];
      persist(); newSession(); startDeck(false); renderList();
      showToast(`${clean.length} tarjetas importadas.`);
    } catch (error) {
      showToast(error instanceof SyntaxError ? "El archivo no es un JSON válido." : (error.message || "No se pudo importar el archivo."));
    } finally { els.importFile.value = ""; }
  }

  const exportExcelBtn = $("#exportExcelBtn");
  if (exportExcelBtn) exportExcelBtn.addEventListener("click", () => {
    if (!window.XLSX) { showToast("El lector de Excel necesita conexión a internet."); return; }
    const rows = [["Español", "Alemán"], ...cards.map(card => [card.spanish, card.translation])];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 34 }, { wch: 34 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Vocabulario A1");
    XLSX.writeFile(workbook, `vocabulario_aleman_actualizado_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast("Excel actualizado preparado para descargar.");
  });

  els.themeToggle.addEventListener("click", () => setTheme(theme === "dark" ? "light" : "dark"));
  els.exportBtn.addEventListener("click", exportJSON);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", () => importJSON(els.importFile.files[0]));
  els.tabs.forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.view)));
  $$("[data-go]").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.go)));
  els.shuffleBtn.addEventListener("click", () => { startDeck(true); showToast("Tarjetas barajadas."); });
  els.studyMode.addEventListener("change", () => startDeck(false));
  els.answerForm.addEventListener("submit", validateAnswer);
  els.nextBtn.addEventListener("click", nextCard);
  els.searchInput.addEventListener("input", renderList);
  els.cancelEditBtn.addEventListener("click", () => { resetEditor(); switchView("cards"); });
  els.cardForm.addEventListener("submit", event => {
    event.preventDefault();
    const spanish = els.spanishInput.value.trim();
    const translation = els.translationInput.value.trim();
    if (!spanish || !translation) return;
    const editingId = els.editId.value;
    if (editingId) {
      const card = cards.find(c => c.id === editingId);
      if (card) { card.spanish = spanish; card.translation = translation; }
      showToast("Tarjeta actualizada.");
    } else {
      cards.unshift({ id: makeId(), spanish, translation });
      showToast("Tarjeta guardada.");
    }
    persist(); resetEditor(); newSession(); startDeck(false); renderList(); switchView("cards");
  });

  // La tecla Enter valida el formulario; después de corregir, Enter pasa a la siguiente.
  els.answerInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && checked) { event.preventDefault(); nextCard(); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Enter" && !els.quizCard.hidden && checked && document.activeElement !== els.answerInput && !els.nextBtn.hidden) nextCard();
  });

  setTheme(theme);
  updateStats();
  startDeck(false);
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => console.warn("Service Worker no disponible en este contexto.")));
  }
})();
