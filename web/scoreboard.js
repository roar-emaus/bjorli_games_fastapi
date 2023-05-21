import BjorliAPI from './bjorliAPI.js';

const API_URL = 'http://dypnet.no/bjorli_api/';
const INITIAL_FETCH_DELAY_MS = 500;

const api = new BjorliAPI(API_URL);

const UI_ELEMENTS = {
  gameSelect: document.getElementById("gameSelect"),
  addRowBtn: document.getElementById("addRow"),
  addColumnBtn: document.getElementById("addColumn"),
  saveDataBtn: document.getElementById("saveData"),
  scoreTable: document.getElementById("scoreTable"),
  get thead() { return this.scoreTable.querySelector("thead tr") },
  get tbody() { return this.scoreTable.querySelector("tbody") },
};

UI_ELEMENTS.gameSelect.addEventListener("change", fetchGameData);
UI_ELEMENTS.addRowBtn.addEventListener("click", addScoreRow);
UI_ELEMENTS.addColumnBtn.addEventListener("click", addGameColumn);
UI_ELEMENTS.saveDataBtn.addEventListener("click", saveScoreData);

setTimeout(fetchGameData, INITIAL_FETCH_DELAY_MS);
fetchGameOptions();

function fetchGameData() {
    let selectedElement = UI_ELEMENTS.gameSelect.options[UI_ELEMENTS.gameSelect.selectedIndex];
    let year_month = selectedElement.value;
    let [year, month] = year_month.split("_");

    api.fetchGameData(year, month).then(data => {
      UI_ELEMENTS.addRowBtn.disabled = data.locked;
      UI_ELEMENTS.addColumnBtn.disabled = data.locked;
      UI_ELEMENTS.saveDataBtn.disabled = data.locked;
      populateScoreTable(data.data, data.locked);
    }).catch(console.error);
}

function fetchGameOptions() {
  api.fetchGameOptions().then(populateGameSelection).catch(console.error);
}

function populateGameSelection(data) {  
    data.data.sort((a, b) => b.localeCompare(a));
    data.data.forEach(option => {
        let optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.text = option.replace("_", "/");
        UI_ELEMENTS.gameSelect.appendChild(optionElement);
    });
}

function populateScoreTable(data, locked) {
    clearScoreTable();
    populateScoreTableHeaders(data[0]);
    data.slice(1).forEach(rowData => addScoreRow(rowData, locked));
    updateScoreTable();
}

function clearScoreTable() {
    UI_ELEMENTS.thead.innerHTML = "";
    UI_ELEMENTS.tbody.innerHTML = "";
}

function updateScoreTotalForCell(row) {
    const totalCell = row.querySelector(".total");
    const scoreCells = Array.from(row.querySelectorAll("td")).slice(0, -1);
    const total = scoreCells.reduce((sum, cell) => sum * (parseInt(cell.textContent, 10) || 1), 1);
    totalCell.textContent = total;
}

function sortRowsByTotalScore(rows) {
    return Array.from(rows).sort((a, b) => {
        const aValue = parseInt(a.querySelector(".total").textContent, 10);
        const bValue = parseInt(b.querySelector(".total").textContent, 10);
        return aValue - bValue;
    });
}

function appendSortedRows(rows) {
    rows.forEach(row => UI_ELEMENTS.tbody.appendChild(row));
}

function updateScoreTable() {
    const rows = UI_ELEMENTS.tbody.querySelectorAll("tr");
    rows.forEach(updateScoreTotalForCell);
    appendSortedRows(sortRowsByTotalScore(rows));
}

function populateScoreTableHeaders(headers) {
    headers.forEach(header => UI_ELEMENTS.thead.appendChild(createHeaderCell(header)));
    UI_ELEMENTS.thead.appendChild(createHeaderCell("Total"));
}

function addScoreRow(rowData = [], locked) {
    const tr = document.createElement("tr");
    Array.isArray(rowData) ? addScoreRowFromArray(rowData, tr, locked) : addScoreRowFromClickEvent(rowData, tr);
    tr.appendChild(createTotalCell());
    tr.querySelectorAll("td").forEach(cell => cell.addEventListener("input", updateScoreTable));
    UI_ELEMENTS.tbody.appendChild(tr);
}

function addScoreRowFromArray(rowData, tr, locked) {
    rowData.forEach((cellData, index) => {
        let cell = null;
        if (index === 0){
            cell = createHeaderCell(cellData);
        } else {
            cell = document.createElement("td");
            cell.contentEditable = locked ? "false" : "true";
            cell.textContent = cellData;
        }
        tr.appendChild(cell);
    });
}

function addScoreRowFromClickEvent(rowData, tr) {
    tr.appendChild(createHeaderCell(prompt("Hva er spillerns navn?")));
    const headers = Array.from(UI_ELEMENTS.thead.querySelectorAll("th")).slice(1, -1);
    headers.forEach(header => tr.appendChild(createEditableCell(rowData[header.textContent] || 0)));
}

function addGameColumn() {
    const newHeader = prompt("Hva er spillets navn?");
    if (newHeader === null || newHeader.trim() === "") return;
    UI_ELEMENTS.thead.insertBefore(createHeaderCell(newHeader), UI_ELEMENTS.thead.lastElementChild);
    UI_ELEMENTS.tbody.querySelectorAll("tr").forEach(tr => {
        const td = createEditableCell(0);
        td.addEventListener("input", updateScoreTable);
        tr.insertBefore(td, tr.lastElementChild);
    });
}

function getScoreDataToSave() {
    const headers = Array.from(UI_ELEMENTS.thead.querySelectorAll("th")).slice(0, -1).map(th => th.textContent);
    const gamesIndex = headers.indexOf("Deltager") + 1;
    const scores = Array.from(UI_ELEMENTS.tbody.querySelectorAll("tr")).map(tr => {
        const rowCells = Array.from(tr.querySelectorAll("td")).slice(0, -1);
        const nameCell = tr.querySelector("th");
        const scoreData = {};
        scoreData["Deltager"] = nameCell.textContent;
        rowCells.forEach((cell, index) => {
            scoreData[headers[gamesIndex + index]] = parseInt(cell.textContent, 10) || 0;
        });
        return scoreData;
    });
    return {
        games: headers,
        scores: scores
    };
}

function saveScoreData() {
  let selectedElement = UI_ELEMENTS.gameSelect.options[UI_ELEMENTS.gameSelect.selectedIndex];
  let year_month = selectedElement.value;
  let [year, month] = year_month.split("_");
  const postData = getScoreDataToSave();
  api.saveGameData(year, month, postData).then(data => {
    console.log("Data saved:", data);
  }).catch(console.error);
}

function createHeaderCell(text) {
    const th = document.createElement("th");
    th.textContent = text;
    return th;
}

function createTotalCell() {
    const totalCell = document.createElement("td");
    totalCell.classList.add("total");
    return totalCell;
}

function createEditableHeaderCell(text) {
    const th = document.createElement("th");
    th.contentEditable = "true";
    th.textContent = text;
    return th;
}

function createEditableCell(text) {
    const td = document.createElement("td");
    td.contentEditable = "true";
    td.textContent = text;
    return td;
}

