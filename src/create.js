
const grid = document.getElementById("puzzle-grid");

const acrossList = document.getElementById("clue-list-across");
const downList = document.getElementById("clue-list-down");

let size = 5;
let selectedCell = null;
let cells = [];

// ------------------------------
// GRID
// ------------------------------

function makeBlack(cell) {
    const text = cell.querySelector(".tile-text");

    text.textContent = "";

    cell.classList.add("black");
    cell.dataset.black = "true";
}

function makeWhite(cell) {
    cell.classList.remove("black");
    cell.dataset.black = "false";
}

function createGrid(newSize) {
    size = newSize;

    grid.innerHTML = "";

    grid.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;

    grid.style.gridTemplateRows =
        `repeat(${size}, 1fr)`;

    cells = [];

    for (let r = 0; r < size; r++) {
        const row = [];

        for (let c = 0; c < size; c++) {
            const cell = document.createElement("div");

            cell.classList.add("puzzle-grid-tile");

            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.dataset.black = "false";

            const text = document.createElement("div");
            text.classList.add("tile-text");

            cell.appendChild(text);

            cell.onclick = () => {
                selectCell(cell);
            };

            row.push(cell);
            grid.appendChild(cell);
        }

        cells.push(row);
    }

    selectCell(cells[0][0]);

    generateHints();
}

function selectCell(cell) {
    document
        .querySelectorAll(".puzzle-grid-tile")
        .forEach(c => c.classList.remove("selected"));

    if (!cell) {
        selectedCell = null;
        return;
    }

    cell.classList.add("selected");

    selectedCell = cell;
}

function moveSelection(dx, dy) {
    if (!selectedCell) return;

    const row = Number(selectedCell.dataset.row);
    const col = Number(selectedCell.dataset.col);

    const next = cells[row + dy]?.[col + dx];

    if (next) {
        selectCell(next);
    }
}

// ------------------------------
// CLUE DEFINITIONS
// ------------------------------

function getClueDefinitions() {
    const clues = [];

    let clueNum = 1;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = cells[r][c];

            if (cell.dataset.black === "true") {
                continue;
            }

            const startsAcross =
                c === 0 ||
                cells[r][c - 1].dataset.black === "true";

            const startsDown =
                r === 0 ||
                cells[r - 1][c].dataset.black === "true";

            if (!startsAcross && !startsDown) {
                continue;
            }

            if (startsAcross) {
                clues.push({
                    id: `${clueNum}-across`,
                    number: clueNum,
                    direction: "across",
                    row: r,
                    col: c
                });
            }

            if (startsDown) {
                clues.push({
                    id: `${clueNum}-down`,
                    number: clueNum,
                    direction: "down",
                    row: r,
                    col: c
                });
            }

            clueNum++;
        }
    }

    return clues;
}

// Get all coordinates belonging to a clue.

function getClueTiles(number, direction) {
    const clue = getClueDefinitions().find(clue =>
        clue.number === number &&
        clue.direction === direction
    );

    const tiles = [];

    if (!clue) return tiles;

    let r = clue.row;
    let c = clue.col;

    while (
        cells[r]?.[c] &&
        cells[r][c].dataset.black !== "true"
    ) {
        tiles.push([r, c]);

        if (direction === "across") {
            c++;
        } else {
            r++;
        }
    }

    return tiles;
}

// ------------------------------
// CLUE INPUTS
// ------------------------------

function createClueInput(
    parent,
    number,
    direction,
    row,
    col,
    value = "",
    allClues = [],
    mentions = []
) {
    const wrapper = document.createElement("div");

    wrapper.classList.add("clue-row");

    const label = document.createElement("span");

    label.textContent = `${number}.`;

    const input = document.createElement("input");

    input.type = "text";
    input.classList.add("clue-input");

    input.dataset.row = row;
    input.dataset.col = col;
    input.dataset.direction = direction;

    input.placeholder = `clue #${number} (${direction})`;

    input.value = value;

    // Mentioned clues selector

    const select = document.createElement("select");

    select.classList.add("clue-mentions");
    select.multiple = true;

    select.title = "Select clues to additionally highlight";

    allClues.forEach(clue => {
        if (clue.id === `${number}-${direction}`) {
            return;
        }

        const option = document.createElement("option");

        option.value = clue.id;

        option.textContent =
            `${clue.number} ${clue.direction}`;

        option.selected = mentions.includes(clue.id);

        select.appendChild(option);
    });

    wrapper.append(label, input, select);

    parent.append(wrapper);
}

