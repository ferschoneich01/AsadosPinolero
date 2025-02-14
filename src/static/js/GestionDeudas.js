const generatedIds = new Set();

window.onload = function () {
    let loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    setTimeout(() => {
        loadingModal.hide();
    }, 500);  // Tiempo de espera para que la transición se complete
};

// DOM Elements
const clientSelect = document.getElementById("customerSelect");
const paymentHistory = document.getElementById("paymentHistory");

// Filtrar las ventas por cliente en el objeto 'sales_data'
function filtrarVentasPorCliente(clienteId) {
    return sales_data.filter((deuda) => deuda.clienteid == clienteId);
}

// Función para mostrar alertas con la nueva animación desde arriba
function mostrarAlertaBootstrap(mensaje, tipo) {
    const alertPlaceholder = document.getElementById("alertPlaceholder");

    // Limpiar alertas previas antes de mostrar una nueva
    alertPlaceholder.innerHTML = "";

    // Crear nueva alerta
    const alert = document.createElement("div");
    alert.className = `alert alert-${tipo} alert-dismissible fade show showing`; // Añadimos clase 'showing' para animación
    alert.role = "alert";
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertPlaceholder.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove("showing");
        alert.classList.add("hiding");

        setTimeout(() => {
            alert.remove();
        }, 500);
    }, 2000);
}

// Evento para manejar el clic en "Buscar Ventas"
document
    .getElementById("buscarVentasBtn")
    .addEventListener("click", function (e) {
        e.preventDefault();

        const clienteId = document.getElementById("customerSelect").value;

        if (clienteId) {
            const ventasFiltradas = filtrarVentasPorCliente(clienteId);
            actualizarTablaVentas(ventasFiltradas);
            updateTotal();
        } else {
            mostrarAlertaBootstrap(
                "Por favor, seleccione un cliente antes de buscar las ventas.",
                "warning"
            );
        }
    });

// Actualizar la tabla de ventas
function actualizarTablaVentas(ventasFiltradas) {
    const tbody = paymentHistory.querySelector("tbody");
    tbody.innerHTML = "";

    if (ventasFiltradas.length > 0) {
        ventasFiltradas.forEach((deuda) => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", deuda.ventaid);
            row.innerHTML = `
                <td>${deuda.deudaid}</td>
                <td>${deuda.ventaid}</td>
                <td>${deuda.nombres} ${deuda.apellidos}</td>
                <td>C$ ${Number(deuda.montodeuda).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}</td>
                <td>${deuda.fechaventa}</td>
                <td>
                    <button class="btn btn-sm btn-primary" data-id="${deuda.ventaid}">Ver detalles</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML =
            '<tr><td colspan="6" class="text-center">No se encontraron deudas para este cliente.</td></tr>';
    }
}

// Actualizar el total basado en los valores de la columna 'Monto'
function updateTotal() {
    const rows = document.querySelectorAll("#paymentHistory tbody tr");
    let total = 0;

    rows.forEach((row) => {
        const montoCell = row.querySelector("td:nth-child(4)");
        if (montoCell) {
            const monto = parseFloat(
                montoCell.textContent.replace("C$", "").replace(/,/g, "").trim()
            );
            if (!isNaN(monto)) {
                total += monto;
            }
        }
    });

    const totalElement = document.getElementById("total");
    totalElement.innerHTML = `<strong>Total Deuda: C$ ${total.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}</strong>`;
}

// Asignar la cédula del cliente seleccionado
$(document).ready(function () {
    $("#customerSelect").select2({
        placeholder: "Seleccione un cliente",
        allowClear: true,
    });

    $("#customerSelect").on("select2:select", function (e) {
        const cedula = $("#customerSelect option:selected").data("cedula");
        $("#clientCedula").val(cedula || "");
    });
});

async function imprimirRecibo(clienteId, montoAbono, tipoPago) {
    showLoadingModal();
    try {
        const response = await fetch(`/ver_recibo/${clienteId}/${montoAbono}/${tipoPago}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf',
            }
        });

        if (!response.ok) {
            throw new Error(`Error al descargar el PDF: ${response.statusText}`);
        }

        // Convertir la respuesta en un blob
        const blob = await response.blob();

        // Usar FileSaver para forzar la descarga
        saveAs(blob, `Recibo_${generateUniqueId()}.pdf`);

        hideLoadingModal();

        location.reload();

    } catch (error) {
        hideLoadingModal();
        console.error('Error al descargar el PDF:', error);
    }
}

