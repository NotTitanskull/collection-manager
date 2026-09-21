// Vue is loaded by the CDN script in index.html. No bundler is required.
// Page labels and initial sample data.
const pageDetails = {
  collection: {
    title: "My Collection",
    description: "Browse and manage every card in your collection.",
  },
  trade: {
    title: "For Trade",
    description: "Compare what you have with the cards you want.",
  },
};

const manageExamples = {
  dogmeat: {
    name: "Dogmeat, Ever Loyal",
    type: "Legendary Creature — Dog",
    printing: "Fallout — PIP #2",
    image:
      "https://cards.scryfall.io/normal/front/8/6/86b45e3e-8460-4678-87d1-d74479936c83.jpg?1783912422",
    condition: "Near Mint",
    quantity: 1,
    foil: true,
    favorite: true,
    trade: true,
    scryfallId: "86b45e3e-8460-4678-87d1-d74479936c83",
    price: 18,
  },
  lightning: {
    name: "Lightning Bolt",
    type: "Instant",
    printing: "Double Masters 2022 — 2X2 #117",
    image:
      "https://cards.scryfall.io/normal/front/f/2/f29ba16f-c8fb-42fe-aabf-87089cb214a7.jpg?1783921885",
    condition: "Lightly Played",
    quantity: 4,
    foil: false,
    favorite: false,
    trade: false,
    scryfallId: "f29ba16f-c8fb-42fe-aabf-87089cb214a7",
    price: 6.5,
  },
  sol: {
    name: "Sol Ring",
    type: "Artifact",
    printing: "Commander Masters — CMM #410",
    image:
      "https://cards.scryfall.io/normal/front/4/6/46ca0b66-a000-4483-b916-f5b89e710244.jpg?1783915591",
    condition: "Near Mint",
    quantity: 2,
    foil: false,
    favorite: true,
    trade: false,
    scryfallId: "46ca0b66-a000-4483-b916-f5b89e710244",
    price: 11.5,
  },
};

// Initial binders for a new collection.
const binderExamples = [
  {
    id: "favorites",
    name: "Favorites",
    description:
      "Your favorite cards, gathered automatically without changing where they are stored.",
    color: "purple",
    automatic: true,
    locked: true,
  },
  {
    id: "trade",
    name: "Trade Binder",
    description: "Cards set aside for trades at the next game night.",
    color: "blue",
    locked: true,
  },
  {
    id: "showcase",
    name: "Showcase Binder",
    description: "A home for favorite artwork and special printings.",
    color: "purple",
  },
  {
    id: "archive",
    name: "Archive Binder",
    description: "Extra cards to keep organized for future decks.",
    color: "green",
  },
];

const emptyAddDraft = () => ({
  name: "",
  printing: "",
  printingId: "",
  copies: [{ condition: "Near Mint", quantity: 1 }],
  binderIds: [],
  foil: false,
  favorite: false,
  trade: false,
  scryfallId: "",
  image: "",
  type: "",
  price: null,
});

const loadSavedBinders = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem("mtg-binders") || "null");
    const binders = Array.isArray(saved) && saved.length ? saved : binderExamples;
    return binders.map((binder) => ({
      ...binder,
      locked: binder.id === "favorites" || binder.id === "trade" || binder.locked === true,
    }));
  } catch {
    return binderExamples.map((binder) => ({ ...binder }));
  }
};

const sampleCollection = () =>
  Object.entries(manageExamples).map(([id, card]) => ({
    id,
    ...card,
    binderIds: [],
  }));

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const loadSavedCollection = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem("mtg-collection") || "null");
    return Array.isArray(saved)
      ? saved.map(({ location, ...card }) => ({
          ...card,
          binderIds: Array.isArray(card.binderIds)
            ? card.binderIds
            : card.binderId
              ? [card.binderId]
              : location === "Trade Binder"
                ? ["trade"]
                : [],
        }))
      : sampleCollection();
  } catch {
    return sampleCollection();
  }
};