// ------------------------------
// CLUE LABELS
// ------------------------------

function generateLabels() {
    document
        .querySelectorAll(".tile-label")
        .forEach(label => label.remove());

    let clueNum = 1;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = cells[r][c];

            if (cell.dataset.black === "true") {
                continue;
            }

            const startsAcross =
                c === 0 ||
                cells[r][c - 1].dataset.black === "true";

            const startsDown =
                r === 0 ||
                cells[r - 1][c].dataset.black === "true";

            if (!startsAcross && !startsDown) {
                continue;
            }

            const label = document.createElement("div");

            label.classList.add("tile-label");

            if (startsAcross) {
                label.classList.add("across-label");
            }

            if (startsDown) {
                label.classList.add("down-label");
            }

            label.textContent = clueNum;

            cell.appendChild(label);

            clueNum++;
        }
    }
}

// ------------------------------
// PRESERVE CLUES AND MENTIONS
// ------------------------------

function getCurrentHints() {
    const hints = {};

    document
        .querySelectorAll(".clue-input")
        .forEach(input => {
            const key =
                `${input.dataset.row},${input.dataset.col}-${input.dataset.direction}`;

            hints[key] = input.value;
        });

    return hints;
}

function getCurrentMentions() {
    const mentions = {};

    document
        .querySelectorAll(".clue-row")
        .forEach(wrapper => {
            const input = wrapper.querySelector(".clue-input");
            const select = wrapper.querySelector(".clue-mentions");

            if (!input || !select) return;

            const key =
                `${input.dataset.row},${input.dataset.col}-${input.dataset.direction}`;

            mentions[key] = [...select.selectedOptions]
                .map(option => option.value);
        });

    return mentions;
}

// Convert imported tile coordinates back into
// clue selections for the editor.

function inferMentionIds(mentionedTiles, allClues, ownId) {
    if (!Array.isArray(mentionedTiles)) {
        return [];
    }

    const tileSet = new Set(
        mentionedTiles.map(([r, c]) => `${r},${c}`)
    );

    return allClues
        .filter(clue => {
            if (clue.id === ownId) return false;

            const clueTiles = getClueTiles(
                clue.number,
                clue.direction
            );

            return clueTiles.length > 0 &&
                clueTiles.every(([r, c]) =>
                    tileSet.has(`${r},${c}`)
                );
        })
        .map(clue => clue.id);
}

// ------------------------------
// GENERATE CLUES
// ------------------------------

function generateHints(importedData = null) {
    const existingHints = getCurrentHints();
    const existingMentions = getCurrentMentions();

    generateLabels();

    const allClues = getClueDefinitions();

    // Restore imported puzzle information.

    if (importedData) {
        allClues.forEach(clue => {
            const key =
                `${clue.row},${clue.col}-${clue.direction}`;

            const section = importedData[clue.direction];

            if (!section) return;

            existingHints[key] =
                section.hints?.[clue.number] || "";

            existingMentions[key] = inferMentionIds(
                section.mentions?.[clue.number] || [],
                allClues,
                clue.id
            );
        });
    }

    acrossList.innerHTML = "";
    downList.innerHTML = "";

    allClues.forEach(clue => {
        const key =
            `${clue.row},${clue.col}-${clue.direction}`;

        const parent =
            clue.direction === "across"
                ? acrossList
                : downList;

        createClueInput(
            parent,
            clue.number,
            clue.direction,
            clue.row,
            clue.col,
            existingHints[key] || "",
            allClues,
            existingMentions[key] || []
        );
    });
}