// Mostrar detalles de las ventas en el modal
document.addEventListener("click", function (event) {
    if (event.target && event.target.matches("button.btn-primary")) {
        const ventaId = event.target.getAttribute("data-id"); // Obtener el ID directamente del botón

        if (ventaId) {
            const venta = sales_data.find((v) => v.ventaid == ventaId);
            if (venta) {
                const clienteNombre = `${venta.nombres} ${venta.apellidos}`;

                const montoVenta = venta.montoventa
                    ? Number(venta.montoventa).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })
                    : "0.00";
                const fechaVenta = venta.fechaventa;

                document.getElementById("clienteNombre").textContent = clienteNombre || "N/A";
                document.getElementById("fechaVenta").textContent = fechaVenta || "N/A";
                document.getElementById("ventaTotal").textContent = `C$ ${montoVenta}`;

                document.getElementById(
                    "detallesVentaModalLabel"
                ).textContent = `Detalles de la Venta (${ventaId})`;
                mostrarDetallesVenta(ventaId);
            } else {
                console.error(`No se encontró la venta con ID ${ventaId}`);
            }
        } else {
            console.error("No se encontró el atributo data-id en el botón.");
        }
    }
});

function mostrarDetallesVenta(ventaId) {
    fetch(`/detallesVentas/${ventaId}`)
        .then((response) => response.json())
        .then((data) => {
            const productosTableBody = document.getElementById("productosTableBody");
            productosTableBody.innerHTML = "";

            if (data.success && data.productos.length > 0) {
                let totalVenta = 0;

                data.productos.forEach((producto) => {
                    const subtotal = producto.preciounitario * producto.cantidad;
                    totalVenta += subtotal;

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${producto.nombre}</td>
                        <td>${producto.cantidad}</td>
                        <td>C$${producto.preciounitario.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>C$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    `;
                    productosTableBody.appendChild(row);
                });

                document.getElementById("ventaTotal").textContent = totalVenta.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            } else {
                productosTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron productos para esta venta.</td></tr>';
            }

            // Mostrar el modal de detalles de la venta
            let detallesModal = new bootstrap.Modal(document.getElementById("detallesVentaModal"));
            detallesModal.show();

            // Asignar el evento click al botón de eliminación y verificar con console.log
            const eliminarVentaBtn = document.getElementById("eliminarVentaBtn");
            eliminarVentaBtn.removeEventListener("click", () => eliminarVenta(ventaId)); // Eliminar cualquier evento previo
            eliminarVentaBtn.addEventListener("click", function () {
                console.log("Botón de eliminar clicado"); // Verificar que se activa el evento
                eliminarVenta(ventaId); // Llama a la función eliminarVenta pasando el ID de la venta
            });
        })
        .catch((error) => {
            console.error("Error al obtener los productos:", error);
        });
}


// Obtener todos los ventaid de las ventas mostradas en la tabla
function obtenerVentaIds() {
    const ventaIds = [];
    const rows = document.querySelectorAll("#paymentHistory tbody tr");
    rows.forEach((row) => {
        const ventaId = row.getAttribute("data-id");
        if (ventaId) {
            ventaIds.push(ventaId);
        }
    });
    return ventaIds;
}

// Función para mostrar el modal de pago y realizar un pago
function mostrarPagoModal(clienteNombre, ventaIds, totalDeuda) {
    document.getElementById("nombreClientePago").textContent = clienteNombre;
    document.getElementById("ventaIdsPago").textContent = ventaIds.join(", ");

    const montoInput = document.getElementById("montoParcialInput");
    montoInput.value = totalDeuda.toFixed(2);
    montoInput.disabled = true;

    let pagoModal = new bootstrap.Modal(document.getElementById("pagoModal"));
    pagoModal.show();

    // Eliminar event listeners anteriores si existen
    const botonPago = document.getElementById("confirmarPagoBtn");
    const botonPagoClon = botonPago.cloneNode(true);
    botonPago.parentNode.replaceChild(botonPagoClon, botonPago);

    botonPagoClon.addEventListener("click", function () {
        const clienteId = document.getElementById("customerSelect").value;
        const montoAbono = document.getElementById("montoParcialInput").value;

        if (clienteId && montoAbono) {
            fetch("/registrarPago", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clienteid: clienteId,
                    montoabono: montoAbono,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        mostrarAlertaBootstrap("Pago registrado exitosamente", "success");

                        // Seleccionar todos los checkbox con la clase 'form-check-input' que están seleccionados (checked)
                        const seleccionados = document.querySelectorAll('.form-check-input:checked');

                        // Ejemplo de uso si quieres almacenarlos en un array
                        const tipoPago = Array.from(seleccionados).map(checkbox => checkbox.value)

                        imprimirRecibo(clienteId, montoAbono, tipoPago);
                        pagoModal.hide();
                    } else {
                        mostrarAlertaBootstrap(
                            "Error al registrar el pago: " + data.message,
                            "error"
                        );
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } else {
            mostrarAlertaBootstrap(
                "Por favor complete los campos de cliente y monto",
                "warning"
            );
        }
    });

    // Habilitar/deshabilitar el campo de pago parcial
    document.getElementById("pagoModal").addEventListener("shown.bs.modal", function () {
        document.getElementById("pagoParcial").addEventListener("change", function () {
            montoInput.disabled = false;

            // Limpiar el campo
            montoInput.addEventListener("focus", function () {
                montoInput.value = "";
            });
        });

        document
            .getElementById("pagoTotal")
            .addEventListener("change", function () {
                montoInput.value = totalDeuda.toFixed(2);
                montoInput.disabled = true;
            });
    });
}

// Manejar el clic en el botón "Realizar Pago" para abrir el modal de pago
document.getElementById("realizarPagoBtn").addEventListener("click", function () {
    const ventaIds = obtenerVentaIds();
    let totalDeuda = 0;

    if (ventaIds.length > 0) {
        const clienteNombre =
            document.getElementById("customerSelect").selectedOptions[0]
                .textContent;

        const rows = document.querySelectorAll("#paymentHistory tbody tr");
        rows.forEach((row) => {
            const montoCell = row.querySelector("td:nth-child(4)");
            const monto = parseFloat(
                montoCell.textContent.replace("C$", "").replace(/,/g, "").trim()
            );
            if (!isNaN(monto)) {
                totalDeuda += monto;
            }
        });

        mostrarPagoModal(clienteNombre, ventaIds, totalDeuda);
    } else {
        mostrarAlertaBootstrap(
            "No hay ventas disponibles para realizar el pago.",
            "warning"
        );
    }
});

// Función para mostrar el historial de pagos en el modal
function cargarHistorialPago(historial) {
    const historialTableBody = document.getElementById("historialPagoTable").querySelector("tbody");
    historialTableBody.innerHTML = ""; // Limpiar la tabla antes de agregar los datos

    if (!Array.isArray(historial) || historial.length === 0) {
        // Si no hay historial de pagos, mostrar un mensaje en la tabla
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6" class="text-center">No se han registrado pagos para este cliente.</td>`;
        historialTableBody.appendChild(row);
    } else {
        // Si hay historial de pagos, agregar filas a la tabla
        historial.forEach((pago) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${pago.pagoid || "N/A"}</td>
                <td>${pago.deudaid || "N/A"}</td>
                <td>C$ ${pago.montoabono.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, })}</td>
                <td>${pago.fechapago || "N/A"}</td>
                <td>${pago.tipopago || "N/A"}</td>
                <td>
                 <button id="eliminarPagoBtn" class="btn btn-sm btn-danger delete-button" data-id="${pago.pagoid}" data-monto="${pago.montoabono}">Eliminar</button>
                </td>
                
            `;
            historialTableBody.appendChild(row);
        });
    }

    // Filtrar las filas de la tabla según el texto de búsqueda, ignorando las comas
    document.getElementById("historialPagoSearch").addEventListener("input", function () {
        const searchValue = this.value.toLowerCase().replace(/,/g, ""); // Eliminar comas del valor de búsqueda
        const rows = document.querySelectorAll("#historialPagoTable tbody tr");

        rows.forEach((row) => {
            // Eliminar comas del texto de las filas antes de comparar
            const rowText = row.innerText.toLowerCase().replace(/,/g, "");
            row.style.display = rowText.includes(searchValue) ? "" : "none";
        });
    });

}

// Función para abrir el modal de historial de pagos
function mostrarHistorialPagoModal(clienteNombre, clienteCedula, historialPago) {
    document.getElementById("nombreClienteHistorial").textContent = clienteNombre;
    document.getElementById("cedulaClienteHistorial").textContent = clienteCedula;

    // Cargar el historial de pagos en la tabla
    cargarHistorialPago(historialPago);

    // Obtener el modal y ajustar `aria-hidden`
    const historialPagoModalElement = document.getElementById("historialPagoModal");
    historialPagoModalElement.removeAttribute("aria-hidden");

    const historialPagoModal = new bootstrap.Modal(historialPagoModalElement);
    historialPagoModal.show();

    // Volver a agregar `aria-hidden` cuando el modal se cierra
    historialPagoModalElement.addEventListener("hidden.bs.modal", function () {
        historialPagoModalElement.setAttribute("aria-hidden", "true");
    });

    // Eliminar eventos previos para evitar duplicados
    document.querySelectorAll(".delete-button").forEach((deleteButton) => {
        deleteButton.replaceWith(deleteButton.cloneNode(true));
    });

    // Agregar el evento click al botón de eliminación después de que el modal esté visible
    document.querySelectorAll(".delete-button").forEach((deleteButton) => {
        deleteButton.addEventListener("click", function () {
            const pagoId = this.getAttribute("data-id");
            const pagomonto = this.getAttribute("data-monto"); // Asegúrate de que el atributo está configurado
            eliminarPago(pagoId, pagomonto);
        });
    });
}



// Evento click en el botón "Historial de Pagos"
document.getElementById("historialPagosBtn").addEventListener("click", function () {
    const clienteId = document.getElementById("customerSelect").value;
    const clienteNombre = document.getElementById("customerSelect").selectedOptions[0].textContent;
    const clienteCedula = document.getElementById("clientCedula").value;

    if (clienteId) {
        fetch(`/getHistorialPagos/${clienteId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    mostrarHistorialPagoModal(clienteNombre, clienteCedula, data.historial);
                } else {
                    mostrarAlertaBootstrap(
                        "Error al cargar el historial de pagos: " + data.message,
                        "danger"
                    );
                }
            })
            .catch((error) => {
                console.error("Error al realizar la solicitud:", error);
                mostrarAlertaBootstrap(
                    "Error al cargar el historial de pagos.",
                    "danger"
                );
            });
    } else {
        mostrarAlertaBootstrap(
            "Seleccione un cliente para ver su historial de pagos.",
            "warning"
        );
    }
});

// Función para eliminar un Pago
function eliminarPago(id, monto) {
    Swal.fire({
        title: "¿Deseas eliminar el pago: " + id + " de por el monto: " + monto + "?",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        icon: "warning",
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar modal de espera (con tu lógica actual de modal de espera)
            showLoadingModal();

            // Enviar la solicitud de eliminación de forma asíncrona
            fetch("/deletePago/" + id, {
                method: "POST",
            })
                .then(response => response.json())
                .then((data) => {
                    // Ocultar el modal de espera cuando se reciba la respuesta
                    hideLoadingModal();

                    if (data.success) {
                        // Mostrar SweetAlert de éxito y recargar la página
                        Swal.fire({
                            title: "Pago eliminado exitosamente",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1000,
                        }).then(() => {
                            // Recargar la página después de eliminar
                            window.location.reload();
                        });
                    } else {
                        // Si hubo un error, mostrar el mensaje de error
                        Swal.fire({
                            title: "Error",
                            text: data.message,
                            icon: "error",
                        });
                    }
                })
                .catch((error) => {
                    hideLoadingModal();  // Ocultar modal de espera en caso de error
                    Swal.fire({
                        title: "Error",
                        text: "Ocurrió un error al eliminar el pago.",
                        icon: "error",
                    });
                });
        }
    });
}

