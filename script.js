let targetTable = null;

// Récupérer la table cible quand Grist charge le widget
window.grist.ready({ requiredAccess: 'full' });

window.grist.onRecords((records, mappings) => {
    targetTable = mappings.tableId;
});

document.getElementById("importBtn").addEventListener("click", async () => {

    if (!targetTable) {
        alert("Le widget n’est pas lié à une table Grist. Associe-le à une table dans la configuration du widget.");
        return;
    }

    const centresInput = document.getElementById("centres").value.trim();
    if (!centresInput) {
        alert("Merci d’indiquer au moins un centre financier (ex: 1101,1203).");
        return;
    }

    const centres = centresInput.split(",").map(c => c.trim());

    const file = document.getElementById("fileInput").files[0];
    if (!file) {
        alert("Merci de sélectionner un fichier CSV.");
        return;
    }

    document.getElementById("status").innerText = "Lecture du fichier…";

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {

            const rows = results.data;

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
    });
});
