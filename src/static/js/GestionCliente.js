// DOM Elements
const addClientForm = document.getElementById("addClientForm");
const clientList = document.getElementById("clientList");
const noClientsRow = document.getElementById("noClientsRow");
const editClientForm = document.getElementById("editClientForm");
const saveEditButton = document.getElementById("saveEditButton");
const searchInput = document.getElementById("searchInput");

window.onload = function () {
    let loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    setTimeout(() => {
        loadingModal.hide();
    }, 500);
};

// Manejar el envío del formulario de agregar producto
document.getElementById("addClientForm").addEventListener("submit", function (event) {
    event.preventDefault();  

    showLoadingModal();
    const formData = new FormData(this);

    fetch(this.action, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        if (data.success) {
            Swal.fire({
                title: "Cliente Registrado Exitosamente",
                icon: "success",
                showConfirmButton: false,
                timer: 1000,
            })
            window.location.reload();
        } else {
            hideLoadingModal()
            Swal.fire({
                title: "Ocurrió Revise los datos / Cédula Duplicada",
                icon: "error",
                showConfirmButton: true,
            })
            
        }
    })
    .catch(error => {
        hideLoadingModal();
        Swal.fire({
            title: "Ocurrió un error intente nuevamente",
            icon: "error",
            showConfirmButton: true,
        })
    });
});

// Funcion para Editar Clientes
document.querySelectorAll(".edit-button").forEach(function (button) {
    button.addEventListener("click", function () {
        let clientId = this.getAttribute("data-id");

        let row = this.closest("tr");
        let cedula = row.cells[0].innerText;
        let nombres = row.cells[1].getAttribute("data-nombres");
        let apellidos = row.cells[1].getAttribute("data-apellidos");
        let telefono = row.cells[2].innerText;
        let direccion = row.cells[3].innerText;

        document.getElementById("editClientId").value = clientId;
        document.getElementById("editClientName").value = nombres;
        document.getElementById("editClientSurName").value = apellidos;
        document.getElementById("editClientPhone").value = telefono;
        document.getElementById("editClientCedula").value = cedula;
        document.getElementById("editClientAddress").value = direccion;

        // Mostrar el modal
        let editModal = new bootstrap.Modal(document.getElementById("editModalClient"));
        editModal.show();

        // Al enviar el formulario de actualizar cliente
        document.getElementById("editClientForm").addEventListener("submit", function (event) {
            event.preventDefault();

            // Ocultar el modal de editar cliente
            editModal.hide();

            // Mostrar el modal de espera
            showLoadingModal();

            // Simular una solicitud asíncrona para enviar el formulario
            const formData = new FormData(this);
            fetch(this.action, {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideLoadingModal();  // Ocultar el modal de espera
                if (data.success) {
                    // Si la actualización es exitosa, recargar la página o redirigir
                    window.location.reload();
                } else {
                    // Si ocurre un error, mostrar mensaje de error
                    alert('Ocurrió un error: ' + data.message);
                }
            })
            .catch(error => {
                hideLoadingModal();  // Ocultar el modal de espera en caso de error
                alert('Ocurrió un error al enviar los datos.');
            });
        });
    });
});

// Añadir evento para abrir el modal de edición con doble clic en la fila
document.querySelectorAll("table tr").forEach(function (row) {
    row.addEventListener("dblclick", function () {
        // Obtener el botón de editar dentro de la fila correspondiente
        let editButton = row.querySelector(".edit-button");

        // Simular el clic en el botón de editar
        if (editButton) {
            editButton.click();
        }
    });
});

// Función para eliminar un Cliente
function deleteClient(id, nombre) {
    Swal.fire({
        title: "¿Deseas eliminar el Cliente " + nombre + "?",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        icon: "warning",
    }).then((result) => {
        if (result.isConfirmed) {
            
            showLoadingModal();

            // Enviar la solicitud de eliminación de forma asíncrona
            fetch("/deleteClient/" + id, {
                method: "POST",
            })
            .then(response => response.json())
            .then((data) => {
                
                hideLoadingModal();

                if (data.success) {
                    Swal.fire({
                        title: "Cliente eliminado exitosamente",
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
                    text: "Ocurrió un error al eliminar el cliente, asegurese que no tiene una venta asociada",
                    icon: "error",
                });
            });
        }
    });
}

// Añadir evento click al botón de eliminar
document.addEventListener("DOMContentLoaded", function () {
    const deleteButtons = document.querySelectorAll(".delete-button");
    deleteButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const clientId = this.getAttribute("data-id");
            const clientName = this.getAttribute("data-nombre");
            deleteClient(clientId, clientName);
        });
    });
});

// Función para eliminar tildes y caracteres especiales de una cadena
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Filtrar en la tabla Clientes con la barra de búsqueda
document.addEventListener('DOMContentLoaded', function() {
    // Captura el input de búsqueda
    var searchInput = document.getElementById('searchInput');
    
    // Añadir el evento keyup al campo de búsqueda
    searchInput.addEventListener('keyup', function() {
        var searchValue = normalizeString(this.value); // Normalizar el valor de búsqueda
        var tableRows = document.querySelectorAll('#clientList tbody tr');
        
        tableRows.forEach(function(row) {
            // Combinar nombre y apellidos para búsqueda
            var fullName = normalizeString(row.querySelector('td[data-nombres]').textContent) + ' ' + normalizeString(row.querySelector('td[data-apellidos]').textContent);
            var phone = normalizeString(row.cells[1].textContent);
            var cedula = normalizeString(row.cells[0].textContent);
            var direccion = normalizeString(row.cells[3].textContent);
            
            // Filtrar resultados
            if (fullName.includes(searchValue) || phone.includes(searchValue) || cedula.includes(searchValue) || direccion.includes(searchValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});

//Funciones para mostrar y ocultar modal de espera
function showLoadingModal() {
    let loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();
}

function hideLoadingModal() {
    let loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (loadingModal) {
        loadingModal.hide();
    }
}
