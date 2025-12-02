document.addEventListener("DOMContentLoaded", () => {
  const suits = [
    { id: "hearts", name: "Hearts", symbol: "♥" },
    { id: "diamonds", name: "Diamonds", symbol: "♦" },
    { id: "clubs", name: "Clubs", symbol: "♣" },
    { id: "spades", name: "Spades", symbol: "♠" }
  ];

  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  const state = {
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    frontCardColor: "#ffffff",
    backCardColor: "#0044aa",
    suits: {
      hearts: { color: "#d32f2f", icon: null },
      diamonds: { color: "#e53935", icon: null },
      clubs: { color: "#1a237e", icon: null },
      spades: { color: "#000000", icon: null }
    },
    // faces[suitId][rank] = dataURL
    faces: {
      hearts: {},
      diamonds: {},
      clubs: {},
      spades: {},
      joker: {} // joker artwork
    },
    // Face frame settings
    faceFrame: {
      marginPx: 0,
      radiusPx: 0
    },
    // Card physical sizing
    cardWidthMm: 63,
    cardDpi: 72,
    // Font scaling (in rem, multiplied by card-scale)
    fontSizes: {
      cornerRank: 6,
      centerAce: 35,
      pip: 10
    },
    // Center area inset (% from edges)
    centerInsetPercent: 18,
    // View mode: "front" | "back"
    view: "front"
  };

  // Pip layout templates for number cards (approx. standard layouts)
  // Coordinates are percentages inside the card-center area (0-100).
  const pipTemplates = {
    2: [
      { x: 50, y: 20 },
      { x: 50, y: 80 }
    ],
    3: [
      { x: 50, y: 20 },
      { x: 50, y: 50 },
      { x: 50, y: 80 }
    ],
    4: [
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 30, y: 80 },
      { x: 70, y: 80 }
    ],
    5: [
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 50, y: 50 },
      { x: 30, y: 80 },
      { x: 70, y: 80 }
    ],
    6: [
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 30, y: 50 },
      { x: 70, y: 50 },
      { x: 30, y: 80 },
      { x: 70, y: 80 }
    ],
    7: [
      { x: 50, y: 10 },
      { x: 30, y: 25 },
      { x: 70, y: 25 },
      { x: 30, y: 50 },
      { x: 70, y: 50 },
      { x: 30, y: 75 },
      { x: 70, y: 75 }
    ],
    8: [
      { x: 30, y: 15 },
      { x: 70, y: 15 },
      { x: 30, y: 35 },
      { x: 70, y: 35 },
      { x: 30, y: 65 },
      { x: 70, y: 65 },
      { x: 30, y: 85 },
      { x: 70, y: 85 }
    ],
    9: [
      { x: 30, y: 15 },
      { x: 70, y: 15 },
      { x: 30, y: 35 },
      { x: 70, y: 35 },
      { x: 50, y: 50 },
      { x: 30, y: 65 },
      { x: 70, y: 65 },
      { x: 30, y: 85 },
      { x: 70, y: 85 }
    ],
    10: [
      { x: 30, y: 15 },
      { x: 70, y: 15 },
      { x: 30, y: 30 },
      { x: 70, y: 30 },
      { x: 30, y: 50 },
      { x: 70, y: 50 },
      { x: 30, y: 70 },
      { x: 70, y: 70 },
      { x: 30, y: 85 },
      { x: 70, y: 85 }
    ]
  };

  const sheet = document.getElementById("sheet");
  if (!sheet) {
    console.error('[Uncut Sheet] Element with id="sheet" not found in DOM.');
    return;
  }

  // Build grid container
  const sheetInner = document.createElement("div");
  sheetInner.className = "sheet-inner";
  sheet.appendChild(sheetInner);

  // Build card metadata: 52 normal cards + 2 jokers at the end
  const cardsMeta = [];

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      cardsMeta.push({ suit: suit.id, rank });
    });
  });

  // Two jokers
  cardsMeta.push(
    { suit: "joker", rank: "JOKER-1" },
    { suit: "joker", rank: "JOKER-2" }
  );

  // Create card elements
  cardsMeta.forEach(({ suit, rank }) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.suit = suit;
    card.dataset.rank = rank;
    sheetInner.appendChild(card);
  });

  /* === Root-level style sync === */

  function applyRootStyles() {
    const root = document.documentElement;
    root.style.setProperty("--label-font", state.fontFamily);

    root.style.setProperty("--card-front-bg", state.frontCardColor);
    root.style.setProperty("--card-back-bg", state.backCardColor);

    root.style.setProperty("--suit-color-hearts", state.suits.hearts.color);
    root.style.setProperty("--suit-color-diamonds", state.suits.diamonds.color);
    root.style.setProperty("--suit-color-clubs", state.suits.clubs.color);
    root.style.setProperty("--suit-color-spades", state.suits.spades.color);

    root.style.setProperty(
      "--face-frame-margin",
      `${state.faceFrame.marginPx}px`
    );
    root.style.setProperty(
      "--face-frame-radius",
      `${state.faceFrame.radiusPx}px`
    );

    // mm → px conversion: px = mm / 25.4 * dpi
    const widthPx = (state.cardWidthMm / 25.4) * state.cardDpi;
    root.style.setProperty("--card-width", `${widthPx}px`);

    // Scale factor relative to reference size (63mm @ 300dpi)
    const baseWidthMm = 63;
    const baseDpi = 300;
    const baseWidthPx = (baseWidthMm / 25.4) * baseDpi;
    const scale = widthPx / baseWidthPx;
    const safeScale = Math.max(0.3, Math.min(scale, 4));
    root.style.setProperty("--card-scale", safeScale.toString());

    // Font sizes
    root.style.setProperty("--corner-rank-font-rem", state.fontSizes.cornerRank);
    root.style.setProperty("--center-ace-font-rem", state.fontSizes.centerAce);
    root.style.setProperty("--pip-font-rem", state.fontSizes.pip);

    // Center inset
    root.style.setProperty(
      "--center-inset-percent",
      state.centerInsetPercent + "%"
    );
  }

  /* === Download helper === */

  function triggerDownload(canvas, filename) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* === Rendering helpers === */

  function renderCardFront(cardInner, suitId, rank) {
    const isJoker = suitId === "joker";
    const center = document.createElement("div");
    center.className = "card-center";

    if (isJoker) {
      // Joker front: corners + frame, optional image
      const cornerTop = document.createElement("div");
      cornerTop.className = "corner corner-top";
      const cornerBottom = document.createElement("div");
      cornerBottom.className = "corner corner-bottom";

      const labelText = "JOKER";

      const rankTop = document.createElement("div");
      rankTop.className = "rank";
      rankTop.textContent = labelText;
      const suitTop = document.createElement("div");
      suitTop.className = "suit-symbol";
      suitTop.textContent = "★";

      cornerTop.appendChild(rankTop);
      cornerTop.appendChild(suitTop);

      const rankBottom = document.createElement("div");
      rankBottom.className = "rank";
      rankBottom.textContent = labelText;
      const suitBottom = document.createElement("div");
      suitBottom.className = "suit-symbol";
      suitBottom.textContent = "★";

      cornerBottom.appendChild(rankBottom);
      cornerBottom.appendChild(suitBottom);

      cardInner.appendChild(cornerTop);
      cardInner.appendChild(cornerBottom);

      // Joker face image (if any)
      const jokerFaces = state.faces.joker || {};
      const faceImg = jokerFaces[rank] || null;

      const frame = document.createElement("div");
      frame.className = "face-frame";

      if (faceImg) {
        const img = document.createElement("img");
        img.src = faceImg;
        img.alt = "Joker";
        frame.appendChild(img);
      } else {
        const label = document.createElement("div");
        label.className = "center-suit";
        label.textContent = "JOKER";
        frame.appendChild(label);
      }

      center.appendChild(frame);
      cardInner.appendChild(center);
      return;
    }

    const suitDef = suits.find((s) => s.id === suitId);
    const suitSettings = state.suits[suitId];

    const isFace = rank === "J" || rank === "Q" || rank === "K";
    const faceImg =
      state.faces[suitId] && state.faces[suitId][rank]
        ? state.faces[suitId][rank]
        : null;

    // Corners
    const cornerTop = document.createElement("div");
    cornerTop.className = "corner corner-top";
    const rankTop = document.createElement("div");
    rankTop.className = "rank";
    rankTop.textContent = rank;
    const suitTop = document.createElement("div");
    suitTop.className = "suit-symbol";

    const cornerBottom = document.createElement("div");
    cornerBottom.className = "corner corner-bottom";
    const rankBottom = document.createElement("div");
    rankBottom.className = "rank";
    rankBottom.textContent = rank;
    const suitBottom = document.createElement("div");
    suitBottom.className = "suit-symbol";

    cornerTop.appendChild(rankTop);
    cornerTop.appendChild(suitTop);
    cornerBottom.appendChild(rankBottom);
    cornerBottom.appendChild(suitBottom);

    cardInner.appendChild(cornerTop);
    cardInner.appendChild(cornerBottom);
    cardInner.appendChild(center);

    // Corner suit symbols (text or icon)
    const cornerSuitEls = [suitTop, suitBottom];
    cornerSuitEls.forEach((el) => {
      if (suitSettings && suitSettings.icon) {
        el.innerHTML = "";
        const img = document.createElement("img");
        img.src = suitSettings.icon;
        img.alt = `${suitDef.name} icon`;
        el.appendChild(img);
      } else {
        el.textContent = suitDef.symbol;
      }
    });

    // Center logic
    if (isFace) {
      // Face cards: frame only, face art optional
      const frame = document.createElement("div");
      frame.className = "face-frame";

      if (faceImg) {
        const img = document.createElement("img");
        img.src = faceImg;
        img.alt = `${rank} of ${suitDef.name}`;
        frame.appendChild(img);
      }

      center.appendChild(frame);
    } else if (rank === "A") {
      // Ace: single big center symbol
      if (suitSettings && suitSettings.icon) {
        const img = document.createElement("img");
        img.src = suitSettings.icon;
        img.alt = `${suitDef.name} icon`;
        img.className = "center-suit center-ace";
        center.appendChild(img);
      } else {
        const span = document.createElement("span");
        span.className = "center-suit center-ace";
        span.textContent = suitDef.symbol;
        center.appendChild(span);
      }
    } else {
      // Number cards (2–10): pip layout based on templates
      const numericRank = parseInt(rank, 10);
      const template = pipTemplates[numericRank];

      if (template && template.length > 0) {
        const layout = document.createElement("div");
        layout.className = "pip-layout";

        template.forEach((pos) => {
          const pip = document.createElement("span");
          pip.className = "pip";

          if (suitSettings && suitSettings.icon) {
            const img = document.createElement("img");
            img.src = suitSettings.icon;
            img.alt = `${suitDef.name} icon`;
            pip.appendChild(img);
          } else {
            pip.textContent = suitDef.symbol;
          }

          pip.style.left = `${pos.x}%`;
          pip.style.top = `${pos.y}%`;

          layout.appendChild(pip);
        });

        center.appendChild(layout);
      } else {
        // Fallback / safety: single center symbol
        if (suitSettings && suitSettings.icon) {
          const img = document.createElement("img");
          img.src = suitSettings.icon;
          img.alt = `${suitDef.name} icon`;
          img.className = "center-suit";
          center.appendChild(img);
        } else {
          const span = document.createElement("span");
          span.className = "center-suit";
          span.textContent = suitDef.symbol;
          center.appendChild(span);
        }
      }
    }
  }

  function renderCardBack(cardInner) {
    const back = document.createElement("div");
    back.className = "card-back";
    // No text label – just the pattern
    cardInner.appendChild(back);
  }

  /* === Master update === */

  function updateCards() {
    applyRootStyles();

    const cards = sheetInner.querySelectorAll(".card");
    cards.forEach((card) => {
      const suitId = card.dataset.suit;
      const rank = card.dataset.rank;

      const isBack = state.view === "back";
      card.classList.toggle("back-view", isBack);

      // Clear and rebuild inner
      card.innerHTML = "";
      const inner = document.createElement("div");
      inner.className = "card-inner";
      card.appendChild(inner);

      if (isBack) {
        renderCardBack(inner);
      } else {
        renderCardFront(inner, suitId, rank);
      }
    });
  }

  /* === Export 6×9 === */

  async function exportSheets6x9() {
    if (typeof html2canvas === "undefined") {
      alert("html2canvas is not loaded. Check the script tag in index.html.");
      return;
    }

    const sheetElement = document.getElementById("sheet");
    if (!sheetElement) return;

    const prevView = state.view;

    // Save current layout styles
    const prevDisplay = sheetInner.style.display;
    const prevGridTemplate = sheetInner.style.gridTemplateColumns;
    const prevGap = sheetInner.style.gap;

    // Force 6×9 grid layout for export
    sheetElement.scrollTop = 0;
    sheetElement.scrollLeft = 0;
    sheetInner.style.display = "grid";
    sheetInner.style.gridTemplateColumns = "repeat(6, auto)";
    sheetInner.style.gap = "0";

    try {
      // FRONT SHEET
      state.view = "front";
      updateCards();

      const canvasFront = await html2canvas(sheetElement, {
        backgroundColor: null,
        scale: 2
      });
      triggerDownload(canvasFront, "deck-front-6x9.png");

      // BACK SHEET
      state.view = "back";
      updateCards();

      const canvasBack = await html2canvas(sheetElement, {
        backgroundColor: null,
        scale: 2
      });
      triggerDownload(canvasBack, "deck-back-6x9.png");
    } catch (err) {
      console.error("[Export 6x9] Error during export:", err);
      alert("Export failed. Check the console for details.");
    } finally {
      // Restore previous view and layout
      state.view = prevView;
      updateCards();

      sheetInner.style.display = prevDisplay;
      sheetInner.style.gridTemplateColumns = prevGridTemplate;
      sheetInner.style.gap = prevGap;
    }
  }

  /* === Controls wiring === */

  // Font controls
  const fontSelect = document.getElementById("fontSelect");
  const fontCustom = document.getElementById("fontCustom");

  function updateFont() {
    const custom = fontCustom.value.trim();
    if (custom) {
      state.fontFamily = custom;
    } else {
      state.fontFamily = fontSelect.value;
    }
    updateCards();
  }

  fontSelect.addEventListener("change", updateFont);
  fontCustom.addEventListener("input", updateFont);

  // Card colors
  const frontCardColor = document.getElementById("frontCardColor");
  if (frontCardColor) {
    frontCardColor.addEventListener("input", (e) => {
      state.frontCardColor = e.target.value;
      updateCards();
    });
  }

  const backCardColor = document.getElementById("backCardColor");
  if (backCardColor) {
    backCardColor.addEventListener("input", (e) => {
      state.backCardColor = e.target.value;
      updateCards();
    });
  }

  // Suit colors
  const colorInputs = {
    hearts: document.getElementById("color-hearts"),
    diamonds: document.getElementById("color-diamonds"),
    clubs: document.getElementById("color-clubs"),
    spades: document.getElementById("color-spades")
  };

  Object.entries(colorInputs).forEach(([suitId, input]) => {
    if (!input) return;
    input.addEventListener("input", (e) => {
      state.suits[suitId].color = e.target.value;
      updateCards();
    });
  });

  // Suit icon file inputs
  const suitIconInputs = document.querySelectorAll("[data-suit-icon]");
  suitIconInputs.forEach((input) => {
    const suitId = input.dataset.suitIcon;
    input.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.suits[suitId].icon = reader.result;
        updateCards();
      };
      reader.readAsDataURL(file);
    });
  });

  // Face image file inputs (including jokers)
  const faceInputs = document.querySelectorAll("[data-face]");
  faceInputs.forEach((input) => {
    const [suitId, rank] = input.dataset.face.split(":");
    input.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (!state.faces[suitId]) state.faces[suitId] = {};
        state.faces[suitId][rank] = reader.result;
        updateCards();
      };
      reader.readAsDataURL(file);
    });
  });

  // Face frame controls
  const faceMargin = document.getElementById("faceMargin");
  const faceRadius = document.getElementById("faceRadius");

  if (faceMargin) {
    faceMargin.addEventListener("input", (e) => {
      state.faceFrame.marginPx = parseInt(e.target.value, 10) || 0;
      updateCards();
    });
  }

  if (faceRadius) {
    faceRadius.addEventListener("input", (e) => {
      state.faceFrame.radiusPx = parseInt(e.target.value, 10) || 0;
      updateCards();
    });
  }

  // Card size controls: mm & DPI
  const cardWidthMmInput = document.getElementById("cardWidthMm");
  const cardDpiSelect = document.getElementById("cardDpi");

  if (cardWidthMmInput) {
    cardWidthMmInput.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      if (!Number.isNaN(value) && value > 0) {
        state.cardWidthMm = value;
        updateCards();
      }
    });
  }

  if (cardDpiSelect) {
    cardDpiSelect.addEventListener("change", (e) => {
      const value = parseInt(e.target.value, 10);
      if (!Number.isNaN(value) && value > 0) {
        state.cardDpi = value;
        updateCards();
      }
    });
  }

  // Font size controls (merged rank + corner, ace/center, pips)
  const cornerRankSize = document.getElementById("fontCornerRankSize");
  const centerAceSize = document.getElementById("fontAceCenterSize");
  const pipSize = document.getElementById("fontPipSize");

  if (cornerRankSize) {
    cornerRankSize.addEventListener("input", (e) => {
      state.fontSizes.cornerRank = parseFloat(e.target.value);
      updateCards();
    });
  }

  if (centerAceSize) {
    centerAceSize.addEventListener("input", (e) => {
      state.fontSizes.centerAce = parseFloat(e.target.value);
      updateCards();
    });
  }

  if (pipSize) {
    pipSize.addEventListener("input", (e) => {
      state.fontSizes.pip = parseFloat(e.target.value);
      updateCards();
    });
  }

  // Center inset slider
  const insetInput = document.getElementById("centerInsetPercent");
  if (insetInput) {
    insetInput.addEventListener("input", (e) => {
      state.centerInsetPercent = parseFloat(e.target.value);
      updateCards();
    });
  }

  // View tabs (front/back)
  const viewTabs = document.querySelectorAll(".view-tab");
  viewTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view === "back" ? "back" : "front";
      state.view = view;

      viewTabs.forEach((b) => {
        b.classList.toggle("active", b === btn);
      });

      updateCards();
    });
  });

  // Export 6×9 sheets (front & back)
  const exportBtn = document.getElementById("exportSheetsBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportSheets6x9();
    });
  }

  // Initial render
  updateCards();
});
