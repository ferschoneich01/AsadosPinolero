let loadingModal;

// Función para inicializar el modal solo una vez
function initLoadingModal() {
    if (!loadingModal) {
        loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    }
}

// Configuración de la fecha de inicio al cargar la página con la fecha actual en la zona horaria de Nicaragua
window.onload = () => {
    const nicaraguaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Managua' }).format(new Date());
    document.getElementById("startDate").value = nicaraguaDate;
};

// Evento para habilitar o deshabilitar el campo de fecha de fin según el checkbox
document.getElementById('enableEndDate').addEventListener('change', function () {
    const endDate = document.getElementById('endDate');
    const startDate = document.getElementById('startDate');

    if (this.checked) {
        endDate.disabled = false;
        endDate.min = startDate.value;
    } else {
        endDate.disabled = true;
        endDate.value = '';
    }
});

// Actualizar el campo "Fecha de fin" para que no pueda ser antes de "Fecha de inicio"
document.getElementById('startDate').addEventListener('input', function () {
    if (this.value && document.getElementById('enableEndDate').checked) {
        document.getElementById('endDate').min = this.value;
    }
});

// Función para actualizar el total de utilidades en la alerta
function updateTotalProfit() {
    const totalProfits = Array.from(document.querySelectorAll(".total-profit"))
        .map(element => parseFloat(element.textContent) || 0);
    const totalSum = totalProfits.reduce((acc, profit) => acc + profit, 0);

    document.getElementById("totalProfit").textContent = new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 2 }).format(totalSum);
}

// Evento para calcular el total de utilidades al cambiar el margen de ganancia en cada fila
document.addEventListener("input", function (e) {
    if (e.target.classList.contains("profit-margin")) {
        const row = e.target.closest("tr");
        const quantity = parseFloat(row.querySelector(".quantity").textContent);
        const margin = parseFloat(e.target.value) || 0;  // Si está vacío, asigna 0

        // Calcula el subtotal de utilidad en la fila multiplicando la cantidad por el margen directamente
        const totalProfit = quantity * margin;
        row.querySelector(".total-profit").textContent = totalProfit.toFixed(2);

        // Actualiza el total de utilidades en la alerta
        updateTotalProfit();
    }
});


// Función para generar el reporte y enviar las fechas al backend
document.getElementById("filterForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Inicializar el modal y mostrarlo
    initLoadingModal();
    loadingModal.show();

    // Obtener la fecha y hora de inicio seleccionadas
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Enviar los datos al backend usando fetch
    fetch(`/GestionReportes/Utilidades?fecha_inicio=${startDate}&fecha_fin=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById("productReportTable");
            tableBody.innerHTML = ""; // Limpiar contenido de la tabla

            if (data.length === 0) {
                // Si no hay datos, mostrar un mensaje en la tabla
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="4" class="text-center">No se encontraron productos en el rango seleccionado</td>`;
                tableBody.appendChild(row);
            } else {
                // Si hay datos, llenar la tabla con los productos
                data.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="Producto">${item.producto}</td>
                        <td><span class="quantity">${item.total_vendido}</span></td>
                        <td><input type="number" class="profit-margin form-control" min="0" step="1" value="0"></td>
                        <td>C$<span class="total-profit">0.00</span></td>
                    `;
                    tableBody.appendChild(row);
                });
                // Actualizar el total de utilidades al cargar los datos
                updateTotalProfit();
            }
        })
        .catch(error => console.error('Error al generar el reporte:', error))
        .finally(() => {
            // Ocultar el modal después de que la consulta finalice
            loadingModal.hide();
        });
});

// Inicializa el total de utilidades al cargar la página
updateTotalProfit();
