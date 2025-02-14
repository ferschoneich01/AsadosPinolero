// Declarar la variable del modal para controlarlo
let loadingModal;

// Función para inicializar el modal solo una vez
function initLoadingModal() {
    if (!loadingModal) {
        loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    }
}

// Establecer la fecha actual como valor predeterminado en el campo de fecha de inicio
window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("startDate").value = today;
};

// Normalizar texto eliminando acentos, comas y transformando a minúsculas
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD") // Descomponer caracteres con acentos
        .replace(/[\u0300-\u036f]/g, "") // Eliminar marcas de acentos
        .replace(/,/g, ""); // Eliminar comas
}

// Manejador del evento submit para generar el reporte de ventas
document.getElementById("filterForm").addEventListener("submit", function(event) {
    event.preventDefault();

    initLoadingModal();
    loadingModal.show();

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Generar la URL de solicitud en función de si se selecciona una fecha de fin
    const url = endDate ? `/GestionReportes/Ventas?fecha_inicio=${startDate}&fecha_fin=${endDate}`
                        : `/GestionReportes/Ventas?fecha_inicio=${startDate}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById("salesReportTable");
            tableBody.innerHTML = ""; // Limpiar el contenido de la tabla

            if (data.length === 0) {
                // Si no hay datos, mostrar un mensaje en la tabla
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="5" class="text-center">No se encontraron ventas en el rango de fechas seleccionado</td>`;
                tableBody.appendChild(row);
            } else {
                // Llenar la tabla con las ventas
                data.forEach(sale => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${sale.ventaid}</td>
                        <td>${sale.nombre_cliente}</td>
                        <td>C$${sale.monto_total.toFixed(2)}</td>
                        <td>${sale.tipoventa}</td>
                        <td>${sale.estadoventa}</td>
                        <td>${sale.fechaventa}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        })
        .catch(error => console.error('Error al generar el reporte de ventas:', error))
        .finally(() => {
            loadingModal.hide();
        });
});

// Función para imprimir el reporte
function printReport() {
    const printContents = document.querySelector(".container").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
}

// Filtro de búsqueda dinámica no sensible a acentos, comas ni mayúsculas/minúsculas
document.getElementById("searchInput").addEventListener("input", function() {
    const searchValue = normalizeText(this.value);
    const rows = document.querySelectorAll("#salesReportTable tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const rowText = Array.from(cells)
            .map(cell => normalizeText(cell.textContent))
            .join(" ");
        row.style.display = rowText.includes(searchValue) ? "" : "none";
    });
});
