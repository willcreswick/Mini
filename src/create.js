const grid = document.getElementById("puzzle-grid");

const acrossList =
    document.getElementById("clue-list-across");

const downList =
    document.getElementById("clue-list-down");

let size = 5;
let selectedCell = null;
let cells = [];

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

    if(!cell) {
        selectedCell = cell;
        return;
    }

    cell.classList.add("selected");

    selectedCell = cell;
}

function moveSelection(dx, dy) {
    if (!selectedCell) return;

    const row =
        Number(selectedCell.dataset.row);

    const col =
        Number(selectedCell.dataset.col);

    const next =
        cells[row + dy]?.[col + dx];

    if (next) {
        selectCell(next);
    }
}

function createClueInput(
    parent,
    number,
    direction,
    row,
    col,
    value = ""
) {
    const wrapper =
        document.createElement("div");

    wrapper.classList.add("clue-row");

    const label =
        document.createElement("span");

    label.textContent = `${number}.`;

    const input =
        document.createElement("input");

    input.type = "text";

    input.classList.add("clue-input");

    input.dataset.row = row;
    input.dataset.col = col;
    input.dataset.direction = direction;

    input.placeholder =
        `clue #${number} (${direction})`;

    input.value = value;

    wrapper.append(label);
    wrapper.append(input);

    parent.append(wrapper);
}

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

            const label =
                document.createElement("div");

            label.classList.add("tile-label");

            if(startsAcross) {
                label.classList.add("across-label");
            }
            if(startsDown) {
                label.classList.add("down-label");
            }

            label.textContent = clueNum;

            cell.appendChild(label);

            clueNum++;
        }
    }
}

function getCurrentHints() {
    const hints = {};

    document
        .querySelectorAll(".clue-input")
        .forEach(input => {
            hints[
                `${input.dataset.row},${input.dataset.col}-${input.dataset.direction}`
            ] = input.value;
        });

    return hints;
}

function generateHints() {
    const existingHints =
        getCurrentHints();

    generateLabels();

    acrossList.innerHTML = "";
    downList.innerHTML = "";

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
                const key =
                    `${r},${c}-across`;

                createClueInput(
                    acrossList,
                    clueNum,
                    "across",
                    r,
                    c,
                    existingHints[key] || ""
                );
            }

            if (startsDown) {
                const key =
                    `${r},${c}-down`;

                createClueInput(
                    downList,
                    clueNum,
                    "down",
                    r,
                    c,
                    existingHints[key] || ""
                );
            }

            clueNum++;
        }
    }
}


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

            const value =
                cell
                    .querySelector(".tile-text")
                    .textContent;

            row += value || "*";
        }

        rows.push(row);
    }

    return rows;
}

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

    generateHints(
        data.across.hints,
        data.down.hints
    );
}

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

    across.label = [];
    down.label = [];

    across.num = [];
    down.num = [];

    for(let r = 0; r < size; r++) {
        across.label.push([]);
        down.label.push([]);
        for(let c = 0; c < size; c++) {
            down.label[r].push("*");
            across.label[r].push("*");
        }
    }

    // get hints & labels
    document
        .querySelectorAll(".clue-input")
        .forEach(input => {
            document.querySelectorAll(".puzzle-grid-tile").forEach(cell => {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);

                if (row === Number(input.dataset.row) && col === Number(input.dataset.col)) {
                    const n = cell.getElementsByClassName("tile-label")[0].textContent;
                    if (input.dataset.direction === "across") {
                        across.hints[n] = input.value;
                        across.label[row][col] = n;
                    }
                    if (input.dataset.direction === "down") {
                        down.hints[n] = input.value;
                        down.label[row][col] = n;
                    }
                }
            });
        });
    
    for(let r = 0; r < size; r++) {
        let num = 0;
        across.num.push([]);
        for(let c = 0; c < size; c++) {
            let black = false;

            document.querySelectorAll(".puzzle-grid-tile").forEach(cell => {
                if (cell.dataset.row == r && cell.dataset.col == c) {
                    if (cell.dataset.black === "false") {
                        const label = cell.getElementsByClassName("tile-label")[0];
                        if (label && label.classList.contains("across-label")) {
                            num = Number(label.textContent);
                        }
                    } else {
                        black = true;
                    }
                }
            });
            across.num[r].push(num === 0 || black ? "*" : num);
        }
    }

    let temp = [];

    for(let c = 0; c < size; c++) {
        let num = 0;
        temp.push([]);
        for(let r = 0; r < size; r++) {
            let black = false;

            document.querySelectorAll(".puzzle-grid-tile").forEach(cell => {
                if (cell.dataset.row == r && cell.dataset.col == c) {
                    if (cell.dataset.black === "false") {
                        const label = cell.getElementsByClassName("tile-label")[0];
                        if (label && label.classList.contains("down-label")) {
                            num = Number(label.textContent);
                        }
                    } else {
                        black = true;
                    }
                }
            });
            temp[c].push(num === 0 || black ? "*" : num);
        }
    }

    for(let r = 0; r < size; r++) {
        down.num.push([]);
        for(let c = 0; c < size; c++) {
            down.num[r].push(temp[c][r]);
        }
    }

    return {
        size,
        tiles,
        across: across,
        down: down
    };
}

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

function importPuzzle() {
    const url =
        prompt("Paste exported URL:");

    if (!url) return;

    const params =
        new URL(url).searchParams;

    const encoded =
        params.get("puzzle");

    if (!encoded) return;

    const puzzleData =
        JSON.parse(
            decodeURIComponent(
                atob(encoded)
            )
        );

    loadPuzzle(puzzleData);
}



document.addEventListener("keydown", e => {
    if (!selectedCell) return;

    const text =
        selectedCell.querySelector(".tile-text");

    if (e.key === "*") {
        if (
            selectedCell.dataset.black === "true"
        ) {
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

        text.textContent =
            e.key.toUpperCase();

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
                selectedCell.querySelector(
                    ".tile-text"
                );

            prev.textContent = "";

            generateHints();
        }

        return;
    }

    if (e.key === "ArrowLeft")
        moveSelection(-1, 0);

    if (e.key === "ArrowRight")
        moveSelection(1, 0);

    if (e.key === "ArrowUp")
        moveSelection(0, -1);

    if (e.key === "ArrowDown")
        moveSelection(0, 1);
});

document.addEventListener("click", e => {
    if (
        e.target.classList.contains(
            "clue-input"
        )
    ) {
        return;
    }

    if (
        e.target.classList.contains(
            "tile-text"
        )
    ) {
        return;
    }

    if (
        e.target.classList.contains(
            "puzzle-grid-tile"
        )
    ) {
        return;
    }

    selectCell(null);
});

document
    .getElementById("resize-grid")
    ?.addEventListener("click", () => {

        const value =
            Number(
                document.getElementById(
                    "grid-size"
                ).value
            );

        if (value < 3) return;

        createGrid(value);
    });

document
    .getElementById("export")
    ?.addEventListener(
        "click",
        exportPuzzle
    );

document
    .getElementById("import")
    ?.addEventListener(
        "click",
        importPuzzle
    );

createGrid(5);