// ------------------------------
// PUZZLE DATA
// ------------------------------

function getPuzzleData() {
    const rows = [];

    for (let r = 0; r < size; r++) {
        let row = "";

        for (let c = 0; c < size; c++) {
            const cell = cells[r][c];

            if (cell.dataset.black === "true") {
                row += "*";
                continue;
            }

            const value = cell
                .querySelector(".tile-text")
                .textContent;

            row += value || "*";
        }

        rows.push(row);
    }

    return rows;
}

// ------------------------------
// EXPAND MENTIONS INTO COORDINATES
// ------------------------------

function getMentionedTiles(mentions) {
    const tiles = new Set();

    mentions.forEach(id => {
        const [number, direction] = id.split("-");

        getClueTiles(
            Number(number),
            direction
        ).forEach(([r, c]) => {
            tiles.add(`${r},${c}`);
        });
    });

    return [...tiles].map(tile =>
        tile.split(",").map(Number)
    );
}

// ------------------------------
// BUILD EXPORTED PUZZLE
// ------------------------------

function buildPuzzleData() {
    const tiles = [];

    for (let r = 0; r < size; r++) {
        let row = "";

        for (let c = 0; c < size; c++) {
            const cell = cells[r][c];

            if (cell.dataset.black === "true") {
                row += "*";
            } else {
                const value =
                    cell.querySelector(".tile-text")
                        .textContent || "*";

                row += value.toLowerCase();
            }
        }

        tiles.push(row);
    }

    let across = {};
    let down = {};

    across.hints = {};
    down.hints = {};

    across.mentions = {};
    down.mentions = {};

    across.label = [];
    down.label = [];

    across.num = [];
    down.num = [];

    // Initialize label arrays.

    for (let r = 0; r < size; r++) {
        across.label.push([]);
        down.label.push([]);

        for (let c = 0; c < size; c++) {
            down.label[r].push("*");
            across.label[r].push("*");
        }
    }

    // Get clue information.

    document
        .querySelectorAll(".clue-input")
        .forEach(input => {
            const row = Number(input.dataset.row);
            const col = Number(input.dataset.col);

            const direction = input.dataset.direction;

            const cell = cells[row][col];

            const label = cell.querySelector(".tile-label");

            if (!label) return;

            const n = Number(label.textContent);

            const select =
                input.parentElement.querySelector(".clue-mentions");

            const selectedMentions =
                [...select.selectedOptions]
                    .map(option => option.value);

            // Convert selected clues into tile coordinates.

            const mentionedTiles =
                getMentionedTiles(selectedMentions);

            if (direction === "across") {
                across.hints[n] = input.value;
                across.label[row][col] = n;
                across.mentions[n] = mentionedTiles;
            }

            if (direction === "down") {
                down.hints[n] = input.value;
                down.label[row][col] = n;
                down.mentions[n] = mentionedTiles;
            }
        });

    // Generate Across numbering array.

    for (let r = 0; r < size; r++) {
        let num = 0;

        across.num.push([]);

        for (let c = 0; c < size; c++) {
            const cell = cells[r][c];

            if (cell.dataset.black === "true") {
                num = 0;
            } else {
                const label = cell.querySelector(".tile-label");

                if (
                    label &&
                    label.classList.contains("across-label")
                ) {
                    num = Number(label.textContent);
                }
            }

            across.num[r].push(
                num === 0 ? "*" : num
            );
        }
    }

    // Generate Down numbering array.

    let temp = [];

    for (let c = 0; c < size; c++) {
        let num = 0;

        temp.push([]);

        for (let r = 0; r < size; r++) {
            const cell = cells[r][c];

            if (cell.dataset.black === "true") {
                num = 0;
            } else {
                const label = cell.querySelector(".tile-label");

                if (
                    label &&
                    label.classList.contains("down-label")
                ) {
                    num = Number(label.textContent);
                }
            }

            temp[c].push(
                num === 0 ? "*" : num
            );
        }
    }

    for (let r = 0; r < size; r++) {
        down.num.push([]);

        for (let c = 0; c < size; c++) {
            down.num[r].push(temp[c][r]);
        }
    }

    return {
        size,
        tiles,
        across,
        down
    };
}

