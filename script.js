const snippetForm = document.getElementById("snippetForm");
const snippetTitle = document.getElementById("snippetTitle");
const snippetLanguage = document.getElementById("snippetLanguage");
const snippetTags = document.getElementById("snippetTags");
const snippetCode = document.getElementById("snippetCode");

const snippetList = document.getElementById("snippetList");
const emptyMessage = document.getElementById("emptyMessage");

const searchInput = document.getElementById("searchInput");
const filterLanguage = document.getElementById("filterLanguage");
const favoritesBtn = document.getElementById("favoritesBtn");

const themeBtn = document.getElementById("themeBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

const totalSnippets = document.getElementById("totalSnippets");
const totalFavorites = document.getElementById("totalFavorites");
const totalLanguages = document.getElementById("totalLanguages");

const formTitle = document.getElementById("formTitle");
const saveBtnText = document.getElementById("saveBtnText");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let snippets = JSON.parse(localStorage.getItem("devSnippets")) || [];
let editingId = null;
let showFavoritesOnly = false;

const savedTheme = localStorage.getItem("snippetTheme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}

function saveSnippets() {
  localStorage.setItem("devSnippets", JSON.stringify(snippets));
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function formatLanguage(language) {
  return language === "cpp" ? "C++" : language.toUpperCase();
}

function getFilteredSnippets() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedLanguage = filterLanguage.value;

  return snippets.filter((snippet) => {
    const matchesSearch =
      snippet.title.toLowerCase().includes(searchValue) ||
      snippet.code.toLowerCase().includes(searchValue) ||
      snippet.tags.join(" ").toLowerCase().includes(searchValue);

    const matchesLanguage =
      selectedLanguage === "all" ||
      snippet.language === selectedLanguage;

    const matchesFavorites =
      !showFavoritesOnly || snippet.favorite === true;

    return matchesSearch && matchesLanguage && matchesFavorites;
  });
}

function updateStats() {
  const languages = new Set(snippets.map((snippet) => snippet.language));

  totalSnippets.textContent = snippets.length;
  totalFavorites.textContent = snippets.filter(
    (snippet) => snippet.favorite
  ).length;
  totalLanguages.textContent = languages.size;
}

function renderSnippets() {
  const filteredSnippets = getFilteredSnippets();

  snippetList.innerHTML = "";
  emptyMessage.style.display =
    filteredSnippets.length === 0 ? "block" : "none";

  filteredSnippets.forEach((snippet) => {
    const card = document.createElement("article");
    card.className = "snippet-card";

    const tagsHTML = snippet.tags.length
      ? snippet.tags
          .map((tag) => `<span class="tag">#${escapeHTML(tag)}</span>`)
          .join("")
      : `<span class="tag">No tags</span>`;

    const safeCode = escapeHTML(snippet.code);

    card.innerHTML = `
      <div class="snippet-header">
        <div>
          <h3>${escapeHTML(snippet.title)}</h3>
          <span class="language-badge">
            ${formatLanguage(snippet.language)}
          </span>
        </div>

        <button
          class="favorite-btn"
          data-action="favorite"
          data-id="${snippet.id}"
          title="Favorite"
        >
          ${snippet.favorite ? "⭐" : "☆"}
        </button>
      </div>

      <div class="code-container">
        <pre><code class="language-${snippet.language}">${safeCode}</code></pre>
      </div>

      <div class="snippet-footer">
        <div class="tags">${tagsHTML}</div>

        <div class="actions">
          <button
            class="copy-btn"
            data-action="copy"
            data-id="${snippet.id}"
          >
            Copy
          </button>

          <button
            class="edit-btn"
            data-action="edit"
            data-id="${snippet.id}"
          >
            Edit
          </button>

          <button
            class="delete-btn"
            data-action="delete"
            data-id="${snippet.id}"
          >
            Delete
          </button>
        </div>
      </div>
    `;

    snippetList.appendChild(card);
  });

  Prism.highlightAll();
  updateStats();
}

function resetForm() {
  snippetForm.reset();
  editingId = null;
  formTitle.textContent = "Add New Snippet";
  saveBtnText.textContent = "Save Snippet";
  cancelEditBtn.classList.add("hidden");
}

function editSnippet(id) {
  const snippet = snippets.find((item) => item.id === id);

  if (!snippet) return;

  editingId = id;
  snippetTitle.value = snippet.title;
  snippetLanguage.value = snippet.language;
  snippetTags.value = snippet.tags.join(", ");
  snippetCode.value = snippet.code;

  formTitle.textContent = "Edit Snippet";
  saveBtnText.textContent = "Update Snippet";
  cancelEditBtn.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteSnippet(id) {
  const confirmed = confirm("Delete this snippet?");

  if (!confirmed) return;

  snippets = snippets.filter((snippet) => snippet.id !== id);

  saveSnippets();
  renderSnippets();
}

function toggleFavorite(id) {
  const snippet = snippets.find((item) => item.id === id);

  if (!snippet) return;

  snippet.favorite = !snippet.favorite;

  saveSnippets();
  renderSnippets();
}

async function copySnippet(id) {
  const snippet = snippets.find((item) => item.id === id);

  if (!snippet) return;

  try {
    await navigator.clipboard.writeText(snippet.code);
    alert("Code copied to clipboard!");
  } catch {
    alert("Unable to copy the code.");
  }
}

snippetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = snippetTitle.value.trim();
  const language = snippetLanguage.value;
  const code = snippetCode.value.trim();

  const tags = snippetTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!title || !language || !code) {
    alert("Please complete all required fields.");
    return;
  }

  if (editingId) {
    const snippet = snippets.find((item) => item.id === editingId);

    if (snippet) {
      snippet.title = title;
      snippet.language = language;
      snippet.tags = tags;
      snippet.code = code;
    }
  } else {
    snippets.unshift({
      id: Date.now(),
      title,
      language,
      tags,
      code,
      favorite: false,
      createdAt: new Date().toISOString()
    });
  }

  saveSnippets();
  resetForm();
  renderSnippets();
});

snippetList.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  if (action === "favorite") toggleFavorite(id);
  if (action === "copy") copySnippet(id);
  if (action === "edit") editSnippet(id);
  if (action === "delete") deleteSnippet(id);
});

searchInput.addEventListener("input", renderSnippets);
filterLanguage.addEventListener("change", renderSnippets);

favoritesBtn.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  favoritesBtn.classList.toggle("active", showFavoritesOnly);
  renderSnippets();
});

cancelEditBtn.addEventListener("click", resetForm);

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  localStorage.setItem("snippetTheme", isDark ? "dark" : "light");
  themeBtn.textContent = isDark ? "☀️" : "🌙";
});

exportBtn.addEventListener("click", () => {
  if (snippets.length === 0) {
    alert("There are no snippets to export.");
    return;
  }

  const data = JSON.stringify(snippets, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "dev-snippets.json";
  link.click();

  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const importedSnippets = JSON.parse(reader.result);

      if (!Array.isArray(importedSnippets)) {
        throw new Error("Invalid format");
      }

      const validSnippets = importedSnippets.filter(
        (snippet) =>
          snippet.title &&
          snippet.language &&
          snippet.code
      );

      snippets = [...validSnippets, ...snippets];

      saveSnippets();
      renderSnippets();

      alert(`${validSnippets.length} snippets imported successfully.`);
    } catch {
      alert("Invalid JSON file.");
    }

    importInput.value = "";
  };

  reader.readAsText(file);
});

renderSnippets();