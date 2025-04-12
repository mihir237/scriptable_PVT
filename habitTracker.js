// Countdown-style habit tracker widget (2x1 layout, unlimited entries)

// =====================
// CONFIGURATION
// =====================
const HABIT_NAME = "Bad";
const GRID_COLUMNS = 7; // Wider for 2x1 layout
const GRID_ROWS = 5;
const TOTAL_DAYS = GRID_COLUMNS * GRID_ROWS;
const DATA_FILE = "habit-heatmap-data.json";
// Background overlay color and opacity
const BG_COLOR = "#406260";       // Overlay color in hex format
const BG_OVERLAY_OPACITY = 0.5;   // Overlay opacity (0-1)

// Dot intensity colors and characters
const COLOR_MAP = [
    new Color("#e5e7eb"),    // 0 - light gray
    new Color("#fca5a5"),    // 1
    new Color("#f87171"),    // 2
    new Color("#ef4444"),    // 3+
    new Color("#b91c1c")     // 6+ - intense red
];

const DOT_CHAR_MAP = ["○", "◔", "◑", "●", "●"];

// =====================
// DATA HANDLING
// =====================
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const path = fm.joinPath(dir, DATA_FILE);

let data = {};
if (fm.fileExists(path)) {
    try {
        data = JSON.parse(fm.readString(path));
    } catch {
        console.log("Invalid JSON. Resetting data.");
        data = {};
    }
}

const today = new Date();
const todayKey = today.toISOString().slice(0, 10);

// Logging via alert if run manually
if (!config.runsInWidget) {
  const alert = new Alert();
  alert.title = Did you do "${HABIT_NAME}"?;
  alert.message = "Tap ‘Yes’ every time you do it today.";
  alert.addAction("Yes");
  alert.addCancelAction("Cancel");

  const response = await alert.presentAlert();
  if (response === 0) {
    data[todayKey] = (data[todayKey] || 0) + 1;
    fm.writeString(path, JSON.stringify(data));
    console.log(Logged 1 ${HABIT_NAME} for today.);
  } else {
    console.log("Logging canceled.");
  }
}


// =====================
// BUILD WIDGET
// =====================
const widget = new ListWidget();
widget.setPadding(4, 4, 4, 4);

const overlay = new LinearGradient();
overlay.locations = [0, 1];
overlay.colors = [
    new Color(BG_COLOR, BG_OVERLAY_OPACITY),
    new Color(BG_COLOR, BG_OVERLAY_OPACITY)
];
widget.backgroundGradient = overlay;


const CIRCLE_SIZE = 10;
const CIRCLE_SPACING = 4;
const DOT_FONT = Font.systemFont(CIRCLE_SIZE);

const gridContainer = widget.addStack();
gridContainer.layoutVertically();
gridContainer.spacing = 2;

// Generate dot grid
for (let row = 0; row < GRID_ROWS; row++) {
    const rowStack = gridContainer.addStack();
    rowStack.layoutHorizontally();
    rowStack.spacing = CIRCLE_SPACING;

    for (let col = 0; col < GRID_COLUMNS; col++) {
        const i = row * GRID_COLUMNS + col;
        const day = new Date();
        day.setDate(today.getDate() - (TOTAL_DAYS - 1 - i));
        const dayKey = day.toISOString().slice(0, 10);
        const count = data[dayKey] || 0;

        let level = 0;
        if (count >= 6) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        const dot = rowStack.addText(DOT_CHAR_MAP[level]);
        dot.font = DOT_FONT;
        dot.textColor = COLOR_MAP[level];
    }
}

widget.addSpacer(18);

// =====================
// FOOTER
// =====================
const totalEntries = Object.values(data).reduce((a, b) => a + b, 0);
const todayEntries = data[todayKey] || 0;

const footer = widget.addText(Today ${todayEntries} • Total ${totalEntries});
footer.font = Font.mediumSystemFont(10);
footer.textColor = new Color("#fff");

// =====================
// PRESENT
// =====================
if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    await widget.presentMedium(); // 2x1 layout
}
Script.complete();