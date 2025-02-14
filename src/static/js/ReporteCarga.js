// Declarar la variable del modal para controlarlo
let loadingModal;
const generatedIds = new Set();

// Función para inicializar el modal solo una vez
function initLoadingModal() {
    if (!loadingModal) {
        loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    }
}

window.onload = () => {
    const nicaraguaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Managua' }).format(new Date());
    document.getElementById("startDate").value = nicaraguaDate;
};

// Función para generar el reporte y enviar las fechas y horas al backend
document.getElementById("filterForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Inicializar el modal y mostrarlo
    initLoadingModal();
    loadingModal.show();

    // Obtener la fecha y hora de inicio seleccionadas
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Combinar fecha y hora de inicio en un solo campo de timestamp


    // Enviar los datos al backend usando fetch
    fetch(`/GestionReportes/Carga?fecha_hora_inicio=${startDate}&fecha_fin=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById("productReportTable");
            tableBody.innerHTML = ""; // Limpiar contenido de la tabla
            debugger
            console.log(data)
            if (data.length === 0) {
                // Si no hay datos, mostrar un mensaje en la tabla
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="3" class="text-center">No se encontraron productos en el rango seleccionado</td>`;
                tableBody.appendChild(row);
            } else {

                data.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `<td class="Producto">${item.producto}</td><td class="Cantidad">${item.total_vendido}</td><td>${item.totalingresos}</td>`;
                    tableBody.appendChild(row);
                });
            }
        })
        .catch(error => console.error('Error al generar el reporte:', error))
        .finally(() => {
            // Asegurarse de ocultar el modal después de que la consulta finalice
            loadingModal.hide();
        });
});

document.addEventListener("DOMContentLoaded", function () {
    // Función para imprimir el reporte
    async function printReport(productos) {
        showLoadingModal();
        try {
            // Realiza la solicitud AJAX
            $.ajax({
                url: '/ver_ticketCarga',
                method: 'GET',
                data: { productos: JSON.stringify(productos) },
                xhrFields: {
                    responseType: 'blob'  // Para recibir la respuesta como blob (PDF)
                },
                success: function (blob) {
                    // Usar FileSaver para descargar el archivo PDF
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `TicketCarga-${generateUniqueId()}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    hideLoadingModal();
                },
                error: function (xhr, status, error) {
                    hideLoadingModal();
                    console.error(`Error en la solicitud AJAX: ${error}`);
                }
            });

        } catch (error) {
            hideLoadingModal();
            console.error('Error al descargar el PDF:', error);
        }
    }

    // Asigna el evento sin ejecutar la función inmediatamente
    $("#btnImpReporteCarga").on('click', function () {
        let productos = [];

        // Recorre la tabla para obtener los productos y cantidades
        $('#tableProducts tbody tr').each(function () {
            const producto = $(this).find('.Producto').text();
            const cantidad = parseFloat($(this).find('.Cantidad').text());

            if (cantidad > 0) {
                productos.push({
                    producto: producto,
                    cantidad: cantidad
                });
            }
        });

        printReport(productos);
    });

    function showLoadingModal() {
        let loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        loadingModal.show();
    }

    // Función para ocultar el modal de carga
    function hideLoadingModal() {
        let loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (loadingModal) {
            loadingModal.hide();
        }
    }


});

function generateUniqueId() {
    let id;
    do {
        id = Math.random().toString(36).substr(2, 9); // Genera un ID único
    } while (generatedIds.has(id)); // Asegura que no se repita
    generatedIds.add(id); // Almacena el ID
    return id;
}


