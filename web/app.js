(() => {
  "use strict";

  const CATEGORIES = [
    { id: "", label: "全部", labelEn: "All" },
    { id: "weapon", label: "武器", labelEn: "Weapons", countKey: "weapon" },
    { id: "armor", label: "护甲", labelEn: "Armor", countKey: "armor" },
    { id: "ship", label: "飞船", labelEn: "Ships", countKey: "ship" },
    { id: "sparrow", label: "快雀·赛雀", labelEn: "Sparrows", countKey: "sparrow" },
    { id: "skimmer", label: "滑板", labelEn: "Skimmers", countKey: "skimmer" },
    { id: "ghost", label: "机灵", labelEn: "Ghosts", countKey: "ghost" }
  ];

  const TIERS = [
    { id: "", label: "全部品级", labelEn: "All Rarities", color: "#9aa3b2" },
    { id: 6, label: "异域金", labelEn: "Exotic", color: "#ceae33" },
    { id: 5, label: "传说紫", labelEn: "Legendary", color: "#6c4084" },
    { id: 4, label: "稀有蓝", labelEn: "Rare", color: "#5076a3" },
    { id: 3, label: "罕见绿", labelEn: "Uncommon", color: "#366f42" },
    { id: 2, label: "普通白", labelEn: "Common", color: "#c3bcb4" }
  ];

  const WEAPON_SLOTS = [
    { id: "", label: "全部槽位", labelEn: "All Slots" },
    { id: 1498876634, label: "动能", labelEn: "Kinetic" },
    { id: 2465295065, label: "能量", labelEn: "Energy" },
    { id: 953998645, label: "威能", labelEn: "Power" }
  ];

  const ARMOR_CLASSES = [
    { id: "", label: "全部职业", labelEn: "All Classes" },
    { id: 0, label: "泰坦", labelEn: "Titan" },
    { id: 1, label: "猎人", labelEn: "Hunter" },
    { id: 2, label: "术士", labelEn: "Warlock" },
    { id: 3, label: "通用", labelEn: "Any" }
  ];

  const ARMOR_SLOTS = [
    { id: "", label: "全部部位", labelEn: "All Armor Slots" },
    { id: 3448274439, label: "头盔", labelEn: "Helmet" },
    { id: 3551918588, label: "臂铠", labelEn: "Gauntlets" },
    { id: 14239492, label: "胸甲", labelEn: "Chest" },
    { id: 20886954, label: "护腿", labelEn: "Legs" },
    { id: 1585787867, label: "职业物品", labelEn: "Class Item" }
  ];

  const AMMO_LABELS = {
    1: "主弹药",
    2: "特殊弹药",
    3: "重型弹药"
  };

  const state = {
    mode: "codex", // codex | lore | favorites
    lang: "zh", // zh | en | both
    q: "",
    status: null,
    fulltext: false,

    // 图鉴筛选与分页
    codex: {
      category: "",
      tier: "",
      hasLore: false,
      bucket: "",
      weaponSubType: "",
      damageType: "",
      ammoType: "",
      classType: "",
      page: 1,
      pageSize: 60,
      total: 0,
      items: [],
      selectedHash: null,
      detail: null
    },

    // 传说书馆
    lore: {
      favoritesOnly: false,
      unreadOnly: false,
      sections: [],
      collapsedSections: {},
      selectedBookHash: null,
      bookDetail: null,
      selectedChapterIndex: null
    },

    // 我的收藏
    favorites: {
      tab: "all", // all | items | books | chapters
      items: [],
      books: [],
      chapters: []
    },

    // 大图查看器
    lightbox: {
      open: false,
      scale: 1,
      fitScale: 1,
      minScale: 0.25,
      maxScale: 8,
      tx: 0,
      ty: 0,
      nw: 0,
      nh: 0,
      dragging: false,
      moved: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      originTx: 0,
      originTy: 0
    }
  };

  const $ = (id) => document.getElementById(id);

  const dom = {
    brandHome: $("brandHome"),
    globalSearchInput: $("globalSearchInput"),
    searchHitCount: $("searchHitCount"),
    clearSearchBtn: $("clearSearchBtn"),
    manifestBadge: $("manifestBadge"),
    dataStatus: $("dataStatus"),
    fulltextToggle: $("fulltextToggle"),
    ammoTypeSelect: $("ammoTypeSelect"),

    mainWorkspace: $("mainWorkspace"),
    codexView: $("codexView"),
    loreView: $("loreView"),
    favoritesView: $("favoritesView"),

    categoryTabs: $("categoryTabs"),
    tierPills: $("tierPills"),
    hasLoreCheckbox: $("hasLoreCheckbox"),
    weaponSubFilters: $("weaponSubFilters"),
    weaponSlotPills: $("weaponSlotPills"),
    weaponTypeSelect: $("weaponTypeSelect"),
    damageTypePills: $("damageTypePills"),
    armorSubFilters: $("armorSubFilters"),
    armorClassPills: $("armorClassPills"),
    armorSlotPills: $("armorSlotPills"),

    itemsTotalText: $("itemsTotalText"),
    paginationTop: $("paginationTop"),
    paginationBottom: $("paginationBottom"),
    itemsGrid: $("itemsGrid"),
    itemsEmpty: $("itemsEmpty"),

    itemDetailDrawer: $("itemDetailDrawer"),
    detailTierBadge: $("detailTierBadge"),
    detailFavBtn: $("detailFavBtn"),
    detailReadBtn: $("detailReadBtn"),
    detailCopyMdBtn: $("detailCopyMdBtn"),
    detailDownloadMdBtn: $("detailDownloadMdBtn"),
    closeDetailBtn: $("closeDetailBtn"),
    detailIconContainer: $("detailIconContainer"),
    detailNamePrimary: $("detailNamePrimary"),
    detailNameSecondary: $("detailNameSecondary"),
    detailMetaLine: $("detailMetaLine"),
    detailScreenshotWrap: $("detailScreenshotWrap"),
    detailScreenshotLoading: $("detailScreenshotLoading"),
    detailScreenshotImg: $("detailScreenshotImg"),
    detailScreenshotZoomBtn: $("detailScreenshotZoomBtn"),
    detailVariantsWrap: $("detailVariantsWrap"),
    detailVariantCount: $("detailVariantCount"),
    detailVariantsList: $("detailVariantsList"),
    detailSourceWrap: $("detailSourceWrap"),
    detailSourceText: $("detailSourceText"),
    detailFlavorWrap: $("detailFlavorWrap"),
    detailFlavorText: $("detailFlavorText"),
    detailLoreWrap: $("detailLoreWrap"),
    detailLoreTitle: $("detailLoreTitle"),
    detailLoreSubtitle: $("detailLoreSubtitle"),
    detailLoreContent: $("detailLoreContent"),

    loreFavOnlyCheckbox: $("loreFavOnlyCheckbox"),
    loreUnreadOnlyCheckbox: $("loreUnreadOnlyCheckbox"),
    loreSectionsList: $("loreSectionsList"),
    loreBookHeader: $("loreBookHeader"),
    loreChaptersList: $("loreChaptersList"),
    loreReaderEmpty: $("loreReaderEmpty"),
    loreReaderPanel: $("loreReaderPanel"),
    prevChapterBtn: $("prevChapterBtn"),
    chapterIndexBadge: $("chapterIndexBadge"),
    nextChapterBtn: $("nextChapterBtn"),
    chapterFavBtn: $("chapterFavBtn"),
    chapterReadBtn: $("chapterReadBtn"),
    chapterCopyMdBtn: $("chapterCopyMdBtn"),
    chapterDownloadMdBtn: $("chapterDownloadMdBtn"),
    readerChapterTitle: $("readerChapterTitle"),
    readerChapterSubtitle: $("readerChapterSubtitle"),
    readerChapterBody: $("readerChapterBody"),

    favoritesCountText: $("favoritesCountText"),
    favItemsSection: $("favItemsSection"),
    favItemsGrid: $("favItemsGrid"),
    favItemsEmpty: $("favItemsEmpty"),
    favBooksSection: $("favBooksSection"),
    favBooksGrid: $("favBooksGrid"),
    favBooksEmpty: $("favBooksEmpty"),
    favChaptersSection: $("favChaptersSection"),
    favChaptersGrid: $("favChaptersGrid"),
    favChaptersEmpty: $("favChaptersEmpty"),
    favoritesEmpty: $("favoritesEmpty"),

    imageLightbox: $("imageLightbox"),
    lightboxCaption: $("lightboxCaption"),
    lightboxResolution: $("lightboxResolution"),
    lightboxZoomOutBtn: $("lightboxZoomOutBtn"),
    lightboxZoomPct: $("lightboxZoomPct"),
    lightboxZoomInBtn: $("lightboxZoomInBtn"),
    lightboxFitBtn: $("lightboxFitBtn"),
    lightboxActualBtn: $("lightboxActualBtn"),
    lightboxCloseBtn: $("lightboxCloseBtn"),
    lightboxStage: $("lightboxStage"),
    lightboxImg: $("lightboxImg"),

    toastContainer: $("toastContainer")
  };

  // --- 工具函数 ---

  function showToast(msg, isError = false) {
    const el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = msg;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 2600);
  }

  function pickLangPair(zh, en) {
    const z = zh || "";
    const e = en || "";
    if (state.lang === "en") return { primary: e || z, secondary: "" };
    if (state.lang === "both") return { primary: z || e, secondary: e && e !== z ? e : "" };
    return { primary: z || e, secondary: "" };
  }

  function createIconBox(iconPath, watermarkPath, tierType, sizeClass = "") {
    const box = document.createElement("div");
    box.className = `d2-icon-box ${sizeClass} ${tierType ? "tier-" + tierType : ""}`.trim();

    box.classList.add("icon-placeholder");
    if (imgUrl(iconPath)) {
      const base = document.createElement("img");
      base.className = "d2-icon-base";
      base.loading = "lazy";
      base.alt = "";
      base.src = imgUrl(iconPath);
      base.addEventListener("error", () => base.remove(), { once: true });
      box.appendChild(base);
    }

    if (imgUrl(watermarkPath)) {
      const wm = document.createElement("img");
      wm.className = "d2-icon-watermark";
      wm.loading = "lazy";
      wm.alt = "";
      wm.src = imgUrl(watermarkPath);
      wm.addEventListener("error", () => {
        wm.style.display = "none";
      });
      box.appendChild(wm);
    }
    return box;
  }

  function createStarSvg() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l7.1-1.01L12 2z");
    svg.appendChild(path);
    return svg;
  }

  function renderParagraphs(container, text) {
    container.textContent = "";
    if (!text) return;
    const lines = String(text).split(/\r?\n/);
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line || "\u00A0";
      container.appendChild(p);
    }
  }

  function renderLoreBody(container, bodyZh, bodyEn) {
    container.textContent = "";
    if (state.lang === "both" && bodyZh && bodyEn) {
      const grid = document.createElement("div");
      grid.className = "bilingual-grid";

      const colZh = document.createElement("div");
      colZh.className = "bilingual-col";
      const hZh = document.createElement("div");
      hZh.className = "bilingual-col-head";
      hZh.textContent = "简体中文";
      colZh.appendChild(hZh);
      const cZh = document.createElement("div");
      renderParagraphs(cZh, bodyZh);
      colZh.appendChild(cZh);

      const colEn = document.createElement("div");
      colEn.className = "bilingual-col";
      const hEn = document.createElement("div");
      hEn.className = "bilingual-col-head";
      hEn.textContent = "English";
      colEn.appendChild(hEn);
      const cEn = document.createElement("div");
      renderParagraphs(cEn, bodyEn);
      colEn.appendChild(cEn);

      grid.appendChild(colZh);
      grid.appendChild(colEn);
      container.appendChild(grid);
    } else if (state.lang === "en") {
      renderParagraphs(container, bodyEn || bodyZh);
    } else {
      renderParagraphs(container, bodyZh || bodyEn);
    }
  }

  // --- 图鉴筛选与列表 ---

  function renderCategoryTabs() {
    const counts = (state.status && state.status.counts) || {};
    const totalAll =
      (counts.weapon || 0) +
      (counts.armor || 0) +
      (counts.ship || 0) +
      (counts.sparrow || 0) +
      (counts.skimmer || 0) +
      (counts.ghost || 0);

    dom.categoryTabs.textContent = "";
    for (const cat of CATEGORIES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill-btn" + (state.codex.category === cat.id ? " active" : "");
      const label = document.createElement("span");
      label.textContent = useEnglish(cat.label, cat.labelEn);
      btn.appendChild(label);

      const countVal = cat.countKey ? counts[cat.countKey] : totalAll;
      if (typeof countVal === "number") {
        const badge = document.createElement("span");
        badge.className = "count-badge";
        badge.textContent = String(countVal);
        btn.appendChild(badge);
      }

      btn.addEventListener("click", () => {
        if (state.codex.category === cat.id) return;
        state.codex.category = cat.id;
        state.codex.bucket = "";
        state.codex.weaponSubType = "";
        state.codex.damageType = "";
        state.codex.ammoType = "";
        state.codex.classType = "";
        state.codex.page = 1;
        renderCodexFilters();
        loadItems();
      });
      dom.categoryTabs.appendChild(btn);
    }
  }

  function renderTierPills() {
    dom.tierPills.textContent = "";
    for (const t of TIERS) {
      const btn = document.createElement("button");
      btn.type = "button";
      const tierCls = t.id ? `tier-${t.id}` : "";
      btn.className = `pill-btn ${tierCls}` + (String(state.codex.tier) === String(t.id) ? " active" : "");
      if (t.id) {
        const dot = document.createElement("span");
        dot.className = "tier-dot";
        dot.style.backgroundColor = t.color;
        btn.appendChild(dot);
      }
      const span = document.createElement("span");
      span.textContent = useEnglish(t.label, t.labelEn);
      btn.appendChild(span);

      btn.addEventListener("click", () => {
        state.codex.tier = t.id;
        state.codex.page = 1;
        renderTierPills();
        loadItems();
      });
      dom.tierPills.appendChild(btn);
    }
  }

  function renderCodexFilters() {
    renderCategoryTabs();
    renderTierPills();

    const cat = state.codex.category;
    const filters = (state.status && state.status.filters) || {};

    if (cat === "weapon") {
      dom.weaponSubFilters.classList.remove("hidden");
      dom.armorSubFilters.classList.add("hidden");

      // 槽位
      dom.weaponSlotPills.textContent = "";
      for (const s of WEAPON_SLOTS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill-btn" + (String(state.codex.bucket) === String(s.id) ? " active" : "");
        btn.textContent = useEnglish(s.label, s.labelEn);
        btn.addEventListener("click", () => {
          state.codex.bucket = s.id;
          state.codex.page = 1;
          renderCodexFilters();
          loadItems();
        });
        dom.weaponSlotPills.appendChild(btn);
      }

      // 武器种类 select
      dom.weaponTypeSelect.textContent = "";
      const allOpt = document.createElement("option");
      allOpt.value = "";
      allOpt.textContent = useEnglish("全部武器种类", "All Weapon Types");
      dom.weaponTypeSelect.appendChild(allOpt);
      for (const wt of filters.weapon_types || []) {
        const opt = document.createElement("option");
        opt.value = String(wt.id);
        opt.textContent = state.lang === "en" ? wt.name_en || wt.name_zh : wt.name_zh || wt.name_en;
        dom.weaponTypeSelect.appendChild(opt);
      }
      dom.ammoTypeSelect.value = state.codex.ammoType;
      dom.weaponTypeSelect.value = String(state.codex.weaponSubType);

      // 伤害属性
      dom.damageTypePills.textContent = "";
      const allDmgBtn = document.createElement("button");
      allDmgBtn.type = "button";
      allDmgBtn.className = "pill-btn" + (state.codex.damageType === "" ? " active" : "");
      allDmgBtn.textContent = "全部属性";
      allDmgBtn.addEventListener("click", () => {
        state.codex.damageType = "";
        state.codex.page = 1;
        renderCodexFilters();
        loadItems();
      });
      dom.damageTypePills.appendChild(allDmgBtn);

      for (const dt of filters.damage_types || []) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill-btn" + (String(state.codex.damageType) === String(dt.id) ? " active" : "");
        if (dt.icon_path) {
          const img = document.createElement("img");
          img.className = "damage-icon-mini";
          img.src = imgUrl(dt.icon_path);
          img.alt = "";
          img.addEventListener("error", () => {
            img.style.display = "none";
          });
          btn.appendChild(img);
        }
        const span = document.createElement("span");
        span.textContent = state.lang === "en" ? dt.name_en || dt.name_zh : dt.name_zh || dt.name_en;
        btn.appendChild(span);
        btn.addEventListener("click", () => {
          state.codex.damageType = dt.id;
          state.codex.page = 1;
          renderCodexFilters();
          loadItems();
        });
        dom.damageTypePills.appendChild(btn);
      }
    } else if (cat === "armor") {
      dom.armorSubFilters.classList.remove("hidden");
      dom.weaponSubFilters.classList.add("hidden");

      dom.armorClassPills.textContent = "";
      for (const cl of ARMOR_CLASSES) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill-btn" + (String(state.codex.classType) === String(cl.id) ? " active" : "");
        btn.textContent = cl.label;
        btn.addEventListener("click", () => {
          state.codex.classType = cl.id;
          state.codex.page = 1;
          renderCodexFilters();
          loadItems();
        });
        dom.armorClassPills.appendChild(btn);
      }

      dom.armorSlotPills.textContent = "";
      for (const sl of ARMOR_SLOTS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill-btn" + (String(state.codex.bucket) === String(sl.id) ? " active" : "");
        btn.textContent = sl.label;
        btn.addEventListener("click", () => {
          state.codex.bucket = sl.id;
          state.codex.page = 1;
          renderCodexFilters();
          loadItems();
        });
        dom.armorSlotPills.appendChild(btn);
      }
    } else {
      dom.weaponSubFilters.classList.add("hidden");
      dom.armorSubFilters.classList.add("hidden");
    }
  }

  async function loadItems() {
    if (!state.status || !state.status.ready) return;
    const c = state.codex;
    const params = new URLSearchParams({
      q: state.q,
      category: c.category,
      tier: c.tier,
      has_lore: c.hasLore ? "1" : "",
      bucket: c.bucket,
      weapon_sub_type: c.weaponSubType,
      damage_type: c.damageType,
      ammo_type: c.ammoType,
      class_type: c.classType,
      page: String(c.page),
      page_size: String(c.pageSize)
    });
    const request = ++requests.items;
    try {
      const data = await queryItems(params);
      if (request !== requests.items) return;
      c.total = data.total || 0;
      c.items = data.items || [];
      renderItemsGrid(dom.itemsGrid, dom.itemsEmpty, c.items, c.selectedHash, (item) => openItemDetail(item.item_hash));
      renderPagination();
      if (state.mode === "codex") updateSearchHitCount(c.total);
    } catch (err) {
      showToast("加载装备列表失败: " + err.message, true);
    }
  }

  function updateSearchHitCount(count) {
    if (state.q.trim()) {
      dom.searchHitCount.textContent = `命中 ${count} 条`;
      dom.searchHitCount.classList.remove("hidden");
    } else {
      dom.searchHitCount.classList.add("hidden");
    }
  }

  function renderPagination() {
    const c = state.codex;
    const totalPages = Math.max(1, Math.ceil(c.total / c.pageSize));
    dom.itemsTotalText.textContent = `共 ${c.total} 件装备`;

    const buildPager = (container) => {
      container.textContent = "";
      if (totalPages <= 1) return;

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "page-btn";
      prevBtn.textContent = "上一页";
      prevBtn.disabled = c.page <= 1;
      prevBtn.addEventListener("click", () => {
        if (c.page > 1) {
          c.page--;
          loadItems();
        }
      });

      const info = document.createElement("span");
      info.className = "page-info";
      info.textContent = `${c.page} / ${totalPages}`;

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "page-btn";
      nextBtn.textContent = "下一页";
      nextBtn.disabled = c.page >= totalPages;
      nextBtn.addEventListener("click", () => {
        if (c.page < totalPages) {
          c.page++;
          loadItems();
        }
      });

      container.appendChild(prevBtn);
      container.appendChild(info);
      container.appendChild(nextBtn);
    };

    buildPager(dom.paginationTop);
    buildPager(dom.paginationBottom);
  }

  function renderItemsGrid(gridEl, emptyEl, items, selectedHash, onSelect, onUnfavorite) {
    gridEl.textContent = "";
    if (!items.length) {
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    for (const item of items) {
      const card = document.createElement("div");
      card.className = `item-card tier-${item.tier_type || 2}` + (selectedHash === item.item_hash ? " selected" : "");
      card.addEventListener("click", () => onSelect(item));

      const top = document.createElement("div");
      top.className = "item-card-top";
      top.appendChild(createIconBox(item.icon_path, item.watermark_path, item.tier_type));

      const info = document.createElement("div");
      info.className = "item-card-info";

      const nameRow = document.createElement("div");
      nameRow.className = "item-card-name-row";

      const nameEl = document.createElement("div");
      nameEl.className = "item-card-name";
      const zhNameHtml = item.name_zh_hl || item.name_zh;
      const enNameHtml = item.name_en_hl || item.name_en;
      if (state.lang === "en") {
        renderHighlighted(nameEl, enNameHtml || zhNameHtml);
      } else {
        renderHighlighted(nameEl, zhNameHtml || enNameHtml);
      }
      nameRow.appendChild(nameEl);

      const starBtn = document.createElement("button");
      starBtn.type = "button";
      starBtn.className = "star-btn" + (item.is_favorite ? " active" : "");
      starBtn.title = item.is_favorite ? "取消收藏" : "收藏";
      starBtn.appendChild(createStarSvg());
      starBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const nextFav = !item.is_favorite;
        try {
          saveMark("favorites", {
            entity_type: "item",
            entity_id: item.item_hash,
            dedup_key: item.dedup_key || "",
            favorite: nextFav
          });
          item.is_favorite = nextFav;
          starBtn.classList.toggle("active", nextFav);
          if (state.codex.detail && state.codex.detail.item_hash === item.item_hash) {
            state.codex.detail.is_favorite = nextFav;
            updateDetailButtons();
          }
          if (onUnfavorite && !nextFav) onUnfavorite(item);
        } catch (err) {
          showToast("操作失败: " + err.message, true);
        }
      });
      nameRow.appendChild(starBtn);
      info.appendChild(nameRow);

      if (state.lang === "both" && (item.name_en || item.name_en_hl) && item.name_en !== item.name_zh) {
        const subName = document.createElement("div");
        subName.className = "item-card-subname";
        renderHighlighted(subName, item.name_en_hl || item.name_en);
        info.appendChild(subName);
      }

      const meta = document.createElement("div");
      meta.className = "item-card-meta";

      const typeText = state.lang === "en" ? item.type_name_en || item.type_name_zh : item.type_name_zh || item.type_name_en;
      if (typeText) {
        const tTag = document.createElement("span");
        tTag.textContent = typeText;
        meta.appendChild(tTag);
      }

      if (item.damage_icon_path || item.damage_name_zh || item.damage_name_en) {
        const dTag = document.createElement("span");
        dTag.className = "meta-tag";
        if (item.damage_icon_path) {
          const dImg = document.createElement("img");
          dImg.className = "damage-icon-mini";
          dImg.src = imgUrl(item.damage_icon_path);
          dImg.alt = "";
          dImg.addEventListener("error", () => {
            dImg.style.display = "none";
          });
          dTag.appendChild(dImg);
        }
        const dmgLabel = state.lang === "en" ? item.damage_name_en || item.damage_name_zh : item.damage_name_zh || item.damage_name_en;
        if (dmgLabel) {
          const dSpan = document.createElement("span");
          dSpan.textContent = dmgLabel;
          dTag.appendChild(dSpan);
        }
        meta.appendChild(dTag);
      }

      if (item.ammo_type && AMMO_LABELS[item.ammo_type]) {
        const aTag = document.createElement("span");
        aTag.className = "meta-tag";
        aTag.textContent = AMMO_LABELS[item.ammo_type];
        meta.appendChild(aTag);
      }

      if (item.reissue_count > 1) {
        const rTag = document.createElement("span");
        rTag.className = "meta-tag reissue";
        rTag.textContent = `×${item.reissue_count} 版本`;
        meta.appendChild(rTag);
      }

      if (item.has_lore) {
        const lTag = document.createElement("span");
        lTag.className = "meta-tag lore";
        lTag.textContent = "传说";
        meta.appendChild(lTag);

        const rDot = document.createElement("span");
        rDot.className = "read-dot" + (item.is_read ? " is-read" : "");
        rDot.title = item.is_read ? "已读" : "未读";
        meta.appendChild(rDot);
      }

      info.appendChild(meta);
      top.appendChild(info);
      card.appendChild(top);

      const snippetHtml = state.lang === "en" ? item.snippet_en || item.snippet_zh : item.snippet_zh || item.snippet_en;
      if (snippetHtml) {
        const snip = document.createElement("div");
        snip.className = "item-card-snippet";
        renderHighlighted(snip, snippetHtml);
        card.appendChild(snip);
      }

      gridEl.appendChild(card);
    }
  }

  // --- 装备详情阅读器 ---

  async function openItemDetail(itemHash) {
    const request = ++requests.item;
    itemHash = canonicalHashes.get(Number(itemHash)) ?? Number(itemHash);
    state.codex.selectedHash = itemHash;
    // 更新列表选中态
    renderItemsGrid(dom.itemsGrid, dom.itemsEmpty, state.codex.items, itemHash, (item) => openItemDetail(item.item_hash));
    try {
      const detail = await getItemDetail(itemHash);
      if (request !== requests.item || state.mode !== "codex") return;
      state.codex.detail = detail;
      dom.itemDetailDrawer.classList.remove("hidden");
      renderItemDetail();
    } catch (err) {
      showToast("加载装备详情失败: " + err.message, true);
    }
  }

  function updateDetailButtons() {
    const d = state.codex.detail;
    if (!d) return;
    dom.detailFavBtn.classList.toggle("active", Boolean(d.is_favorite));
    dom.detailReadBtn.classList.toggle("active", Boolean(d.is_read));
  }

  function renderItemDetail() {
    const d = state.codex.detail;
    if (!d) return;

    const tierObj = TIERS.find((t) => t.id === d.tier_type);
    const tierName = state.lang === "en" ? d.tier_name_en || d.tier_name_zh : d.tier_name_zh || d.tier_name_en;
    dom.detailTierBadge.textContent = tierName || "装备";
    dom.detailTierBadge.style.color = tierObj ? tierObj.color : "#eceef2";
    dom.detailTierBadge.style.borderColor = tierObj ? tierObj.color : "var(--border-strong)";

    dom.detailIconContainer.textContent = "";
    dom.detailIconContainer.appendChild(createIconBox(d.icon_path, d.watermark_path, d.tier_type, "large"));

    const names = pickLangPair(d.name_zh, d.name_en);
    dom.detailNamePrimary.textContent = names.primary;
    dom.detailNameSecondary.textContent = names.secondary;

    dom.detailMetaLine.textContent = "";
    const typeSpan = document.createElement("span");
    typeSpan.textContent = state.lang === "en" ? d.type_name_en || d.type_name_zh : d.type_name_zh || d.type_name_en;
    dom.detailMetaLine.appendChild(typeSpan);

    const dmgDetailLabel = state.lang === "en" ? d.damage_name_en || d.damage_name_zh : d.damage_name_zh || d.damage_name_en;
    if (dmgDetailLabel) {
      const dmg = document.createElement("span");
      dmg.className = "meta-tag";
      dmg.textContent = dmgDetailLabel;
      dom.detailMetaLine.appendChild(dmg);
    }
    if (d.breaker_name_zh || d.breaker_name_en) {
      const brk = document.createElement("span");
      brk.className = "meta-tag";
      brk.textContent = state.lang === "en" ? d.breaker_name_en || d.breaker_name_zh : d.breaker_name_zh || d.breaker_name_en;
      dom.detailMetaLine.appendChild(brk);
    }

    updateDetailButtons();

    // 高清大图按需加载
    if (imgUrl(d.screenshot_path)) {
      dom.detailScreenshotWrap.classList.remove("hidden");
      dom.detailScreenshotLoading.classList.remove("hidden");
      dom.detailScreenshotImg.classList.add("hidden");
      dom.detailScreenshotZoomBtn.classList.add("hidden");
      dom.detailScreenshotImg.onload = () => {
        dom.detailScreenshotLoading.classList.add("hidden");
        dom.detailScreenshotImg.classList.remove("hidden");
        dom.detailScreenshotZoomBtn.classList.remove("hidden");
      };
      dom.detailScreenshotImg.onerror = () => {
        dom.detailScreenshotZoomBtn.classList.add("hidden");
        dom.detailScreenshotWrap.classList.add("hidden");
      };
      dom.detailScreenshotImg.src = imgUrl(d.screenshot_path);
    } else {
      dom.detailScreenshotZoomBtn.classList.add("hidden");
      dom.detailScreenshotWrap.classList.add("hidden");
    }

    // 复刻版本
    const variants = d.variants || [];
    if (variants.length > 1) {
      dom.detailVariantsWrap.classList.remove("hidden");
      dom.detailVariantCount.textContent = String(variants.length);
      dom.detailVariantsList.textContent = "";
      for (const v of variants) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "variant-chip" + (v.item_hash === d.item_hash ? " active" : "");
        chip.title = `版本 Hash: ${v.item_hash}`;
        chip.appendChild(createIconBox(v.icon_path, v.watermark_path, d.tier_type, "small"));
        chip.addEventListener("click", () => {
          dom.detailIconContainer.textContent = "";
          dom.detailIconContainer.appendChild(createIconBox(v.icon_path, v.watermark_path, d.tier_type, "large"));
          dom.detailVariantsList.querySelectorAll(".variant-chip").forEach((el) => el.classList.remove("active"));
          chip.classList.add("active");
        });
        dom.detailVariantsList.appendChild(chip);
      }
    } else {
      dom.detailVariantsWrap.classList.add("hidden");
    }

    // 获取来源
    const srcText = state.lang === "en" ? d.source_en || d.source_zh : d.source_zh || d.source_en;
    if (srcText) {
      dom.detailSourceWrap.classList.remove("hidden");
      dom.detailSourceText.textContent = srcText;
    } else {
      dom.detailSourceWrap.classList.add("hidden");
    }

    // 简介
    const flavorText = state.lang === "en" ? d.flavor_en || d.flavor_zh : d.flavor_zh || d.flavor_en;
    if (flavorText) {
      dom.detailFlavorWrap.classList.remove("hidden");
      dom.detailFlavorText.textContent = flavorText;
    } else {
      dom.detailFlavorWrap.classList.add("hidden");
    }

    // 传说正文
    if (d.lore && (d.lore.body_zh || d.lore.body_en)) {
      dom.detailLoreWrap.classList.remove("hidden");
      const lTitles = pickLangPair(d.lore.title_zh, d.lore.title_en);
      dom.detailLoreTitle.textContent = lTitles.primary || names.primary;
      const subText = state.lang === "en" ? d.lore.subtitle_en || d.lore.subtitle_zh : d.lore.subtitle_zh || d.lore.subtitle_en;
      dom.detailLoreSubtitle.textContent = subText || "";
      renderLoreBody(dom.detailLoreContent, d.lore.body_zh, d.lore.body_en);
    } else {
      dom.detailLoreWrap.classList.add("hidden");
    }
  }

  // --- 传说书馆 ---

  async function loadLoreBooks() {
    if (!state.status || !state.status.ready) return;
    const params = new URLSearchParams({
      q: state.q,
      favorites_only: state.lore.favoritesOnly ? "1" : "",
      unread_only: state.lore.unreadOnly ? "1" : ""
    });
    const request = ++requests.books;
    try {
      const data = await queryBooks(params);
      if (request !== requests.books) return;
      state.lore.sections = data.sections || [];
      let totalMatched = 0;
      for (const sec of state.lore.sections) {
        totalMatched += (sec.books || []).length;
      }
      if (state.mode === "lore") {
        updateSearchHitCount(totalMatched);
      }
      renderLoreSections();
    } catch (err) {
      showToast("加载传说书失败: " + err.message, true);
    }
  }

  function renderLoreSections() {
    dom.loreSectionsList.textContent = "";
    const sections = state.lore.sections;
    if (!sections.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "没有符合条件的传说书";
      dom.loreSectionsList.appendChild(empty);
      return;
    }

    for (const sec of sections) {
      const secKey = sec.name_zh || sec.name_en || "other";
      const isCollapsed = Boolean(state.lore.collapsedSections[secKey]);

      const group = document.createElement("div");
      group.className = "lore-section-group";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "lore-section-toggle";
      const secTitle = state.lang === "en" ? sec.name_en || sec.name_zh : sec.name_zh || sec.name_en;
      const tLeft = document.createElement("span");
      tLeft.textContent = `${isCollapsed ? "▸" : "▾"} ${secTitle}`;
      const tRight = document.createElement("span");
      tRight.textContent = String((sec.books || []).length);
      toggle.appendChild(tLeft);
      toggle.appendChild(tRight);
      toggle.addEventListener("click", () => {
        state.lore.collapsedSections[secKey] = !isCollapsed;
        renderLoreSections();
      });
      group.appendChild(toggle);

      if (!isCollapsed) {
        const list = document.createElement("div");
        list.className = "lore-section-books";

        for (const book of sec.books || []) {
          const item = document.createElement("div");
          item.className = "lore-book-item" + (state.lore.selectedBookHash === book.book_hash ? " active" : "");
          item.addEventListener("click", () => openLoreBook(book.book_hash, book.matched_chapters?.[0]?.chapter_index));

          item.appendChild(createIconBox(book.icon_path, "", null, "small"));

          const meta = document.createElement("div");
          meta.className = "lore-book-meta";
          const title = document.createElement("div");
          title.className = "lore-book-title";
          title.textContent = state.lang === "en" ? book.book_name_en || book.book_name_zh : book.book_name_zh || book.book_name_en;
          const prog = document.createElement("div");
          prog.className = "lore-book-progress";
          prog.textContent = `${book.read_count || 0} / ${book.chapter_count || 0} 章`;
          if (book.matched_chapters && book.matched_chapters.length) {
            prog.textContent += ` · 命中 ${book.matched_chapters.length} 章`;
          }
          meta.appendChild(title);
          meta.appendChild(prog);
          item.appendChild(meta);

          if (book.is_favorite) {
            const star = document.createElement("span");
            star.className = "star-btn active";
            star.appendChild(createStarSvg());
            item.appendChild(star);
          }

          list.appendChild(item);
        }
        group.appendChild(list);
      }

      dom.loreSectionsList.appendChild(group);
    }
  }

  async function openLoreBook(bookHash, targetChapterIndex = null) {
    const request = ++requests.book;
    state.lore.selectedBookHash = bookHash;
    renderLoreSections();
    try {
      const book = await getBookDetail(bookHash);
      if (request !== requests.book) return;
      state.lore.bookDetail = book;
      const chapters = book.chapters || [];
      if (targetChapterIndex !== null) {
        state.lore.selectedChapterIndex = targetChapterIndex;
      } else if (chapters.length > 0) {
        state.lore.selectedChapterIndex = chapters[0].chapter_index;
      } else {
        state.lore.selectedChapterIndex = null;
      }
      renderLoreBookDetail();
      renderLoreReader();
    } catch (err) {
      showToast("加载传说书详情失败: " + err.message, true);
    }
  }

  function renderLoreBookDetail() {
    const book = state.lore.bookDetail;
    if (!book) return;

    dom.loreBookHeader.classList.remove("empty");
    dom.loreBookHeader.textContent = "";

    const top = document.createElement("div");
    top.className = "book-header-top";
    top.appendChild(createIconBox(book.icon_path, "", null));

    const info = document.createElement("div");
    info.style.flex = "1";
    info.style.minWidth = "0";
    const h = document.createElement("h4");
    h.className = "book-header-title";
    h.textContent = state.lang === "en" ? book.book_name_en || book.book_name_zh : book.book_name_zh || book.book_name_en;
    const desc = document.createElement("p");
    desc.className = "book-header-desc";
    desc.textContent = state.lang === "en" ? book.desc_en || book.desc_zh : book.desc_zh || book.desc_en;
    info.appendChild(h);
    info.appendChild(desc);
    top.appendChild(info);
    dom.loreBookHeader.appendChild(top);

    const actions = document.createElement("div");
    actions.className = "book-header-actions";

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "icon-action-btn" + (book.is_favorite ? " active" : "");
    favBtn.appendChild(createStarSvg());
    const favTxt = document.createElement("span");
    favTxt.textContent = book.is_favorite ? "已收藏整书" : "收藏整书";
    favBtn.appendChild(favTxt);
    favBtn.addEventListener("click", async () => {
      const nextFav = !book.is_favorite;
      try {
        saveMark("favorites", {
          entity_type: "lore_book",
          entity_id: book.book_hash,
          dedup_key: "",
          favorite: nextFav
        });
        book.is_favorite = nextFav;
        renderLoreBookDetail();
        loadLoreBooks();
      } catch (err) {
        showToast("操作失败: " + err.message, true);
      }
    });

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "icon-action-btn";
    copyBtn.textContent = useEnglish("复制整书 MD", "Copy Book Markdown");
    copyBtn.addEventListener("click", () => copyMarkdown("lore_book", book.book_hash));

    const dlBtn = document.createElement("button");
    dlBtn.type = "button";
    dlBtn.className = "icon-action-btn";
    dlBtn.textContent = useEnglish("下载整书 .md", "Download Book");
    dlBtn.addEventListener("click", () => downloadMarkdown("lore_book", book.book_hash));

    actions.appendChild(favBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(dlBtn);
    dom.loreBookHeader.appendChild(actions);

    // 章节列表
    dom.loreChaptersList.textContent = "";
    const chapters = [...(book.chapters || [])].sort((a, b) => a.chapter_index - b.chapter_index);
    for (const ch of chapters) {
      const row = document.createElement("div");
      row.className = "chapter-item" + (state.lore.selectedChapterIndex === ch.chapter_index ? " active" : "");
      row.addEventListener("click", () => {
        state.lore.selectedChapterIndex = ch.chapter_index;
        renderLoreBookDetail();
        renderLoreReader();
      });

      const dot = document.createElement("span");
      dot.className = "read-dot" + (ch.is_read ? " is-read" : "");
      row.appendChild(dot);

      const title = document.createElement("span");
      title.className = "chapter-item-title";
      const chName = state.lang === "en" ? ch.title_en || ch.title_zh : ch.title_zh || ch.title_en;
      title.textContent = `${ch.chapter_index + 1}. ${chName || "无标题"}`;
      row.appendChild(title);

      if (ch.is_favorite) {
        const star = document.createElement("span");
        star.className = "star-btn active";
        star.appendChild(createStarSvg());
        row.appendChild(star);
      }
      dom.loreChaptersList.appendChild(row);
    }
  }

  function getSelectedChapter() {
    const book = state.lore.bookDetail;
    if (!book || !book.chapters) return null;
    return book.chapters.find((c) => c.chapter_index === state.lore.selectedChapterIndex) || null;
  }

  function renderLoreReader() {
    const book = state.lore.bookDetail;
    const ch = getSelectedChapter();
    if (!book || !ch) {
      dom.loreReaderEmpty.classList.remove("hidden");
      dom.loreReaderPanel.classList.add("hidden");
      return;
    }

    dom.loreReaderEmpty.classList.add("hidden");
    dom.loreReaderPanel.classList.remove("hidden");

    const chapters = [...(book.chapters || [])].sort((a, b) => a.chapter_index - b.chapter_index);
    const idx = chapters.findIndex((c) => c.chapter_index === ch.chapter_index);

    dom.prevChapterBtn.disabled = idx <= 0;
    dom.nextChapterBtn.disabled = idx < 0 || idx >= chapters.length - 1;
    dom.chapterIndexBadge.textContent = `第 ${idx + 1} / ${chapters.length} 章`;

    dom.chapterFavBtn.classList.toggle("active", Boolean(ch.is_favorite));
    dom.chapterReadBtn.classList.toggle("active", Boolean(ch.is_read));

    const titles = pickLangPair(ch.title_zh, ch.title_en);
    dom.readerChapterTitle.textContent = titles.primary || "无标题";
    const sub = state.lang === "en" ? ch.subtitle_en || ch.subtitle_zh : ch.subtitle_zh || ch.subtitle_en;
    dom.readerChapterSubtitle.textContent = sub || "";

    renderLoreBody(dom.readerChapterBody, ch.body_zh, ch.body_en);
  }

  // --- 我的收藏 ---

  async function loadFavorites() {
    if (!state.status || !state.status.ready) return;
    const request = ++requests.favorites;
    try {
      const [itemsData, booksData, chapters] = await Promise.all([
        queryItems(new URLSearchParams({ favorites_only: "1", q: state.q })),
        queryBooks(new URLSearchParams({ favorites_only: "1", q: state.q })),
        queryFavoriteChapters(state.q)
      ]);
      if (request !== requests.favorites) return;
      state.favorites.items = itemsData.items || [];
      const books = [];
      for (const sec of booksData.sections || []) {
        for (const b of sec.books || []) {
          books.push(b);
        }
      }
      state.favorites.books = books;
      state.favorites.chapters = chapters;
      renderFavoritesView();
    } catch (err) {
      showToast("加载收藏失败: " + err.message, true);
    }
  }

  function renderFavoritesView() {
    const { tab, items, books, chapters } = state.favorites;
    const allEmpty = tab === "all" && !items.length && !books.length && !chapters.length;
    const showItems = (tab === "all" && !allEmpty) || tab === "items";
    const showBooks = (tab === "all" && !allEmpty) || tab === "books";
    const showChapters = (tab === "all" && !allEmpty) || tab === "chapters";

    dom.favItemsSection.classList.toggle("hidden", !showItems);
    dom.favBooksSection.classList.toggle("hidden", !showBooks);
    dom.favChaptersSection.classList.toggle("hidden", !showChapters);
    dom.favoritesEmpty.classList.toggle("hidden", !allEmpty);

    dom.favoritesCountText.textContent = useEnglish(
      `收藏装备 ${items.length} 件 · 收藏传说书 ${books.length} 本 · 收藏章节 ${chapters.length} 章`,
      `Gear ${items.length} · Lore books ${books.length} · Chapters ${chapters.length}`
    );

    if (showItems) {
      renderItemsGrid(
        dom.favItemsGrid,
        dom.favItemsEmpty,
        items,
        state.codex.selectedHash,
        (item) => {
          switchMode("codex");
          openItemDetail(item.item_hash);
        },
        () => loadFavorites()
      );
    }

    if (showBooks) {
      dom.favBooksGrid.textContent = "";
      dom.favBooksEmpty.classList.toggle("hidden", books.length > 0);
      for (const book of books) {
        const title = pickLangPair(book.book_name_zh, book.book_name_en).primary;
        const progress = useEnglish(
          `已读 ${book.read_count || 0} / ${book.chapter_count || 0} 章`,
          `${book.read_count || 0} / ${book.chapter_count || 0} chapters read`
        );
        dom.favBooksGrid.appendChild(createFavoriteLoreCard(book, title, progress));
      }
    }

    if (showChapters) {
      dom.favChaptersGrid.textContent = "";
      dom.favChaptersEmpty.classList.toggle("hidden", chapters.length > 0);
      for (const { book, chapter } of chapters) {
        const title = pickLangPair(chapter.title_zh, chapter.title_en).primary;
        const bookName = pickLangPair(book.book_name_zh, book.book_name_en).primary;
        dom.favChaptersGrid.appendChild(createFavoriteLoreCard(book, title, bookName, chapter));
      }
    }
  }

  function createFavoriteLoreCard(book, title, description, chapter) {
    const card = document.createElement("div");
    card.className = "fav-book-card";
    card.appendChild(createIconBox(book.icon_path, "", null));

    const meta = document.createElement("div");
    meta.className = "lore-book-meta";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "lore-book-title";
    openButton.style.cssText = "background:transparent;border:0;padding:0;max-width:100%";
    openButton.textContent = title;
    const details = document.createElement("div");
    details.className = "lore-book-progress";
    details.textContent = description;
    meta.append(openButton, details);
    card.appendChild(meta);
    card.addEventListener("click", () => {
      switchMode("lore");
      openLoreBook(book.book_hash, chapter?.chapter_index ?? null);
    });

    const starBtn = document.createElement("button");
    starBtn.type = "button";
    starBtn.className = "star-btn active";
    starBtn.title = useEnglish("取消收藏", "Remove favorite");
    starBtn.setAttribute("aria-label", starBtn.title);
    starBtn.appendChild(createStarSvg());
    starBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      try {
        saveMark("favorites", {
          entity_type: chapter ? "lore_chapter" : "lore_book",
          entity_id: chapter ? chapter.lore_hash : book.book_hash,
          dedup_key: "",
          favorite: false
        });
        loadFavorites();
      } catch (err) {
        showToast(useEnglish("取消收藏失败: ", "Could not remove favorite: ") + err.message, true);
      }
    });
    card.appendChild(starBtn);
    return card;
  }

  // --- 全屏大图查看器 ---

  function applyLightboxTransform() {
    const lb = state.lightbox;
    dom.lightboxImg.style.transform = `translate3d(${lb.tx}px, ${lb.ty}px, 0) scale(${lb.scale})`;
    dom.lightboxZoomPct.textContent = `${Math.round(lb.scale * 100)}%`;
  }

  function fitLightboxToStage() {
    const lb = state.lightbox;
    const rect = dom.lightboxStage.getBoundingClientRect();
    if (lb.nw <= 0 || lb.nh <= 0 || rect.width <= 0 || rect.height <= 0) return;
    const pad = 32;
    const availW = Math.max(80, rect.width - pad * 2);
    const availH = Math.max(80, rect.height - pad * 2);
    const maxFit = lb.nw < 400 && lb.nh < 400 ? 3 : 1;
    lb.fitScale = Math.min(availW / lb.nw, availH / lb.nh, maxFit);
    lb.minScale = Math.min(0.25, lb.fitScale * 0.5);
    lb.maxScale = Math.max(8, lb.fitScale * 8);
    lb.scale = lb.fitScale;
    lb.tx = (rect.width - lb.nw * lb.scale) / 2;
    lb.ty = (rect.height - lb.nh * lb.scale) / 2;
    applyLightboxTransform();
  }

  function setLightboxActualSize() {
    const lb = state.lightbox;
    const rect = dom.lightboxStage.getBoundingClientRect();
    if (lb.nw <= 0 || lb.nh <= 0 || rect.width <= 0 || rect.height <= 0) return;
    lb.scale = 1;
    lb.tx = (rect.width - lb.nw) / 2;
    lb.ty = (rect.height - lb.nh) / 2;
    applyLightboxTransform();
  }

  function zoomLightboxAt(targetScale, clientX, clientY) {
    const lb = state.lightbox;
    if (!lb.open || lb.nw <= 0 || lb.nh <= 0) return;
    const next = Math.min(lb.maxScale, Math.max(lb.minScale, targetScale));
    const rect = dom.lightboxStage.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const ratio = next / lb.scale;
    lb.tx = px - (px - lb.tx) * ratio;
    lb.ty = py - (py - lb.ty) * ratio;
    lb.scale = next;
    applyLightboxTransform();
  }

  function zoomLightboxBy(factor) {
    const rect = dom.lightboxStage.getBoundingClientRect();
    zoomLightboxAt(state.lightbox.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function openLightbox(src, caption) {
    if (!src) return;
    const lb = state.lightbox;
    lb.open = true;
    lb.nw = 0;
    lb.nh = 0;
    lb.dragging = false;
    lb.moved = false;
    lb.pointerId = null;

    dom.lightboxCaption.textContent = caption || "查看大图";
    dom.lightboxResolution.textContent = "";
    dom.lightboxResolution.classList.add("hidden");
    dom.lightboxZoomPct.textContent = "100%";
    dom.lightboxImg.style.transform = "translate3d(0px, 0px, 0) scale(1)";

    dom.imageLightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    dom.lightboxImg.onload = null;
    dom.lightboxImg.onerror = null;

    let readyDone = false;
    const onReady = () => {
      if (readyDone || !lb.open) return;
      const w = dom.lightboxImg.naturalWidth || dom.lightboxImg.width;
      const h = dom.lightboxImg.naturalHeight || dom.lightboxImg.height;
      if (w <= 0 || h <= 0) return;
      readyDone = true;
      lb.nw = w;
      lb.nh = h;
      dom.lightboxResolution.textContent = `${w} × ${h}`;
      dom.lightboxResolution.classList.remove("hidden");
      fitLightboxToStage();
    };

    dom.lightboxImg.onload = onReady;
    dom.lightboxImg.onerror = () => {
      if (!lb.open) return;
      showToast("大图加载失败", true);
      closeLightbox();
    };

    dom.lightboxImg.src = src;
    dom.lightboxImg.alt = caption || "";
    if (dom.lightboxImg.complete && dom.lightboxImg.naturalWidth > 0) {
      requestAnimationFrame(onReady);
    }
  }

  function closeLightbox() {
    const lb = state.lightbox;
    lb.open = false;
    lb.dragging = false;
    lb.moved = false;
    lb.pointerId = null;
    dom.lightboxStage.classList.remove("dragging");
    dom.imageLightbox.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // --- 模式与事件绑定 ---

  function switchMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".mode-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    dom.codexView.classList.toggle("hidden", mode !== "codex");
    dom.loreView.classList.toggle("hidden", mode !== "lore");
    dom.favoritesView.classList.toggle("hidden", mode !== "favorites");
    dom.searchHitCount.classList.add("hidden");
    loadCurrentModeData();
  }

  function loadCurrentModeData() {
    if (!state.status || !state.status.ready) return;
    if (state.mode === "codex") {
      loadItems();
    } else if (state.mode === "lore") {
      loadLoreBooks();
    } else if (state.mode === "favorites") {
      loadFavorites();
    }
  }

  function bindEvents() {
    dom.brandHome.addEventListener("click", () => switchMode("codex"));

    document.querySelectorAll(".mode-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchMode(btn.dataset.mode));
    });

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lang = btn.dataset.lang;
        renderLanguage();
        document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === state.lang));
        if (state.mode === "codex") {
          renderCodexFilters();
          renderItemsGrid(dom.itemsGrid, dom.itemsEmpty, state.codex.items, state.codex.selectedHash, (item) => openItemDetail(item.item_hash));
          if (state.codex.detail) renderItemDetail();
        } else if (state.mode === "lore") {
          renderLoreSections();
          if (state.lore.bookDetail) {
            renderLoreBookDetail();
            renderLoreReader();
          }
        } else {
          renderFavoritesView();
        }
      });
    });

    // 全局搜索 120ms 防抖
    let searchTimer = null;
    dom.globalSearchInput.addEventListener("input", () => {
      const val = dom.globalSearchInput.value;
      dom.clearSearchBtn.classList.toggle("hidden", !val);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.q = val.trim();
        state.codex.page = 1;
        loadCurrentModeData();
      }, 120);
    });

    dom.clearSearchBtn.addEventListener("click", () => {
      clearTimeout(searchTimer);
      dom.globalSearchInput.value = "";
      dom.clearSearchBtn.classList.add("hidden");
      state.q = "";
      state.codex.page = 1;
      loadCurrentModeData();
    });

    dom.fulltextToggle.addEventListener("change", () => {
      state.fulltext = dom.fulltextToggle.checked;
      renderLanguage();
      state.codex.page = 1;
      loadCurrentModeData();
    });
    dom.ammoTypeSelect.addEventListener("change", () => {
      state.codex.ammoType = dom.ammoTypeSelect.value;
      state.codex.page = 1;
      loadItems();
    });
    bindBackupControls();

    // 图鉴筛选事件
    dom.hasLoreCheckbox.addEventListener("change", () => {
      state.codex.hasLore = dom.hasLoreCheckbox.checked;
      state.codex.page = 1;
      loadItems();
    });

    dom.weaponTypeSelect.addEventListener("change", () => {
      state.codex.weaponSubType = dom.weaponTypeSelect.value;
      state.codex.page = 1;
      loadItems();
    });

    // 详情抽屉按钮
    dom.closeDetailBtn.addEventListener("click", () => {
      ++requests.item;
      dom.itemDetailDrawer.classList.add("hidden");
      state.codex.selectedHash = null;
      renderItemsGrid(dom.itemsGrid, dom.itemsEmpty, state.codex.items, null, (item) => openItemDetail(item.item_hash));
    });

    dom.detailFavBtn.addEventListener("click", async () => {
      const d = state.codex.detail;
      if (!d) return;
      const nextFav = !d.is_favorite;
      try {
        saveMark("favorites", {
          entity_type: "item",
          entity_id: d.item_hash,
          dedup_key: d.dedup_key || "",
          favorite: nextFav
        });
        d.is_favorite = nextFav;
        updateDetailButtons();
        const found = state.codex.items.find((i) => i.item_hash === d.item_hash);
        if (found) {
          found.is_favorite = nextFav;
          renderItemsGrid(dom.itemsGrid, dom.itemsEmpty, state.codex.items, state.codex.selectedHash, (item) => openItemDetail(item.item_hash));
        }
      } catch (err) {
        showToast("收藏失败: " + err.message, true);
      }
    });

    dom.detailReadBtn.addEventListener("click", async () => {
      const d = state.codex.detail;
      if (!d) return;
      const nextRead = !d.is_read;
      try {
        saveMark("read_marks", {
          entity_type: "item",
          entity_id: d.item_hash,
          dedup_key: d.dedup_key || "",
          read: nextRead
        });
        d.is_read = nextRead;
        updateDetailButtons();
        const found = state.codex.items.find((i) => i.item_hash === d.item_hash);
        if (found) {
          found.is_read = nextRead;
          renderItemsGrid(dom.itemsGrid, dom.itemsEmpty, state.codex.items, state.codex.selectedHash, (item) => openItemDetail(item.item_hash));
        }
      } catch (err) {
        showToast("标记已读失败: " + err.message, true);
      }
    });

    dom.detailCopyMdBtn.addEventListener("click", () => {
      if (state.codex.detail) copyMarkdown("item", state.codex.detail.item_hash);
    });

    dom.detailDownloadMdBtn.addEventListener("click", () => {
      if (state.codex.detail) downloadMarkdown("item", state.codex.detail.item_hash);
    });

    // 详情页查看大图与大图弹窗交互
    const openDetailScreenshot = () => {
      if (dom.detailScreenshotImg.classList.contains("hidden") || !dom.detailScreenshotImg.src) return;
      const primary = dom.detailNamePrimary.textContent.trim();
      const secondary = dom.detailNameSecondary.textContent.trim();
      const caption = secondary ? `${primary} · ${secondary}` : primary;
      openLightbox(dom.detailScreenshotImg.src, caption || "装备高清展示");
    };
    dom.detailScreenshotImg.addEventListener("click", openDetailScreenshot);
    dom.detailScreenshotZoomBtn.addEventListener("click", openDetailScreenshot);

    dom.detailIconContainer.addEventListener("click", () => {
      const base = dom.detailIconContainer.querySelector(".d2-icon-base");
      if (!base || base.style.display === "none" || !base.src) return;
      const primary = dom.detailNamePrimary.textContent.trim();
      openLightbox(base.src, primary ? `${primary} · 图标` : "装备图标");
    });

    dom.lightboxZoomOutBtn.addEventListener("click", () => zoomLightboxBy(1 / 1.25));
    dom.lightboxZoomInBtn.addEventListener("click", () => zoomLightboxBy(1.25));
    dom.lightboxFitBtn.addEventListener("click", fitLightboxToStage);
    dom.lightboxActualBtn.addEventListener("click", setLightboxActualSize);
    dom.lightboxCloseBtn.addEventListener("click", closeLightbox);

    dom.lightboxStage.addEventListener(
      "wheel",
      (e) => {
        if (!state.lightbox.open) return;
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        zoomLightboxAt(state.lightbox.scale * factor, e.clientX, e.clientY);
      },
      { passive: false }
    );

    dom.lightboxStage.addEventListener("dblclick", (e) => {
      const lb = state.lightbox;
      if (!lb.open) return;
      if (Math.abs(lb.scale - lb.fitScale) < 0.03) {
        zoomLightboxAt(Math.max(lb.fitScale * 2, 1.5), e.clientX, e.clientY);
      } else {
        fitLightboxToStage();
      }
    });

    dom.lightboxStage.addEventListener("pointerdown", (e) => {
      if (!state.lightbox.open || e.button !== 0) return;
      const lb = state.lightbox;
      lb.dragging = true;
      lb.moved = false;
      lb.pointerId = e.pointerId;
      lb.startX = e.clientX;
      lb.startY = e.clientY;
      lb.originTx = lb.tx;
      lb.originTy = lb.ty;
      dom.lightboxStage.classList.add("dragging");
      try {
        dom.lightboxStage.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    dom.lightboxStage.addEventListener("pointermove", (e) => {
      const lb = state.lightbox;
      if (!lb.dragging || e.pointerId !== lb.pointerId) return;
      const dx = e.clientX - lb.startX;
      const dy = e.clientY - lb.startY;
      if (!lb.moved && Math.hypot(dx, dy) > 4) {
        lb.moved = true;
      }
      lb.tx = lb.originTx + dx;
      lb.ty = lb.originTy + dy;
      applyLightboxTransform();
    });

    const endLightboxDrag = (e) => {
      const lb = state.lightbox;
      if (!lb.dragging || (e.pointerId !== undefined && e.pointerId !== lb.pointerId)) return;
      lb.dragging = false;
      if (lb.pointerId !== null) {
        try {
          if (dom.lightboxStage.hasPointerCapture(lb.pointerId)) {
            dom.lightboxStage.releasePointerCapture(lb.pointerId);
          }
        } catch (_) {}
      }
      lb.pointerId = null;
      dom.lightboxStage.classList.remove("dragging");
    };
    dom.lightboxStage.addEventListener("pointerup", endLightboxDrag);
    dom.lightboxStage.addEventListener("pointercancel", endLightboxDrag);

    dom.lightboxStage.addEventListener("click", (e) => {
      const lb = state.lightbox;
      const wasMoved = lb.moved;
      lb.moved = false;
      if (e.target === dom.lightboxStage && !wasMoved) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!state.lightbox.open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomLightboxBy(1.25);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomLightboxBy(1 / 1.25);
      } else if (e.key === "0") {
        e.preventDefault();
        fitLightboxToStage();
      } else if (e.key === "1") {
        e.preventDefault();
        setLightboxActualSize();
      }
    });

    window.addEventListener("resize", () => {
      const lb = state.lightbox;
      if (lb.open && Math.abs(lb.scale - lb.fitScale) < 0.03) {
        fitLightboxToStage();
      }
    });

    // 传说书馆事件
    dom.loreFavOnlyCheckbox.addEventListener("change", () => {
      state.lore.favoritesOnly = dom.loreFavOnlyCheckbox.checked;
      loadLoreBooks();
    });

    dom.loreUnreadOnlyCheckbox.addEventListener("change", () => {
      state.lore.unreadOnly = dom.loreUnreadOnlyCheckbox.checked;
      loadLoreBooks();
    });

    dom.prevChapterBtn.addEventListener("click", () => {
      const book = state.lore.bookDetail;
      if (!book || !book.chapters) return;
      const chapters = [...book.chapters].sort((a, b) => a.chapter_index - b.chapter_index);
      const idx = chapters.findIndex((c) => c.chapter_index === state.lore.selectedChapterIndex);
      if (idx > 0) {
        state.lore.selectedChapterIndex = chapters[idx - 1].chapter_index;
        renderLoreBookDetail();
        renderLoreReader();
      }
    });

    dom.nextChapterBtn.addEventListener("click", () => {
      const book = state.lore.bookDetail;
      if (!book || !book.chapters) return;
      const chapters = [...book.chapters].sort((a, b) => a.chapter_index - b.chapter_index);
      const idx = chapters.findIndex((c) => c.chapter_index === state.lore.selectedChapterIndex);
      if (idx >= 0 && idx < chapters.length - 1) {
        state.lore.selectedChapterIndex = chapters[idx + 1].chapter_index;
        renderLoreBookDetail();
        renderLoreReader();
      }
    });

    dom.chapterFavBtn.addEventListener("click", async () => {
      const ch = getSelectedChapter();
      if (!ch) return;
      const nextFav = !ch.is_favorite;
      try {
        saveMark("favorites", {
          entity_type: "lore_chapter",
          entity_id: ch.lore_hash,
          dedup_key: "",
          favorite: nextFav
        });
        ch.is_favorite = nextFav;
        renderLoreBookDetail();
        renderLoreReader();
      } catch (err) {
        showToast("操作失败: " + err.message, true);
      }
    });

    dom.chapterReadBtn.addEventListener("click", async () => {
      const ch = getSelectedChapter();
      if (!ch) return;
      const nextRead = !ch.is_read;
      try {
        saveMark("read_marks", {
          entity_type: "lore_chapter",
          entity_id: ch.lore_hash,
          dedup_key: "",
          read: nextRead
        });
        ch.is_read = nextRead;
        renderLoreBookDetail();
        renderLoreReader();
        loadLoreBooks();
      } catch (err) {
        showToast("操作失败: " + err.message, true);
      }
    });

    dom.chapterCopyMdBtn.addEventListener("click", () => {
      const ch = getSelectedChapter();
      if (ch) copyMarkdown("lore_chapter", ch.lore_hash);
    });

    dom.chapterDownloadMdBtn.addEventListener("click", () => {
      const ch = getSelectedChapter();
      if (ch) downloadMarkdown("lore_chapter", ch.lore_hash);
    });

    // 我的收藏切换
    document.querySelectorAll("[data-fav-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.favorites.tab = btn.dataset.favTab;
        document.querySelectorAll("[data-fav-tab]").forEach((b) => b.classList.toggle("active", b.dataset.favTab === state.favorites.tab));
        renderFavoritesView();
      });
    });
  }

  // Static data, loaded by tier.
  const requests = { items: 0, item: 0, books: 0, book: 0, favorites: 0 };
  const canonicalHashes = new Map();
  const itemByHash = new Map();
  const bookByHash = new Map();
  const itemShards = new Map();
  const bookShards = new Map();
  let fulltextPromise;
  const BUNGIE = "https://www.bungie.net";

  function imgUrl(path) {
    if (typeof path !== "string" || !path.startsWith("/") || /^\/[\/\\]/.test(path) ||
        /[\\\u0000-\u001f\u007f]/.test(path)) return "";
    const url = new URL(path, BUNGIE);
    return url.origin === BUNGIE ? url.href : "";
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  function loadShard(cache, key, path) {
    if (!cache.has(key)) {
      cache.set(key, fetchJson(path).catch((error) => {
        cache.delete(key);
        throw error;
      }));
    }
    return cache.get(key);
  }

  function loadFulltext() {
    fulltextPromise ??= fetchJson("./data/lore_fulltext.json").then(({ items, chapters }) => ({
      items: new Map(items.map(([hash, zh, en]) => [hash, [zh, en]])),
      chapters: new Map(chapters.map(([book, index, , zh, en]) => [book + ":" + index, [zh, en]]))
    })).catch((error) => {
      fulltextPromise = undefined;
      throw error;
    });
    return fulltextPromise;
  }

  const normalize = (value) => value.normalize("NFKC").toLowerCase();
  const termsFor = (query) => [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];

  function matching(fields, terms) {
    if (!terms.length) return true;
    const values = fields.map(normalize);
    return terms.every((term) => values.some((value) => value.includes(term)));
  }

  function renderHighlighted(container, value) {
    const text = value || "";
    const terms = termsFor(state.q).sort((a, b) => b.length - a.length);
    container.textContent = "";
    if (!text || !terms.length) {
      container.textContent = text;
      return;
    }
    const escaped = terms.map((term) => term.replace(/[.*+?^\x24(){}|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(escaped.join("|"), "giu");
    const normalized = text.normalize("NFKC");
    let cursor = 0;
    for (const match of normalized.matchAll(pattern)) {
      container.append(normalized.slice(cursor, match.index));
      const mark = document.createElement("mark");
      mark.textContent = match[0];
      container.append(mark);
      cursor = match.index + match[0].length;
    }
    if (cursor) container.append(normalized.slice(cursor));
    else container.textContent = text;
  }

  function snippet(flavor, body, terms) {
    if (!body || !terms.length) return flavor;
    const text = body.replace(/\s+/g, " ").trim().normalize("NFKC");
    const normalized = text.toLowerCase();
    const first = Math.min(...terms.map((term) => normalized.indexOf(term)).filter((index) => index >= 0));
    if (!Number.isFinite(first)) return flavor;
    const start = Math.max(0, first - 32);
    const end = Math.min(text.length, first + 90);
    return (start ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  async function queryItems(params) {
    const query = normalize(params.get("q") || "").trim();
    const terms = termsFor(query);
    const fulltext = state.fulltext && terms.length ? await loadFulltext() : null;
    const filters = {
      category: "category", tier: "tier_type", bucket: "bucket_hash", weapon_sub_type: "weapon_sub_type",
      damage_type: "damage_type", ammo_type: "ammo_type", class_type: "class_type"
    };
    const active = Object.entries(filters).filter(([param]) => params.get(param));
    const hits = [];
    for (const item of itemByHash.values()) {
      if (active.some(([param, key]) => String(item[key]) !== params.get(param)) ||
          (params.get("has_lore") && !item.has_lore) ||
          (params.get("favorites_only") && !marked("favorites", "item", item.item_hash, item.dedup_key))) continue;
      const bodies = fulltext?.items.get(item.item_hash) || [];
      const names = [item.name_zh, item.name_en];
      const flavors = [item.flavor_zh, item.flavor_en];
      let rank = 0;
      if (terms.length) {
        if (!matching([...names, ...flavors, ...bodies], terms)) continue;
        const titles = names.map(normalize);
        rank = titles.includes(query) ? 0 : titles.some((title) => title.startsWith(query)) ? 1 :
          matching(names, terms) ? 2 : matching([...names, ...flavors], terms) ? 3 : 4;
      }
      hits.push({ item, bodies, rank });
    }
    if (terms.length) hits.sort((a, b) => a.rank - b.rank);
    const size = Number(params.get("page_size")) || hits.length || 1;
    const start = ((Number(params.get("page")) || 1) - 1) * size;
    const items = hits.slice(start, start + size).map(({ item, bodies }) => ({
      ...item,
      is_favorite: marked("favorites", "item", item.item_hash, item.dedup_key),
      is_read: marked("read_marks", "item", item.item_hash, item.dedup_key),
      snippet_zh: snippet(item.flavor_zh, bodies[0], terms),
      snippet_en: snippet(item.flavor_en, bodies[1], terms)
    }));
    return { total: hits.length, items };
  }

  async function getItemDetail(hash) {
    const itemHash = canonicalHashes.get(Number(hash)) ?? Number(hash);
    const item = itemByHash.get(itemHash);
    if (!item) throw new Error("Item unavailable");
    const bucket = String(itemHash % state.status.shards.item_buckets).padStart(2, "0");
    const data = await loadShard(itemShards, bucket, "./data/items/" + bucket + ".json");
    if (!data[itemHash]) throw new Error("Item detail unavailable");
    return {
      ...item, ...data[itemHash],
      is_favorite: marked("favorites", "item", itemHash, item.dedup_key),
      is_read: marked("read_marks", "item", itemHash, item.dedup_key)
    };
  }

  async function getBookDetail(hash) {
    const id = Number(hash);
    if (!bookByHash.has(id)) throw new Error("Lore book unavailable");
    const book = await loadShard(bookShards, id, "./data/books/" + id + ".json");
    return {
      ...book,
      is_favorite: marked("favorites", "lore_book", id),
      chapters: book.chapters.map((chapter) => ({
        ...chapter,
        is_favorite: marked("favorites", "lore_chapter", chapter.lore_hash),
        is_read: marked("read_marks", "lore_chapter", chapter.lore_hash)
      }))
    };
  }

  async function queryBooks(params) {
    const terms = termsFor(params.get("q") || "");
    const fulltext = state.fulltext && terms.length ? await loadFulltext() : null;
    const sections = new Map();
    for (const book of bookByHash.values()) {
      const is_favorite = marked("favorites", "lore_book", book.book_hash);
      if (params.get("favorites_only") && !is_favorite) continue;
      const read_count = book.chapters.filter((chapter) => marked("read_marks", "lore_chapter", chapter.lore_hash)).length;
      if (params.get("unread_only") && read_count >= book.chapter_count) continue;
      const fields = [book.book_name_zh, book.book_name_en, book.desc_zh, book.desc_en,
        book.section_name_zh, book.section_name_en];
      const matched_chapters = terms.length ? book.chapters.filter((chapter) => matching([
        ...fields, chapter.title_zh, chapter.title_en,
        ...(fulltext?.chapters.get(book.book_hash + ":" + chapter.chapter_index) || [])
      ], terms)) : [];
      if (!matched_chapters.length && !matching(fields, terms)) continue;

      const key = JSON.stringify([book.section_name_zh, book.section_name_en]);
      if (!sections.has(key)) {
        sections.set(key, { name_zh: book.section_name_zh, name_en: book.section_name_en, books: [] });
      }
      sections.get(key).books.push({ ...book, is_favorite, read_count, matched_chapters });
    }
    return { sections: [...sections.values()] };
  }

  async function queryFavoriteChapters(query) {
    const terms = termsFor(query);
    const fulltext = state.fulltext && terms.length ? await loadFulltext() : null;
    const chapters = [];
    for (const book of bookByHash.values()) {
      for (const chapter of book.chapters) {
        if (!marked("favorites", "lore_chapter", chapter.lore_hash)) continue;
        const body = fulltext?.chapters.get(book.book_hash + ":" + chapter.chapter_index) || [];
        if (matching([book.book_name_zh, book.book_name_en, chapter.title_zh, chapter.title_en, ...body], terms)) {
          chapters.push({ book, chapter });
        }
      }
    }
    return chapters;
  }

  const markKeys = { favorites: "d2lib_favorites_v1", read_marks: "d2lib_read_marks_v1" };
  const entityTypes = new Set(["item", "lore_book", "lore_chapter"]);
  const markId = (type, id) => type + ":" + id;
  const markDedup = (type, key) => type + ":dedup:" + key;

  function indexMarks(records, { skipInvalid = false } = {}) {
    if (!Array.isArray(records)) throw new Error("Invalid mark list");
    const marks = new Map();
    for (const record of records) {
      if (!record || !entityTypes.has(record.entity_type) ||
          !Number.isInteger(record.entity_id) || record.entity_id < 0 || record.entity_id > 0xffffffff ||
          typeof record.dedup_key !== "string") {
        if (skipInvalid) continue;
        throw new Error("Invalid mark");
      }
      const { entity_type, entity_id, dedup_key } = record;
      marks.set(markId(entity_type, entity_id), { entity_type, entity_id, dedup_key });
    }
    return marks;
  }

  function loadMarks(table) {
    try {
      return indexMarks(JSON.parse(localStorage.getItem(markKeys[table]) || "[]"), { skipInvalid: true });
    } catch {
      return new Map();
    }
  }

  const userMarks = { favorites: loadMarks("favorites"), read_marks: loadMarks("read_marks") };
  const dedupMarks = {};

  function refreshDedup(table) {
    dedupMarks[table] = new Set([...userMarks[table].values()]
      .filter((entry) => entry.dedup_key)
      .map((entry) => markDedup(entry.entity_type, entry.dedup_key)));
  }

  for (const table of Object.keys(markKeys)) refreshDedup(table);

  function marked(table, type, id, dedup = "") {
    return userMarks[table].has(markId(type, id)) || Boolean(dedup && dedupMarks[table].has(markDedup(type, dedup)));
  }

  function persistMarks(table, marks) {
    localStorage.setItem(markKeys[table], JSON.stringify([...marks.values()]));
    userMarks[table] = marks;
    refreshDedup(table);
  }

  function saveMark(table, { entity_type, entity_id, dedup_key, favorite, read }) {
    const records = loadMarks(table);
    const key = markId(entity_type, entity_id);
    for (const [id, entry] of records) {
      if (id === key || (dedup_key && entry.entity_type === entity_type && entry.dedup_key === dedup_key)) {
        records.delete(id);
      }
    }
    if (favorite ?? read) records.set(key, { entity_type, entity_id, dedup_key });
    persistMarks(table, records);
  }

  function downloadFile(name, body, type) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bindBackupControls() {
    const file = $("backupFile");
    $("exportBackup").addEventListener("click", () => {
      const backup = { version: 1, favorites: [...userMarks.favorites.values()], read_marks: [...userMarks.read_marks.values()] };
      downloadFile("destiny2-library-backup.json", JSON.stringify(backup, null, 2), "application/json");
    });
    $("importBackup").addEventListener("click", () => file.click());
    file.addEventListener("change", async () => {
      try {
        if (!file.files[0]) return;
        const backup = JSON.parse(await file.files[0].text());
        if (backup.version !== 1) throw new Error("Unsupported backup version");
        const favorites = indexMarks(backup.favorites);
        const readMarks = indexMarks(backup.read_marks);
        persistMarks("favorites", new Map([...loadMarks("favorites"), ...favorites]));
        persistMarks("read_marks", new Map([...loadMarks("read_marks"), ...readMarks]));
        refreshMarkedDetails();
        loadCurrentModeData();
        showToast(state.lang === "en" ? "Backup imported" : "已导入备份");
      } catch (error) {
        showToast((state.lang === "en" ? "Import failed: " : "导入失败: ") + error.message, true);
      } finally {
        file.value = "";
      }
    });

    window.addEventListener("storage", (event) => {
      for (const table of Object.keys(markKeys)) {
        if (event.key === null || event.key === markKeys[table]) {
          userMarks[table] = loadMarks(table);
          refreshDedup(table);
        }
      }
      refreshMarkedDetails();
      loadCurrentModeData();
    });
  }

  function refreshMarkedDetails() {
    const item = state.codex.detail;
    if (item) {
      item.is_favorite = marked("favorites", "item", item.item_hash, item.dedup_key);
      item.is_read = marked("read_marks", "item", item.item_hash, item.dedup_key);
      updateDetailButtons();
    }
    const book = state.lore.bookDetail;
    if (book) {
      book.is_favorite = marked("favorites", "lore_book", book.book_hash);
      for (const chapter of book.chapters) {
        chapter.is_favorite = marked("favorites", "lore_chapter", chapter.lore_hash);
        chapter.is_read = marked("read_marks", "lore_chapter", chapter.lore_hash);
      }
      renderLoreBookDetail();
      renderLoreReader();
    }
  }

  function markdownHeading(value) {
    return value.trim().replace(/\s+/g, " ").replace(/[\\\x60*[\]#_]/g, "\\$&");
  }

  async function exportMarkdown(entity, id) {
    const languages = state.lang === "both" ? ["zh", "en"] : [state.lang];
    const output = [];
    if (entity === "item") {
      const item = state.codex.detail?.item_hash === id ? state.codex.detail : await getItemDetail(id);
      for (const lang of languages) {
        const zh = lang === "zh";
        const kind = item["type_name_" + lang] || item.category;
        const metadata = [
          (zh ? "- 分类 / 品级: " : "- Category / Tier: ") + kind + " / " + item["tier_name_" + lang],
          (zh ? "- 来源: " : "- Source: ") + (item["source_" + lang] || "—"),
          (zh ? "- 版本数: " : "- Versions: ") + item.reissue_count +
            " (" + item.variants.map((variant) => variant.item_hash).join(", ") + ")"];
        if (item.category === "weapon") {
          metadata.push((zh ? "- 伤害 / 弹药类型: " : "- Damage / Ammo type: ") +
            (item["damage_name_" + lang] || "—") + " / " + item.ammo_type);
          const breaker = item["breaker_name_" + lang];
          if (breaker) metadata.push((zh ? "- 勇士克制: " : "- Champion counter: ") + breaker);
        }
        if (item.category === "armor") {
          const classes = zh ? ["泰坦", "猎人", "术士", "通用"] : ["Titan", "Hunter", "Warlock", "Any"];
          metadata.push((zh ? "- 职业: " : "- Class: ") + classes[Math.min(3, Math.max(0, item.class_type))]);
        }
        output.push("# " + markdownHeading(item["name_" + lang]), metadata.join("\n"));
        if (item["flavor_" + lang]) output.push(zh ? "## 简介" : "## Flavor text", item["flavor_" + lang]);
        if (item.lore) {
          output.push("## " + (markdownHeading(item.lore["title_" + lang]) || (zh ? "传说" : "Lore")),
            item.lore["subtitle_" + lang], item.lore["body_" + lang]);
        }
      }
    } else if (entity === "lore_book") {
      const book = state.lore.bookDetail?.book_hash === id ? state.lore.bookDetail : await getBookDetail(id);
      for (const lang of languages) {
        output.push("# " + markdownHeading(book["book_name_" + lang]), book["desc_" + lang]);
        for (const chapter of book.chapters) {
          output.push("## " + (chapter.chapter_index + 1) + ". " + markdownHeading(chapter["title_" + lang]),
            chapter["subtitle_" + lang], chapter["body_" + lang]);
        }
      }
    } else {
      const chapter = getSelectedChapter();
      if (!chapter || chapter.lore_hash !== id) throw new Error("Chapter unavailable");
      for (const lang of languages) {
        output.push("# " + (markdownHeading(chapter["title_" + lang]) || (lang === "zh" ? "传说" : "Lore")),
          chapter["subtitle_" + lang], chapter["body_" + lang]);
      }
    }
    return output.filter(Boolean).join("\n\n") + "\n";
  }

  async function copyMarkdown(entity, id) {
    try {
      const markdown = await exportMarkdown(entity, id);
      try {
        await navigator.clipboard.writeText(markdown);
      } catch {
        const field = document.createElement("textarea");
        field.value = markdown;
        field.style.cssText = "position:fixed;opacity:0";
        document.body.append(field);
        try {
          field.select();
          if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
        } finally {
          field.remove();
        }
      }
      showToast(state.lang === "en" ? "Markdown copied" : "已复制 Markdown");
    } catch (error) {
      showToast((state.lang === "en" ? "Copy failed: " : "复制失败: ") + error.message, true);
    }
  }

  async function downloadMarkdown(entity, id) {
    try {
      downloadFile(entity + "-" + id + "-" + state.lang + ".md", await exportMarkdown(entity, id), "text/markdown;charset=utf-8");
    } catch (error) {
      showToast((state.lang === "en" ? "Download failed: " : "下载失败: ") + error.message, true);
    }
  }

  const useEnglish = (zh, en) => state.lang === "en" ? en : zh;


  const translatedLabels = Array.from(document.querySelectorAll("[data-label-en]"), (el) => [el, el.textContent]);

  function renderLanguage() {
    for (const [el, chinese] of translatedLabels) el.textContent = useEnglish(chinese, el.dataset.labelEn);
    document.documentElement.lang = useEnglish("zh-CN", "en");
    const labels = {
      fulltextLabel: ["搜传说正文", "Search Lore Text"],
      exportBackup: ["导出备份", "Export Backup"],
      importBackup: ["导入备份", "Import Backup"]
    };
    for (const [id, names] of Object.entries(labels)) $(id).textContent = useEnglish(...names);

    dom.globalSearchInput.placeholder = state.fulltext
      ? useEnglish("搜索装备、简介或传说正文…", "Search gear, flavor text, or lore…")
      : useEnglish("搜索装备、简介或传说书…", "Search gear, flavor text, or lore books…");
    const ammoLabels = ["All ammo types", "Primary", "Special", "Heavy"];
    for (const [index, option] of Array.from(dom.ammoTypeSelect.options).entries()) {
      option.textContent = useEnglish(AMMO_LABELS[index] || "全部弹药", ammoLabels[index]);
    }
    if (state.status?.ready) {
      const version = state.status.manifest_version;
      const shortVersion = version.split("-")[0];
      dom.manifestBadge.textContent = "Manifest " + shortVersion + useEnglish(" · 每周更新", " · Weekly");
      dom.manifestBadge.title = version + " · " + state.status.updated_at;
    }
  }

  async function init() {
    bindEvents();
    renderLanguage();
    try {
      const [meta, index] = await Promise.all([fetchJson("./data/meta.json"), fetchJson("./data/index.json")]);
      const weapons = new Map();
      const damage = new Map();
      for (const item of index.items) {
        itemByHash.set(item.item_hash, item);
        for (const variant of item.variant_hashes) canonicalHashes.set(variant, item.item_hash);
        if (item.weapon_sub_type && !weapons.has(item.weapon_sub_type)) {
          weapons.set(item.weapon_sub_type, { id: item.weapon_sub_type, name_zh: item.type_name_zh, name_en: item.type_name_en });
        }
        if (item.damage_type && item.damage_name_en && !damage.has(item.damage_type)) {
          damage.set(item.damage_type, {
            id: item.damage_type, name_zh: item.damage_name_zh, name_en: item.damage_name_en, icon_path: item.damage_icon_path
          });
        }
      }
      for (const book of index.books) bookByHash.set(book.book_hash, book);
      const byId = (a, b) => a.id - b.id;
      state.status = { ...meta, ready: true, filters: {
        weapon_types: [...weapons.values()].sort(byId), damage_types: [...damage.values()].sort(byId)
      } };
      renderLanguage();
      renderCodexFilters();
      dom.dataStatus.classList.add("hidden");
      dom.mainWorkspace.classList.remove("hidden");
      loadCurrentModeData();
    } catch (error) {
      dom.manifestBadge.textContent = useEnglish("数据不可用", "Data unavailable");
      dom.dataStatus.textContent = useEnglish("无法加载图鉴数据。请刷新重试。", "Could not load library data. Refresh to retry.");
      console.error(error);
    }
  }

  init();
})();
