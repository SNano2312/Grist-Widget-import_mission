window.grist.ready({ requiredAccess: 'full' });

let targetTable = null;

// Détection automatique de la table
async function detectTable() {
    const tables = await grist.docApi.listTables();

    // Choix : importer dans la première table du document
    // (tu peux changer la logique si tu veux une table précise)
    if (tables.length > 0) {
        targetTable = tables[0].id;
    }
}

detectTable();

document.getElementById("importBtn").addEventListener("click", async () => {

    if (!targetTable) {
        alert("Impossible de détecter la table cible dans Grist.");
        return;
    }

    const centresInput = document.getElementById("centres").value.trim();
    const centres = centresInput.split(",").map(c => c.trim());

    const file = document.getElementById("fileInput").files[0];
    if (!file) {
        alert("Merci de sélectionner un fichier CSV ou Excel.");
        return;
    }

    document.getElementById("status").innerText = "Lecture du fichier…";

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: results => processRows(results.data, centres)
        });
    }
    else if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = e => {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            processRows(rows, centres);
        };
        reader.readAsBinaryString(file);
    }
    else {
        alert("Format non supporté. Utilise CSV ou Excel.");
    }
});

async function processRows(rows, centres) {

    const filtered = rows.filter(r => {
        const cc = (r["Centre de coût"] || "").toString().substring(0, 4);
        return centres.includes(cc);
    });

    document.getElementById("status").innerText =
        filtered.length + " lignes retenues sur " + rows.length;

    if (filtered.length === 0) {
        alert("Aucune ligne ne correspond aux centres financiers indiqués.");
        return;
    }

    const actions = filtered.map(r => ({
        action: "AddRecord",
        tableId: targetTable,
        fields: r
    }));

    await grist.docApi.applyUserActions(actions);

    document.getElementById("status").innerText = "Import terminé !";
}
