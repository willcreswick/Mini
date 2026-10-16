let PUZZLE_DATA = null;

const compressed = location.hash.slice(1);
if (compressed) {
    PUZZLE_DATA = JSON.parse(
        decodeURIComponent(atob(compressed))
    );
} else {
    PUZZLE_DATA = JSON.parse(
        decodeURIComponent(
            atob(
                new URLSearchParams(
                    location.search
                ).get("puzzle")
            )
        )
    );
}

const grid = document.getElementById("puzzle-grid");
const acrossHints = document.getElementById("clue-list-across");
const downHints = document.getElementById("clue-list-down");

let across = true;
let selectedTile = null;

/* ---------------- TIMER ---------------- */

let seconds = 0;

function updateTimer() {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    const timer = document.getElementById("timer");

    if (timer) {
        timer.textContent = `${mins}:${secs}`;
    }
}

const timer = setInterval(() => {
    seconds++;
    updateTimer();
}, 1000);

/* ---------------- GRID ---------------- */

function initGrid() {
    grid.style.gridTemplateColumns =
        `repeat(${PUZZLE_DATA.size}, 1fr)`;

    grid.style.gridTemplateRows =
        `repeat(${PUZZLE_DATA.size}, 1fr)`;

    grid.style.setProperty(
        "--grid-size",
        PUZZLE_DATA.size
    );

    for (let r = 0; r < PUZZLE_DATA.tiles.length; r++) {
        const row = PUZZLE_DATA.tiles[r];

        for (let c = 0; c < row.length; c++) {
            const letter = row[c];

            const isBlack = letter === "*";

            const acrossNum = PUZZLE_DATA.across.num[r][c];
            const downNum = PUZZLE_DATA.down.num[r][c];

            const hintLabel =
                PUZZLE_DATA.across.label[r][c] !== "*"
                    ? PUZZLE_DATA.across.label[r][c]
                    : PUZZLE_DATA.down.label[r][c];

            grid.appendChild(
                createTile(
                    `${r}-${c}`,
                    isBlack,
                    acrossNum,
                    downNum,
                    hintLabel,
                    r,
                    c,
                    letter
                )
            );
        }
    }

    initClues();

    selectTile(
        document.querySelector(".puzzle-grid-tile:not(.black)")
    );
}

/* ---------------- CLUES ---------------- */

function initClues() {
    acrossHints.innerHTML = "";
    downHints.innerHTML = "";

    Object.entries(PUZZLE_DATA.across.hints).forEach(([num, hint]) => {
        const clue = document.createElement("div");

        clue.classList.add("clue");
        clue.dataset.direction = "across";
        clue.dataset.clue = num;

        clue.innerHTML = `<strong>${num}</strong>. ${hint}`;

        clue.onclick = () => {
            across = true;

            const tile = document.querySelector(`.across-${num}`);

            if (tile) {
                selectTile(tile);
            }
        };

        acrossHints.appendChild(clue);
    });

    Object.entries(PUZZLE_DATA.down.hints).forEach(([num, hint]) => {
        const clue = document.createElement("div");

        clue.classList.add("clue");
        clue.dataset.direction = "down";
        clue.dataset.clue = num;

        clue.innerHTML = `<strong>${num}</strong>. ${hint}`;

        clue.onclick = () => {
            across = false;

            const tile = document.querySelector(`.down-${num}`);

            if (tile) {
                selectTile(tile);
            }
        };

        downHints.appendChild(clue);
    });
}

/* ---------------- TILES ---------------- */

function createTile(
    id,
    isBlack,
    acrossNum,
    downNum,
    hintLabel,
    row,
    col,
    answer
) {
    const tile = document.createElement("div");

    tile.classList.add("puzzle-grid-tile");
    tile.classList.add(`across-${acrossNum}`);
    tile.classList.add(`down-${downNum}`);

    tile.id = `tile-${id}`;

    tile.dataset.row = row;
    tile.dataset.col = col;
    tile.dataset.answer = answer.toUpperCase();

    const label = document.createElement("div");
    const input = document.createElement("div");

    input.classList.add("tile-text");

    if (isBlack) {
        tile.classList.add("black");
    }

    if (hintLabel !== "*" && hintLabel !== "") {
        label.classList.add("tile-label");
        label.textContent = hintLabel;
        tile.appendChild(label);
    }

    tile.onclick = () => {
        if (isBlack) return;

        if (selectedTile === tile) {
            across = !across;
        }

        selectTile(tile);
    };

    tile.appendChild(input);

    return tile;
}

/* ---------------- SELECTION ---------------- */

function selectTile(tile) {
    document.querySelectorAll(".puzzle-grid-tile").forEach(t => {
        t.classList.remove("selected");
        t.classList.remove("highlighted");
    });

    document.querySelectorAll(".clue").forEach(c => {
        c.classList.remove("selected");
    });

    tile.classList.add("selected");

    selectedTile = tile;

    const clueNum = across
        ? [...tile.classList]
            .find(c => c.startsWith("across-"))
            ?.replace("across-", "")
        : [...tile.classList]
            .find(c => c.startsWith("down-"))
            ?.replace("down-", "");

    if (!clueNum || clueNum.includes("*")) return;

    document
        .querySelectorAll(
            across
                ? `.across-${clueNum}`
                : `.down-${clueNum}`
        )
        .forEach(tile => tile.classList.add("highlighted"));

    document
        .querySelector(
            `.clue[data-direction="${across ? "across" : "down"}"][data-clue="${clueNum}"]`
        )
        ?.classList.add("selected");
}

/* ---------------- NAVIGATION ---------------- */

