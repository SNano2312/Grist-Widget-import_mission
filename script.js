window.grist.ready({ requiredAccess: 'full' });

document.getElementById("importBtn").addEventListener("click", async () => {

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

            // Filtrer selon les 4 premiers chiffres du centre de coût
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

            // Préparer les actions pour Grist
            const actions = filtered.map(r => ({
                action: "AddRecord",
                tableId: grist.docApi.tableId,
                fields: r
            }));

            // Envoyer à Grist
            await grist.docApi.applyUserActions(actions);

            document.getElementById("status").innerText = "Import terminé !";
        }
    });
});
