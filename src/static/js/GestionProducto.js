// DOM Elements
const addProductForm = document.getElementById('addProductForm');
const productList = document.getElementById('productList');
const noProductsRow = document.getElementById('noProductsRow');
const editProductForm = document.getElementById('editProductForm');
const saveEditButton = document.getElementById('saveEditButton');

window.onload = function () {
    let loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    setTimeout(() => {
        loadingModal.hide();
    }, 500);  // Tiempo de espera para que la transición se complete
};

// Manejar el envío del formulario de agregar producto
document.getElementById("addProductForm").addEventListener("submit", function (event) {
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
            
            window.location.reload();
        } else {
            alert('Ocurrió un error: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingModal();
        alert('Ocurrió un error al enviar los datos.');
    });
});

// Para abrir el modal de editar Productos y cargar los datos 
document.querySelectorAll(".edit-button").forEach(function (button) {
    button.addEventListener("click", function () {
        // Obtener el ID del Producto
        let productID = this.getAttribute("data-id");

        // Obtener la fila de la tabla correspondiente al producto
        let row = this.closest("tr");
        let productName = row.cells[1].innerText; 
        let productDescription = row.cells[2].innerText; 
    
        // Rellenar el formulario del modal con los datos del producto 
        document.getElementById('editProductId').value = productID;
        document.getElementById('editProductName').value = productName;
        document.getElementById('editProductDescription').value = productDescription;
    
        // Mostrar el modal
        let editModal = new bootstrap.Modal(document.getElementById("editModalProduct"));
        editModal.show();

        // Al enviar el formulario de actualizar Productos
        document.getElementById("editProductForm").addEventListener("submit", function (event) {
                event.preventDefault(); // Evitar el envío inmediato para mostrar la pantalla de espera

                editModal.hide();
                showLoadingModal(); 

                // Crear un objeto FormData para capturar los datos del formulario
                const formData = new FormData(this);

                // Enviar el formulario de manera asíncrona con fetch()
                fetch(this.action, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json()) 
                .then(data => {
                    hideLoadingModal();
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert('Ocurrió un error: ' + data.message);
                    }
                })
                .catch(error => {
                    hideLoadingModal();
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
            editButton.click(); // Llamar a la función de clic para editar
        }
    });
});

// Función para eliminar un Producto
function deleteProduct(id, nombre) {
    Swal.fire({
        title: "¿Deseas eliminar el Producto " + nombre + "?",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        icon: "warning",
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar modal de espera (con tu lógica actual de modal de espera)
            showLoadingModal();

            // Enviar la solicitud de eliminación de forma asíncrona
            fetch("/deleteProduct/" + id, {
                method: "POST",
            })
            .then(response => response.json())
            .then((data) => {
                // Ocultar el modal de espera cuando se reciba la respuesta
                hideLoadingModal();

                if (data.success) {
                    // Mostrar SweetAlert de éxito y recargar la página
                    Swal.fire({
                        title: "Producto eliminado exitosamente",
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
                    text: "Ocurrió un error al eliminar el producto.",
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
            const productId = this.getAttribute("data-id");
            const productName = this.getAttribute("data-nombre");
            deleteProduct(productId, productName);
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


//Busqueda de Productos desde la barrra
document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('searchInput');
    var tableRows = document.querySelectorAll('#productList tbody tr');

    searchInput.addEventListener('keyup', function() {
        var searchValue = this.value.toLowerCase();

        tableRows.forEach(function(row) {
            var productName = row.cells[1].textContent.toLowerCase();
            var productDescription = row.cells[2].textContent.toLowerCase();

            if (productName.includes(searchValue) || productDescription.includes(searchValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});