function moveSelection() {
    if (!selectedTile) return;

    let row = Number(selectedTile.dataset.row);
    let col = Number(selectedTile.dataset.col);

    while (true) {
        across ? col++ : row++;

        const next =
            document.getElementById(`tile-${row}-${col}`);

        if (!next) return;

        if (!next.classList.contains("black")) {
            selectTile(next);
            return;
        }
    }
}

function moveBackward() {
    if (!selectedTile) return;

    let row = Number(selectedTile.dataset.row);
    let col = Number(selectedTile.dataset.col);

    while (true) {
        across ? col-- : row--;

        const prev =
            document.getElementById(`tile-${row}-${col}`);

        if (!prev) return;

        if (!prev.classList.contains("black")) {
            selectTile(prev);
            return;
        }
    }
}

/* ---------------- CHECK / REVEAL ---------------- */

function getCurrentWordTiles() {
    if (!selectedTile) return [];

    const clueNum = across
        ? [...selectedTile.classList]
            .find(c => c.startsWith("across-"))
            ?.replace("across-", "")
        : [...selectedTile.classList]
            .find(c => c.startsWith("down-"))
            ?.replace("down-", "");

    return [
        ...document.querySelectorAll(
            across
                ? `.across-${clueNum}`
                : `.down-${clueNum}`
        )
    ].filter(tile => !tile.classList.contains("black"));
}

function checkWord() {
    getCurrentWordTiles().forEach(tile => {
        const input = tile.querySelector(".tile-text");

        tile.classList.remove("incorrect");

        if (
            input.textContent === tile.dataset.answer
        ) {
            lockTile(tile);
        }
        else if (input.textContent) {
            input.classList.add("incorrect");
        }
    });
}

function checkAll() {
    document
        .querySelectorAll(".puzzle-grid-tile:not(.black)")
        .forEach(tile => {
            const input =
                tile.querySelector(".tile-text");

            tile.classList.remove("incorrect");

            if (
                input.textContent === tile.dataset.answer
            ) {
                lockTile(tile);
            }
            else if (input.textContent) {
                input.classList.add("incorrect");
            }
        });
}

function revealWord() {
    getCurrentWordTiles().forEach(tile => {
        tile.querySelector(".tile-text").textContent =
            tile.dataset.answer;

        lockTile(tile);
        tile.classList.add("revealed");
    });
    checkCompletion();
}

function revealAll() {
    document
        .querySelectorAll(".puzzle-grid-tile:not(.black)")
        .forEach(tile => {
            tile.querySelector(".tile-text").textContent =
                tile.dataset.answer;

            lockTile(tile);
            tile.classList.add("revealed");
        });
    checkCompletion();
}

function checkLetter() {
    if (!selectedTile) return;

    const input =
        selectedTile.querySelector(".tile-text");

    if (!input) return;

    selectedTile.classList.remove("incorrect");

    if (
        input.textContent === selectedTile.dataset.answer
    ) {
        lockTile(selectedTile);
    }
    else if (input.textContent) {
        input.classList.add("incorrect");
    }
}

function revealLetter() {
    if (!selectedTile) return;

    const input =
        selectedTile.querySelector(".tile-text");

    input.textContent =
        selectedTile.dataset.answer;

    lockTile(selectedTile);
    selectedTile.classList.add("revealed");
    checkCompletion();
}

/* ---------------- KEYBOARD ---------------- */

document.addEventListener("keydown", e => {
    if (!selectedTile) return;

    const input =
        selectedTile.querySelector(".tile-text");

    if (!input) return;

    input.classList.remove("incorrect");

    if (/^[a-z]$/i.test(e.key)) {
        if (selectedTile.dataset.locked === "true") {
            moveSelection();
            return;
        }

        input.textContent = e.key.toUpperCase();
        moveSelection();
        checkCompletion();
        return;
    }

    if (e.key === "Backspace") {
        if (selectedTile.dataset.locked === "true") return;

        if (input.textContent) {
            input.textContent = "";
        } else {
            moveBackward();

            const prevInput =
                selectedTile?.querySelector(".tile-text");

            if (prevInput) {
                prevInput.textContent = "";
            }
        }
    }

    if (e.key === "ArrowRight") {
        across = true;
        moveSelection();
    }

    if (e.key === "ArrowDown") {
        across = false;
        moveSelection();
    }
});

/* ---------------- BUTTONS ---------------- */

document.getElementById("check-letter")
    ?.addEventListener("click", checkLetter);

document.getElementById("check-all")
    ?.addEventListener("click", checkAll);

document.getElementById("reveal-letter")
    ?.addEventListener("click", revealLetter);

document.getElementById("reveal-word")
    ?.addEventListener("click", revealWord);

function lockTile(tile) {
    tile.dataset.locked = "true";
    tile.classList.add("locked");
}

/* ---------------- WIN CHECK & POPUP ---------------- */

let isCompleted = false;

function checkCompletion() {
    if (isCompleted) return;

    const tiles = document.querySelectorAll(".puzzle-grid-tile:not(.black)");
    
    // Check if every non-black tile matches its answer
    const isSolved = Array.from(tiles).every(tile => {
        const text = tile.querySelector(".tile-text")?.textContent;
        return text === tile.dataset.answer;
    });

    if (isSolved) {
        isCompleted = true;
        showWinPopup();
    }
}

function showWinPopup() {
    const timeTaken = document.getElementById("timer")?.textContent || "";
    
    const overlay = document.getElementById("win-overlay");
    overlay.querySelector("#time-taken").textContent = timeTaken;
    overlay.style.display = "flex";

    clearInterval(timer);
}

/* ---------------- START ---------------- */

initGrid();
updateTimer();