// Función para mostrar el modal de carga
function showLoadingModal() {
    const loadingModalElement = document.getElementById("loadingModal");

    loadingModalElement.removeAttribute("aria-hidden");
    const loadingModal = new bootstrap.Modal(loadingModalElement, {
        keyboard: false
    });
    loadingModal.show();
}

// Función para ocultar el modal de carga y agregar `aria-hidden`
function hideLoadingModal() {

    const loadingModalElement = document.getElementById("loadingModal");
    const loadingModal = bootstrap.Modal.getInstance(loadingModalElement);
    loadingModal.hide();
    loadingModalElement.setAttribute("aria-hidden", "true");
}

// Función para eliminar una venta
function eliminarVenta(ventaId) {
    console.log("Eliminar venta clicada, ID:", ventaId);
    Swal.fire({
        title: "¿Deseas eliminar esta venta?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar el modal de carga
            showLoadingModal();

            // Enviar la solicitud DELETE para eliminar la venta
            fetch(`/deleteSale/${ventaId}`, {
                method: "POST",
            })
                .then((response) => response.json())
                .then((data) => {
                    hideLoadingModal();  // Ocultar el modal de carga
                    debugger
                    if (data.success) {
                        Swal.fire({
                            title: "Venta eliminada exitosamente",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1000,
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: "Error",
                            text: data.message,
                            icon: "error",
                        });
                    }
                })
                .catch((error) => {
                    hideLoadingModal();
                    Swal.fire({
                        title: "Error",
                        text: "Ocurrió un error al eliminar la venta.",
                        icon: "error",
                    });
                    console.error("Error:", error);
                });
        }
    });
}


function generateUniqueId() {
    let id;
    do {
        id = Math.random().toString(36).substr(2, 9); // Genera un ID único
    } while (generatedIds.has(id)); // Asegura que no se repita
    generatedIds.add(id); // Almacena el ID
    return id;
}