// Configuración inicial del gráfico
const ctx = document.getElementById('salesChart').getContext('2d');
let salesChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Cantidad Vendida',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            datalabels: {
                anchor: 'end',
                align: 'top',
                formatter: Math.round,
                color: '#333',
                font: {
                    weight: 'bold'
                }
            }
        }
    },
    plugins: [ChartDataLabels]
});

// Función para actualizar el gráfico con los datos recibidos
function updateChart(data) {
    const labels = data.map(item => item.nombreproducto);
    const quantities = data.map(item => item.cantidadvendida);

    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = quantities;
    salesChart.update();
}

// Función para manejar el envío del formulario
document.getElementById("filterForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const mes = document.getElementById("month").value;
    const anio = document.getElementById("year").value;

    // Mostrar el modal de carga
    initLoadingModal();
    loadingModal.show();

    fetch(`/GestionReportes/Productos?mes=${mes}&anio=${anio}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error: ${data.error}`);
            } else if (data.length > 0) {
                updateChart(data); 
            } else {
                alert("No hay datos para el mes y año seleccionados.");
                updateChart([]);  // Actualiza con datos vacíos si no hay información
            }
        })
        .catch(error => console.error("Error al generar el reporte:", error))
        .finally(() => {
            loadingModal.hide();  // Ocultar el modal de carga
        });
});

// Generar opciones de año de forma incremental y seleccionar el año actual
function populateYearOptions() {
    const yearSelect = document.getElementById("year");
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;

    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
}

// Seleccionar el mes actual por defecto
function selectCurrentMonth() {
    const monthSelect = document.getElementById("month");
    const currentMonth = new Date().getMonth() + 1;
    monthSelect.value = currentMonth;
}

populateYearOptions();
selectCurrentMonth();

// Configuración del modal de carga
let loadingModal;
function initLoadingModal() {
    if (!loadingModal) {
        loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    }
}

// Función para imprimir el reporte
function printReport() {
    const printContents = document.querySelector(".container").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
}
