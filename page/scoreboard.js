const gameSelect = document.getElementById("gameSelect");
const addRowBtn = document.getElementById("addRow");
const addColumnBtn = document.getElementById("addColumn");
const saveDataBtn = document.getElementById("saveData");
const scoreTable = document.getElementById("scoreTable");
const thead = scoreTable.querySelector("thead tr");
const tbody = scoreTable.querySelector("tbody");

// Attach event listeners
gameSelect.addEventListener("change", function() {
    let selectedElement = gameSelect.options[gameSelect.selectedIndex];
    let selectedValue = selectedElement.value;
    fetchData();
});
addRowBtn.addEventListener("click", addRow);
addColumnBtn.addEventListener("click", addColumn);
saveDataBtn.addEventListener("click", saveData);
setTimeout(function() {
    fetchData();
  }, 500); // Call handleSelection() function after 100 milliseconds
// Populate the table with data
fetchOptions();
//fetchData();

// Function to fetch data from the server
function fetchData() {
    let selectedElement = gameSelect.options[gameSelect.selectedIndex];
    let year_month = selectedElement.value;
    let [year, month] = year_month.split("_");
    const url = `http://localhost:8000/bjorlileikane/${year}/${month}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            addRowBtn.disabled = data.locked;
            addColumnBtn.disabled = data.locked;
            saveDataBtn.disabled = data.locked;
            populateTable(data.data, data.locked);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
}

// Function to fetch available games
function fetchOptions() {
    const url = 'http://localhost:8000/bjorlileikane/alleleika'
    fetch(url)
    .then (response => response.json())
    .then(data => {
        populateOptions(data.data);
    })
    .catch(error => {
        console.error("Error fetching options", error)
    });
}

function populateOptions(data) {  
    data.sort((a, b) => b.localeCompare(a)); // Sort the data array in reverse order
    for (let i = 0; i < data.length; i++){
        let optionElement = document.createElement("option");
        optionElement.value = data[i];
        optionElement.text = data[i].replace("_", "/");
        gameSelect.appendChild(optionElement);
    }
}

// Function to populate the table with data
function populateTable(data, locked) {
    // Clear existing table content
    clearTable();

    // Populate table headers
    populateHeaders(data[0]);

    // Populate table rows
    data.slice(1).forEach(rowData => {
        addRow(rowData, locked);
    });

    updateTable();
}

// Function to clear the table
function clearTable() {
    thead.innerHTML = "";
    tbody.innerHTML = "";
}

// Function to update the total cell for a given row
function updateTotalCell(row) {
    const totalCell = row.querySelector(".total");
    const scoreCells = Array.from(row.querySelectorAll("td")).slice(0, -1);
    const total = scoreCells.reduce((sum, cell) => {
        const value = parseInt(cell.textContent, 10);
        const returnValue = NaN;
        if (isNaN(value)){
            return sum * 1;
        } else if (value === 0) {
            return sum * 1;
        } else {
            return sum * value;
        }
    }, 1);
    totalCell.textContent = total;
}

// Function to sort the table rows by total
function sortRowsByTotal(rows) {
    return Array.from(rows).sort((a, b) => {
        const aValue = parseInt(a.querySelector(".total").textContent, 10);
        const bValue = parseInt(b.querySelector(".total").textContent, 10);
        return aValue - bValue;
    });
}

// Function to re-append sorted rows to the tbody
function reAppendSortedRows(rows) {
    rows.forEach(row => tbody.appendChild(row));
}

// Function to update the table
function updateTable() {
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(updateTotalCell);
    const sortedRows = sortRowsByTotal(rows);
    reAppendSortedRows(sortedRows);
}

// Function to populate the table headers
function populateHeaders(headers) {
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        thead.appendChild(th);
    });
    const th = document.createElement("th");
    th.textContent = "Total";
    thead.appendChild(th);
}

// Function to add a new row to the table
function addRow(rowData = [], locked) {
    const tr = document.createElement("tr");
    
    // Check if rowData is an array or an object
    if (Array.isArray(rowData)) {
        addRowFromArray(rowData, tr, locked);
    } else if (rowData instanceof MouseEvent){
        addRowFromClick(rowData, tr);
    }

    // Add "Total" cell
    const totalCell = document.createElement("td");
    totalCell.classList.add("total");
    tr.appendChild(totalCell);

    // Attach event listeners for updating the table when cell content changes
    tr.querySelectorAll("td").forEach(cell => {
        cell.addEventListener("input", updateTable);
    });

    tbody.appendChild(tr);
}

// Function to add a new row to the table from an array
function addRowFromArray(rowData, tr, locked) {
    rowData.forEach((cellData, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        console.log(locked);
        cell.contentEditable = locked ? "false" : "true";
        console.log(cell.contentEditable);
        cell.textContent = cellData;
        tr.appendChild(cell);
    });
}

// Function to add a new row to the table from a click event

function addRowFromClick(rowData, tr) {
    const nameCell = document.createElement("th");
    nameCell.contentEditable = "true";
    const newContestant = prompt("Hva er spillerns navn?");

    nameCell.textContent = newContestant;
    tr.appendChild(nameCell);

    const headers = Array.from(thead.querySelectorAll("th")).slice(1, -1); // skip the first "Name" header
    headers.forEach(header => {
        const cell = document.createElement("td");
        cell.contentEditable = "true";
        cell.textContent = rowData[header.textContent] || 0;
        tr.appendChild(cell);
    });
}

function addColumn() {
    const newHeader = prompt("Hva er spillets navn?");
    if (newHeader === null || newHeader.trim() === "") return;

    const th = document.createElement("th");
    th.textContent = newHeader;
    thead.insertBefore(th, thead.lastElementChild);

    tbody.querySelectorAll("tr").forEach(tr => {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.textContent = 0;
        td.addEventListener("input", updateTable);
        tr.insertBefore(td, tr.lastElementChild);
    });
}

// Function to get the data to save
function getSaveData() {
    const headers = Array.from(thead.querySelectorAll("th")).slice(0, -1).map(th => th.textContent);
    const gamesIndex = headers.indexOf("Deltager") + 1;
    const scores = Array.from(tbody.querySelectorAll("tr")).map(tr => {
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

// Function to save the data
function saveData() {
    let year_month = gameSelect.selectedElement.value;
    let [year, month] = year_month.split("_");
    const url = `http://localhost:8000/bjorlileikane/${year}/${month}`;

    const postData = getSaveData();

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
    })
        .then(response => response.json())
        .then(data => {
            console.log("Data saved:", data);
        })
        .catch(error => {
            console.error("Error saving data:", error);
        });
}