const conditions = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];
const emptyFilters = () => ({
  condition: "",
  set: "",
  binder: "",
  foil: false,
  favorite: false,
  trade: false,
});
const loadWantedCards = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("mtg-wanted") || "null");
    if (Array.isArray(saved)) return saved;
  } catch {
    /* Use samples if no readable saved trade exists. */
  }
  return ["lightning", "sol"].map((id) => ({
    ...manageExamples[id],
    id: `wanted-${id}`,
    quantity: 1,
    binderIds: [],
  }));
};

const getRouteState = (hash, binders) => {
  const [section, binderId] = hash.replace(/^#/, "").split("/");
  const view =
    section === "binders"
      ? "binders"
      : Object.hasOwn(pageDetails, section)
        ? section
        : "collection";
  return {
    view,
    selectedBinder:
      view === "binders" ? binders.find((binder) => binder.id === binderId) || null : null,
  };
};

Vue.createApp({
  components: {
    CardSearch,
    BinderPicker,
  },
  data() {
    const collectionCards = loadSavedCollection();
    const binders = loadSavedBinders();
    const route = getRouteState(window.location.hash, binders);
    return {
      view: route.view,
      pageDetails,
      binderColors: ["blue", "purple", "green"],
      storageFailures: {},
      conditions,
      sortOptions: [
        { value: "name-asc", label: "Name: A–Z" },
        { value: "name-desc", label: "Name: Z–A" },
        { value: "quantity", label: "Quantity" },
      ],
      searchQuery: "",
      sortOrder: "name-asc",
      filters: emptyFilters(),
      filterDraft: emptyFilters(),
      pendingBinderRemoval: null,
      manageMode: "collection",
      openingManagedCard: false,
      manageError: "",
      binders,
      binderIntro: "Find a home for every card. Browse your binders and see what is inside.",
      selectedBinder: route.selectedBinder,
      collectionCards,
      binderDraft: { name: "", description: "", color: "blue" },
      editingBinder: false,
      binderNotice: "",
      managedCard: { ...manageExamples.dogmeat },
      confirmingRemoval: false,
      isLookingUp: false,
      suggestions: [],
      searchTimer: null,
      searchRequest: 0,
      searchController: null,
      skipSuggestionSearch: false,
      addNotice: "",
      addError: false,
      addDraft: emptyAddDraft(),
      printings: [],
      addMode: "collection",
      tradeWanted: loadWantedCards(),
    };
  },
  computed: {
    storageError() {
      return Object.keys(this.storageFailures).length
        ? "Changes could not be saved in this browser. Keep this page open and retry saving before refreshing."
        : "";
    },
    addFoilLocked() {
      return (
        !this.addDraft.printingId ||
        !this.addDraft.finishes ||
        !(this.addDraft.finishes.includes("foil") && this.addDraft.finishes.includes("nonfoil"))
      );
    },
    addCopiesValid() {
      return (
        this.addDraft.copies.length > 0 &&
        this.addDraft.copies.every(
          (copy) =>
            this.conditions.includes(copy.condition) &&
            Number.isInteger(Number(copy.quantity)) &&
            Number(copy.quantity) > 0,
        )
      );
    },
    canAddCard() {
      return (
        !this.isLookingUp &&
        this.addCopiesValid &&
        this.printings.some(
          (printing) =>
            printing.id === this.addDraft.printingId &&
            printing.id === this.addDraft.scryfallId &&
            printing.name === this.addDraft.name,
        )
      );
    },
    manageFoilLocked() {
      return (
        !this.managedCard.finishes ||
        !(
          this.managedCard.finishes.includes("foil") &&
          this.managedCard.finishes.includes("nonfoil")
        )
      );
    },
    tradeDifferenceLabel() {
      return this.tradeDifference === null
        ? "A card is missing a price"
        : this.tradeDifference === 0
          ? "Both sides have equal estimated value"
          : this.tradeDifference > 0
            ? "more on your side"
            : "more on their side";
    },
    manageTitle() {
      return this.confirmingRemoval
        ? "Remove Card?"
        : this.manageMode === "wanted"
          ? "Edit Wanted Card"
          : "Manage Card";
    },
    removalDescription() {
      return this.manageMode === "wanted" ? "from your wanted cards?" : "from your collection?";
    },
    availableSets() {
      return [...new Set(this.collectionCards.map((card) => this.cardSet(card)))]
        .filter(Boolean)
        .sort();
    },
    visibleCards() {
      const query = this.searchQuery.trim().toLowerCase();
      const f = this.filters;
      const binderCardIds = f.binder
        ? new Set((this.cardsByBinder.get(f.binder) || []).map((card) => card.id))
        : null;
      const cards = this.collectionCards.filter(
        (card) =>
          (!query || `${card.name} ${card.printing} ${card.type}`.toLowerCase().includes(query)) &&
          (!f.condition || card.condition === f.condition) &&
          (!f.set || this.cardSet(card) === f.set) &&
          (!binderCardIds || binderCardIds.has(card.id)) &&
          (!f.foil || card.foil) &&
          (!f.favorite || card.favorite) &&
          (!f.trade || card.trade),
      );
      return cards.sort((a, b) =>
        this.sortOrder === "quantity"
          ? b.quantity - a.quantity || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name) * (this.sortOrder === "name-desc" ? -1 : 1),
      );
    },
    customBinders() {
      return this.binders.filter((binder) => !binder.locked);
    },
    cardsByBinder() {
      // Cache membership once per data change, rather than scanning for every row.
      const groups = new Map(this.binders.map((binder) => [binder.id, []]));
      for (const card of this.collectionCards) {
        const ids = new Set(card.binderIds || []);
        ids.delete("favorites");
        ids.delete("trade");
        if (card.favorite) ids.add("favorites");
        if (card.trade) ids.add("trade");
        for (const id of ids) groups.get(id)?.push(card);
      }
      return groups;
    },
    tradeOfferingCards() {
      return this.collectionCards.filter((card) => card.trade);
    },
    tradeTotals() {
      const total = (cards) =>
        cards.some((card) => !Number.isFinite(card.price))
          ? null
          : cards.reduce((sum, card) => sum + card.price * card.quantity, 0);
      return {
        offering: total(this.tradeOfferingCards),
        wanted: total(this.tradeWanted),
      };
    },
    tradeDifference() {
      return this.tradeTotals.offering === null || this.tradeTotals.wanted === null
        ? null
        : this.tradeTotals.offering - this.tradeTotals.wanted;
    },
    tradeStatus() {
      if (this.tradeDifference === null) return { label: "Incomplete estimate", tone: "close" };
      const difference = Math.abs(this.tradeDifference);
      if (!this.tradeOfferingCards.length || !this.tradeWanted.length)
        return { label: "Add cards to both sides", tone: "close" };
      if (difference < 1) return { label: "Similar estimated value", tone: "fair" };
      if (difference < 5) return { label: "Close trade", tone: "close" };
      return { label: "Value gap", tone: "gap" };
    },
  },
  watch: {
    "addDraft.name": {
      flush: "sync",
      handler(name) {
        if (this.skipSuggestionSearch) return;
        this.cancelCardSearch();
        this.clearCardSelection();
        this.addNotice = "";
        this.addError = false;
        if (name.trim().length < 2) return;
        this.searchTimer = setTimeout(() => this.searchSuggestions(name.trim()), 250);
      },
    },
    "managedCard.foil": {
      flush: "sync",
      handler(foil, oldFoil) {
        if (!this.openingManagedCard && foil !== oldFoil) this.managedCard.price = null;
      },
    },
    "addDraft.foil"() {
      if (this.addDraft.printingId) this.selectPrinting();
    },
  },
  mounted() {
    this.syncPage();
    window.addEventListener("hashchange", this.syncPage);
    this.$refs.addCardModal.addEventListener("hide.bs.modal", this.cancelCardSearch);
  },
  beforeUnmount() {
    window.removeEventListener("hashchange", this.syncPage);
    this.$refs.addCardModal?.removeEventListener("hide.bs.modal", this.cancelCardSearch);
    this.cancelCardSearch();
  },
  methods: {
    binderCards(binder) {
      return this.cardsByBinder.get(binder?.id) || [];
    },
    binderNames(binderIds = []) {
      return binderIds
        .map((id) => this.binders.find((binder) => binder.id === id)?.name)
        .filter(Boolean)
        .join(", ") || "No binder";
    },
    saveLocal(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        delete this.storageFailures[key];
        return true;
      } catch {
        this.storageFailures[key] = true;
        return false;
      }
    },
    retryStorage() {
      this.persistCollection();
      this.persistBinders();
      this.persistWanted();
    },
    cardValue(card) {
      return Number.isFinite(card.price) ? card.price * card.quantity : null;
    },
    cardSet(card) {
      return card.setName || card.printing?.split(" — ")[0] || "";
    },
    openFilters() {
      this.filterDraft = { ...this.filters };
    },
    applyFilters() {
      this.filters = { ...this.filterDraft };
    },
    clearFilters() {
      this.filters = emptyFilters();
      this.filterDraft = emptyFilters();
      this.searchQuery = "";
    },
    persistWanted() {
      return this.saveLocal("mtg-wanted", this.tradeWanted);
    },
    requestBinderRemoval(binder) {
      if (binder.locked) return;
      this.pendingBinderRemoval = binder;
    },

    cancelCardSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
      ++this.searchRequest;
      this.searchController?.abort();
      this.searchController = null;
      this.isLookingUp = false;
      this.suggestions = [];
    },
    clearCardSelection() {
      this.printings = [];
      Object.assign(this.addDraft, {
        scryfallId: "",
        printingId: "",
        finishes: [],
        printing: "",
        image: "",
        type: "",
        price: null,
      });
    },
    // Hash links support navigation, refresh, and the browser Back button.
    syncPage() {
      // Preserve old Favorites links by sending them to the built-in binder.
      if (window.location.hash === "#favorites") {
        window.history.replaceState(null, "", "#binders/favorites");
      }
      const route = getRouteState(window.location.hash, this.binders);
      this.view = route.view;
      this.selectedBinder = route.selectedBinder;
      this.binderNotice = "";
      window.scrollTo(0, 0);
    },
    openBinderForm(binder = null) {
      this.editingBinder = Boolean(binder);
      this.binderDraft = binder
        ? { name: binder.name, description: binder.description, color: binder.color }
        : { name: "", description: "", color: "blue" };
      this.binderNotice = "";
    },
    saveBinder() {
      const name = this.binderDraft.name.trim();
      if (!name) return;
      const binder = {
        id: this.editingBinder
          ? this.selectedBinder.id
          : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        name,
        description: this.binderDraft.description.trim(),
        color: this.binderDraft.color,
        locked: this.editingBinder ? Boolean(this.selectedBinder.locked) : false,
        automatic: false,
      };
      if (this.editingBinder) {
        const index = this.binders.findIndex((entry) => entry.id === binder.id);
        this.binders.splice(index, 1, binder);
      } else {
        this.binders.push(binder);
      }
      if (this.editingBinder) this.selectedBinder = binder;
      this.persistBinders();
      this.binderNotice = this.storageError ? "" : `${binder.name} saved.`;
      bootstrap.Modal.getInstance(this.$refs.binderModal)?.hide();
    },
    removeBinder() {
      const binder = this.pendingBinderRemoval;
      if (!binder || binder.locked) return;
      this.binders = this.binders.filter((entry) => entry.id !== binder.id);
      this.collectionCards = this.collectionCards.map((card) =>
        card.binderIds?.includes(binder.id)
          ? { ...card, binderIds: card.binderIds.filter((id) => id !== binder.id) }
          : card,
      );
      this.persistCollection();
      this.persistBinders();
      this.pendingBinderRemoval = null;
      window.location.hash = "#binders";
    },
    openManage(card, mode = "collection") {
      this.manageMode = mode;
      this.manageError = "";
      const existing = (mode === "wanted" ? this.tradeWanted : this.collectionCards).find(
        (entry) => entry.id === card,
      );
      if (!existing) return;
      this.openingManagedCard = true;
      this.managedCard = {
        ...existing,
        binderIds: Array.isArray(existing.binderIds) ? [...existing.binderIds] : [],
      };
      this.openingManagedCard = false;
      this.confirmingRemoval = false;
    },
    persistCollection() {
      return this.saveLocal("mtg-collection", this.collectionCards);
    },
    persistBinders() {
      return this.saveLocal("mtg-binders", this.binders);
    },
    resetAddDraft() {
      this.cancelCardSearch();
      this.addDraft = emptyAddDraft();
      this.printings = [];
      this.addNotice = "";
      this.addError = false;
      this.suggestions = [];
    },
    openAddCard(mode) {
      this.addMode = mode;
      this.resetAddDraft();
    },
    async searchSuggestions(name) {
      this.cancelCardSearch();
      const request = this.searchRequest;
      const controller = new AbortController();
      this.searchController = controller;
      this.isLookingUp = true;
      this.addError = false;
      this.addNotice = "";
      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(name)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Unable to search Scryfall.");
        const result = await response.json();
        if (request !== this.searchRequest) return;
        this.suggestions = result.data.slice(0, 8);
      } catch (error) {
        if (request === this.searchRequest && error.name !== "AbortError") {
          this.suggestions = [];
          this.addError = true;
          this.addNotice = error.message;
        }
      } finally {
        if (request === this.searchRequest) this.isLookingUp = false;
      }
    },
    async selectSuggestion(name) {
      this.cancelCardSearch();
      this.skipSuggestionSearch = true;
      this.suggestions = [];
      this.addDraft.name = name;
      this.skipSuggestionSearch = false;
      await this.lookupCard(name);
    },
    async lookupCard(name = this.addDraft.name) {
      this.cancelCardSearch();
      this.clearCardSelection();
      const request = this.searchRequest;
      const controller = new AbortController();
      this.searchController = controller;
      this.isLookingUp = true;
      this.addNotice = "";
      this.addError = false;
      try {
        const response = await this.fetchWithTimeout(
          `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
          controller.signal,
        );
        if (!response.ok) throw new Error("Scryfall could not find that card.");
        const card = await response.json();
        if (request !== this.searchRequest) return;
        this.printings = [card];
        this.applyPrinting(card);
        this.suggestions = [];
        this.addNotice = `Found ${card.name}. Loading printings…`;
        try {
          const printingsResponse = await this.fetchWithTimeout(
            `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${card.name}"`)}&unique=prints&order=released`,
            controller.signal,
          );
          if (printingsResponse.ok) {
            const printingsResult = await printingsResponse.json();
            if (request === this.searchRequest) {
              this.printings = printingsResult.data;
              if (!this.printings.some((printing) => printing.id === card.id)) {
                this.printings.unshift(card);
              }
              this.addNotice = `${card.name} · ${this.printings.length} printings available`;
            }
          }
        } catch (error) {
          if (error.name !== "AbortError" && request === this.searchRequest) {
            this.addNotice = `Found ${card.name}. Other printings are unavailable right now.`;
          }
        }
      } catch (error) {
        if (request === this.searchRequest && error.name !== "AbortError") {
          this.addError = true;
          this.addNotice = error.message;
        }
      } finally {
        if (request === this.searchRequest) this.isLookingUp = false;
      }
    },
    async fetchWithTimeout(url, signal, timeout = 10000) {
      const timeoutController = new AbortController();
      const abort = () => timeoutController.abort();
      const timer = setTimeout(abort, timeout);
      signal?.addEventListener("abort", abort, { once: true });
      try {
        return await fetch(url, { signal: timeoutController.signal });
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
      }
    },
    formatPrinting(card) {
      return `${card.set_name} — ${card.set.toUpperCase()} #${card.collector_number}`;
    },
    applyPrinting(card) {
      const finishes = card.finishes || [
        ...(card.nonfoil ? ["nonfoil"] : []),
        ...(card.foil ? ["foil"] : []),
      ];
      const foil =
        finishes.includes("foil") && (!finishes.includes("nonfoil") || this.addDraft.foil);
      const usd = Number.parseFloat(foil ? card.prices?.usd_foil : card.prices?.usd);
      this.skipSuggestionSearch = true;
      this.addDraft = {
        ...this.addDraft,
        name: card.name,
        finishes,
        foil,
        printing: this.formatPrinting(card),
        setName: card.set_name,
        printingId: card.id,
        scryfallId: card.id,
        image: card.image_uris?.normal || card.image_uris?.small || "",
        type: card.type_line,
        price: Number.isFinite(usd) ? usd : null,
      };
      this.skipSuggestionSearch = false;
    },
    selectPrinting() {
      const printing = this.printings.find((card) => card.id === this.addDraft.printingId);
      if (printing) this.applyPrinting(printing);
    },
    preventImplicitAddSubmit(event) {
      // Enter on an input must not submit while the user is editing options.
      if (event.target.tagName === "INPUT") event.preventDefault();
    },
    addCard() {
      if (!this.canAddCard) return;
      // Only persist card data, not the form's group list or selection field.
      const { copies, printingId, ...cardDetails } = this.addDraft;
      const cards = copies.map((copy) =>
        this.normalizeCardMembership({
          ...cardDetails,
          id: crypto.randomUUID(),
          condition: copy.condition,
          quantity: Number(copy.quantity),
        }),
      );
      if (this.addMode === "wanted") {
        this.tradeWanted.push(...cards);
        this.persistWanted();
      } else {
        this.collectionCards.push(...cards);
        this.persistCollection();
      }
      this.addNotice = "";
      bootstrap.Modal.getInstance(this.$refs.addCardModal)?.hide();
    },
    addCopyRow() {
      this.addDraft.copies.push({ condition: "Near Mint", quantity: 1 });
    },
    removeCopyRow(index) {
      if (this.addDraft.copies.length === 1) return;
      this.addDraft.copies.splice(index, 1);
    },
    saveManagedCard() {
      const quantity = Number(this.managedCard.quantity);
      const rawPrice = this.managedCard.price;
      const price = rawPrice === "" || rawPrice == null ? null : Number(rawPrice);
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        (price !== null && (!Number.isFinite(price) || price < 0))
      ) {
        this.manageError =
          "Enter a whole quantity of at least 1 and a non-negative estimated price.";
        return;
      }
      const cards = this.manageMode === "wanted" ? this.tradeWanted : this.collectionCards;
      const index = cards.findIndex((card) => card.id === this.managedCard.id);
      if (index < 0) return;
      cards.splice(index, 1, {
        ...this.normalizeCardMembership(this.managedCard),
        quantity,
        price,
      });
      if (this.manageMode === "wanted") this.persistWanted();
      else this.persistCollection();
      bootstrap.Modal.getInstance(this.$refs.manageCardModal)?.hide();
    },
    removeManagedCard() {
      const removedId = this.managedCard.id;
      if (this.manageMode === "wanted") {
        this.tradeWanted = this.tradeWanted.filter((card) => card.id !== removedId);
        this.persistWanted();
      } else {
        this.collectionCards = this.collectionCards.filter((card) => card.id !== removedId);
        this.persistCollection();
      }
      this.confirmingRemoval = false;
    },
    normalizeCardMembership(card) {
      const binderIds = new Set(Array.isArray(card.binderIds) ? card.binderIds : []);
      if (card.favorite) binderIds.add("favorites");
      else binderIds.delete("favorites");
      if (card.trade) binderIds.add("trade");
      else binderIds.delete("trade");
      return { ...card, binderIds: [...binderIds] };
    },
    formatPrice(value) {
      return Number.isFinite(value) ? currencyFormatter.format(value) : "Unavailable";
    },
    removeTradeCard(side, cardId) {
      if (side === "offering") {
        const card = this.collectionCards.find((entry) => entry.id === cardId);
        if (!card) return;
        card.trade = false;
        card.binderIds = (card.binderIds || []).filter((id) => id !== "trade");
        this.persistCollection();
        return;
      }
      this.tradeWanted = this.tradeWanted.filter((card) => card.id !== cardId);
      this.persistWanted();
    },
    async showRemovalConfirmation(show) {
      this.confirmingRemoval = show;
      await this.$nextTick();
      const button = show ? this.$refs.keepCardButton : this.$refs.removeCardButton;
      button?.focus();
    },
  },
}).mount("#app");