// ------------------------------
// EXPORT
// ------------------------------

function exportPuzzle() {
    const puzzleData = buildPuzzleData();

    const encoded = btoa(
        encodeURIComponent(
            JSON.stringify(puzzleData)
        )
    );

    console.log(puzzleData);

    window.open(
        `index.html#${encoded}`,
        "_blank"
    );
}

// ------------------------------
// IMPORT
// ------------------------------

function loadPuzzle(data) {
    createGrid(data.size);

    data.tiles.forEach((row, r) => {
        [...row].forEach((char, c) => {
            const cell = cells[r][c];

            if (char === "*") {
                makeBlack(cell);
            } else {
                cell.querySelector(".tile-text")
                    .textContent = char.toUpperCase();
            }
        });
    });

    generateHints(data);
}

function importPuzzle() {
    const url = prompt("Paste exported URL:");

    if (!url) return;

    let encoded;

    try {
        const parsed = new URL(url);

        // Supports the exported hash format
        // and the older ?puzzle= format.

        encoded =
            parsed.hash.substring(1) ||
            parsed.searchParams.get("puzzle");

        if (!encoded) return;

        const puzzleData = JSON.parse(
            decodeURIComponent(
                atob(encoded)
            )
        );

        loadPuzzle(puzzleData);

    } catch (error) {
        console.error("Failed to import puzzle:", error);
        alert("Invalid puzzle URL.");
    }
}

// ------------------------------
// KEYBOARD CONTROLS
// ------------------------------

document.addEventListener("keydown", e => {
    if (!selectedCell) return;

    // Don't intercept keyboard input inside clue fields.

    if (
        e.target.matches("input, textarea, select") &&
        e.target !== grid
    ) {
        return;
    }

    const text =
        selectedCell.querySelector(".tile-text");

    if (e.key === "*") {
        if (selectedCell.dataset.black === "true") {
            makeWhite(selectedCell);
        } else {
            makeBlack(selectedCell);
        }

        generateHints();

        moveSelection(1, 0);

        return;
    }

    if (/^[a-z]$/i.test(e.key)) {
        makeWhite(selectedCell);

        text.textContent = e.key.toUpperCase();

        generateHints();

        moveSelection(1, 0);

        return;
    }

    if (e.key === "Backspace") {
        if (text.textContent) {
            text.textContent = "";

            generateHints();
        } else {
            moveSelection(-1, 0);

            const prev =
                selectedCell.querySelector(".tile-text");

            prev.textContent = "";

            generateHints();
        }

        return;
    }

    if (e.key === "ArrowLeft") {
        moveSelection(-1, 0);
    }

    if (e.key === "ArrowRight") {
        moveSelection(1, 0);
    }

    if (e.key === "ArrowUp") {
        moveSelection(0, -1);
    }

    if (e.key === "ArrowDown") {
        moveSelection(0, 1);
    }
});

// ------------------------------
// DESELECTION
// ------------------------------

document.addEventListener("click", e => {
    if (
        e.target.classList.contains("clue-input") ||
        e.target.classList.contains("clue-mentions") ||
        e.target.classList.contains("tile-text") ||
        e.target.classList.contains("puzzle-grid-tile")
    ) {
        return;
    }

    selectCell(null);
});

// ------------------------------
// BUTTONS
// ------------------------------

document
    .getElementById("resize-grid")
    ?.addEventListener("click", () => {

        const value = Number(
            document.getElementById("grid-size").value
        );

        if (value < 3) return;

        createGrid(value);
    });

document
    .getElementById("export")
    ?.addEventListener("click", exportPuzzle);

document
    .getElementById("import")
    ?.addEventListener("click", importPuzzle);

// ------------------------------
// INITIALIZE
// ------------------------------

createGrid(5);
