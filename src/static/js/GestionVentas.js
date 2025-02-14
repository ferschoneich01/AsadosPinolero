//variables globales
var montoTotal = 0.00;
var productQuantity = 0.00;
var productPrice = 0.00;
var ClienteID = 0;

// Variable global para almacenar la instancia del modal
let modalPagoInicialInstance = null;

// Función para realizar la búsqueda con AJAX
document.addEventListener("DOMContentLoaded", function () {

    $('#btn-searchClient').on('click', function () {
        const query = $("#cedulaCliente").val();
        document.getElementById("NombreCliente").value = "";
        document.getElementById("direccionCliente").value = "";
        document.getElementById("telefonoCliente").value = "";
        // Verificar si el usuario ha escrito algo
        if (query.length > 0) {
            showLoadingModal();
            // Realizar la solicitud AJAX
            $.ajax({
                url: '/buscar_cliente', // Ruta a tu API o servidor
                method: 'GET',
                data: {
                    query: query,           // Parámetro original
                    filtroBusClient: $('#filtroBusClient').val()    // Nuevo parámetro
                },
                success: function (response) {

                    // Verificar si la respuesta es una lista y contiene al menos un cliente
                    if (Array.isArray(response) && response.length > 1) {
                        const listaClientes = document.getElementById("listaClientes");
                        listaClientes.innerHTML = ''; // Limpiar lista

                        // Añadir cada cliente a la lista en el modal
                        response.forEach(cliente => {
                            const listItem = document.createElement("li");
                            listItem.textContent = `${cliente.nombres} ${cliente.apellidos} - ${cliente.telefono}`;
                            // Agregar propiedades CSS
                            listItem.style.color = "gray";
                            listItem.style.fontWeight = "lighter";
                            listItem.style.margin = "5px 0";
                            listItem.style.borderBottom = "1px solid #ccc";
                            listItem.style.padding = "10px";
                            listItem.style.listStyle = "none";

                            // Agregar evento de selección para cada cliente
                            listItem.addEventListener("click", function () {
                                document.getElementById("NombreCliente").value = cliente.nombres + " " + cliente.apellidos;
                                document.getElementById("direccionCliente").value = cliente.direccion;
                                document.getElementById("telefonoCliente").value = cliente.telefono;
                                ClienteID = cliente.clienteid;

                                // Habilita botón para ventas
                                document.getElementById("btnInitSell").classList.remove('disabled');
                                document.getElementById("btnInitSell").removeAttribute("aria-disabled");

                                // Ocultar modal
                                $('#clienteModal').modal('hide');
                            });

                            // Agregar el elemento a la lista
                            listaClientes.appendChild(listItem);
                        });

                        // Mostrar el modal
                        $('#clienteModal').modal('show');
                        hideLoadingModal();

                    } else if (response) {
                        // Si hay datos de cliente
                        if (Array.isArray(response)) {
                            response.forEach(cliente => {
                                document.getElementById("btnInitSell").removeAttribute("aria-disabled");
                                document.getElementById("NombreCliente").value = cliente.nombres + " " + cliente.apellidos;
                                document.getElementById("direccionCliente").value = cliente.direccion;
                                document.getElementById("telefonoCliente").value = cliente.telefono;
                                ClienteID = cliente.clienteid;

                            });
                        } else {
                            document.getElementById("btnInitSell").removeAttribute("aria-disabled");
                            document.getElementById("NombreCliente").value = response.nombres + " " + response.apellidos;
                            document.getElementById("direccionCliente").value = response.direccion;
                            document.getElementById("telefonoCliente").value = response.telefono;
                            ClienteID = response.clienteid;
                        }
                        // Habilita botón para ventas
                        document.getElementById("btnInitSell").classList.remove('disabled');
                    } else {
                        hideLoadingModal();
                        Swal.fire({
                            title: "No se encontro resultados",
                            text: 'No se encontro cliente.',
                            icon: "info",
                        });
                    }
                    hideLoadingModal();
                },
                error: function () {
                    hideLoadingModal();
                    Swal.fire({
                        title: "No se encontro resultados",
                        text: 'No se encontro cliente.',
                        icon: "info",
                    });
                }
            });
        } else {
            hideLoadingModal();
            Swal.fire({
                title: "No se encontro resultados",
                text: 'Por favor, ingrese una cédula.',
                icon: "info",
            });
        }
    });

    $('#btnInitSell').on('click', function () {
        showModaTipoVenta();
    });

    $('#btnGuardarTipoVenta').on('click', function () {
        //Deshabilita boton de la venta
        document.getElementById('btnInitSell').classList.add('disabled');
        hideModalTipoVenta();

        //agregar busqueda de productos
        $('#contetn-gestProduct').append(`
        <div class="card-header">Productos</div>
        <div class="card-body">
            <form id="productoForm">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="codigoProducto" class="form-label">Datos del Producto</label>
                        <div class="mb-4">
                            <div id="btn_code">
                                <input style="width: auto; display: inline;" type="text" id="buscador"
                                class="form-control" placeholder="Buscar productos...">
                            </div>
                            
                            <!-- Lista de resultados -->
                            <ul style="position: relative;" id="listaResultados" class="list-group mt-2">
                                <!-- Los resultados de la búsqueda se llenarán aquí dinámicamente -->
                            </ul>
                        </div>

                    </div>
                    <div class="col-md-6">
                        <div id="formProduct" class="formProduct">

                        </div>
                    </div>
                </div>
            </form>
        </div>
        
        `);


        $('#buscador').on('keyup', function () {
            const query = $(this).val();

            // Verificar si el usuario ha escrito algo
            if (query.length > 0) {
                // Realizar la solicitud AJAX
                $.ajax({
                    url: '/buscar_producto', // Ruta a tu API o servidor
                    method: 'GET',
                    data: { query: query },
                    success: function (response) {
                        // Limpiar resultados anteriores
                        $('#listaResultados').empty();

                        // Verificar si se encontraron resultados
                        if (response.length > 0) {
                            // Agregar cada resultado como un <li> en la lista
                            response.forEach(function (producto) {
                                $('#listaResultados').append(
                                    `<li class="list-group-item item" data-id="${producto.productoid}" data-name="${producto.nombre}" data-description="${producto.descripcion}">${producto.nombre} - ${producto.descripcion} - Código: ${producto.productoid}</li>`
                                );
                            });

                            document.querySelectorAll(".item").forEach(function (li) {
                                li.addEventListener("click", function () {

                                    // Obtener el ID del cliente del botón
                                    let productoID = this.getAttribute("data-id");
                                    let productName = this.getAttribute("data-name");
                                    let productDescripcion = this.getAttribute("data-description");



                                    $('#listaResultados').empty();

                                    $('#btn_code').append(`<button id="btn-close" type="button" class="btn-close ms-2" aria-label="Close" style="background-color:red;" onClick="removeFormProduct()"></button>`);

                                    document.getElementById("buscador").setAttribute("disabled", true);
                                    // Rellenar el formulario del modal con los datos del cliente
                                    $('#formProduct').append(
                                        `
                                        <div class="mb-3">
                                            <label for="NombreProducto" class="form-label">Nombre | Descripcion:</label>
                                            <input type="text" class="form-control" id="NombreProducto" placeholder="nombre" value="${productName} - ${productDescripcion}" disabled>
                                        </div>
                                        <div class="mb-3">
                                            <label for="CantidadProducto" class="form-label">Cantidad</label>
                                            <input type="number" class="form-control" id="CantidadProducto" placeholder="Ingrese la cantidad" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="PrecioProducto" class="form-label">Precio C$:</label>
                                            <input type="number" class="form-control" id="PrecioProducto" placeholder="Precio" required>
                                        </div>
                                        <button id="addProductList" type="button" class="btn btn-success">Agregar</button>
                                        `
                                    );

                                    document.getElementById("buscador").value = productoID;

                                    //Agregar productos
                                    $('#addProductList').on('click', function () {
                                        window.location.href = "#containerProducts";
                                        if (document.getElementById("PrecioProducto").value != '' && document.getElementById("CantidadProducto").value != '') {

                                            productPrice = parseFloat(document.getElementById("PrecioProducto").value);
                                            productQuantity = parseFloat(document.getElementById("CantidadProducto").value);



                                            //Suma al monto total
                                            montoTotal += (productPrice * productQuantity);

                                            //Agrega productos a la tabla
                                            $('#tablaProductos').append(
                                                `
                                            <tr data-id="${productoID}">
                                                <td class="Codigo">${productoID}</td>
                                                <td>${productName} - ${productDescripcion}</td>
                                                <td class="Precio">${productPrice}</td>
                                                <td class="Cantidad">${productQuantity}</td>
                                                <td>
                                                    <button type="button" class="btn-close" aria-label="Close" style="background-color:red;" onClick="dltProduct(this,${productPrice},${productQuantity})"></button>
                                                </td>
                                            </tr>
                                            `
                                            )

                                            //habilita boton de guardar venta 
                                            //muestra monto total
                                            $("#montoTotal").text(montoTotal);


                                            removeFormProduct();

                                        } else {
                                            Swal.fire({
                                                title: "No se pudo agregar producto",
                                                text: 'Porfavor complete los campos',
                                                icon: "info",
                                            });
                                        }

                                    });

                                });


                            });
                        } else {
                            // Si no hay resultados
                            $('#listaResultados').append('<li class="list-group-item">No se encontraron productos.</li>');
                        }
                    }
                });
            } else {
                // Limpiar resultados si la búsqueda es muy corta
                $('#listaResultados').empty();
            }
        });
    });




    // Función para mostrar el modal de carga
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


    function showModaTipoVenta() {
        let modalTipoVenta = new bootstrap.Modal(document.getElementById("modalTipoVenta"));
        modalTipoVenta.show();
    }

    function hideModalTipoVenta() {
        let modalTipoVenta = bootstrap.Modal.getInstance(document.getElementById("modalTipoVenta"));

        if (modalTipoVenta) {
            modalTipoVenta.hide();
        }

    }

    //Guardar ventas
    $('#btnGuardarVenta').on('click', function () {

        if ($('#selectTipoVenta').val() == "Contado") {
            const cliente_id = ClienteID;
            const usuario_id = 0;
            const tipo_venta = $('#selectTipoVenta').val();
            const tipo_entrega = $('#selectTipoEntrega').val();
            const pagoInicial = 0;
            const observacion = $('#observacion').val();

            succesSale(cliente_id, usuario_id, tipo_venta, tipo_entrega, pagoInicial, observacion);
        } else {
            Swal.fire({
                title: '¿Desea realizar un pago inicial?',
                showDenyButton: true,             // Habilita el botón "No"
                showCancelButton: true,           // Habilita el botón "Cancelar"
                confirmButtonText: 'Sí',          // Texto del botón "Sí"
                denyButtonText: 'No',             // Texto del botón "No"
                cancelButtonText: 'Cancelar',     // Texto del botón "Cancelar"
                confirmButtonColor: '#3085d6',
                denyButtonColor: '#d33',
                cancelButtonColor: '#aaa'
            }).then((result) => {
                if (result.isConfirmed) {


                    showModalPagoInicial();


                } else if (result.isDenied) {
                    // Si elige "No", realiza la venta sin pago inicial
                    const cliente_id = ClienteID;
                    const usuario_id = 0;
                    const tipo_venta = $('#selectTipoVenta').val();
                    const tipo_entrega = $('#selectTipoEntrega').val();
                    const pagoInicial = 0;
                    const observacion = $('#observacion').val();


                    succesSale(cliente_id, usuario_id, tipo_venta, tipo_entrega, pagoInicial, observacion);


                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    // Acción opcional cuando el usuario cancela
                    console.log("El usuario canceló la acción.");
                }
            });
        }



    });

    $('#guardarVenta').on('click', function () {
        if ($("#pagoInicial").val().length >= 1 && parseFloat($("#pagoInicial").val()) > 0) {
            hideModalPagoInicial();
            const cliente_id = ClienteID;
            const usuario_id = 0;
            const tipo_venta = $('#selectTipoVenta').val();
            const tipo_entrega = $('#selectTipoEntrega').val();
            const pagoInicial = $("#pagoInicial").val();
            const observacion = $('#observacion').val();

            succesSale(cliente_id, usuario_id, tipo_venta, tipo_entrega, pagoInicial, observacion);
        } else {
            document.getElementById("pagoInicial").style.borderColor = "red";
            document.getElementById("msgPagoInicial").style.color = "red";
            document.getElementById("msgPagoInicial").textContent = 'El pago inicial debe ser mayor a cero';
        }
    });

    function succesSale(cliente_id,
        usuario_id,
        tipo_venta,
        tipo_entrega,
        pagoInicial,
        observacion) {
        showLoadingModal();
        // Recoger los productos de la tabla de productos
        let productos = [];
        $('#tableProducts tbody tr').each(function () {
            const productoid = $(this).find('.Codigo').text();
            const cantidad = parseFloat($(this).find('.Cantidad').text());
            const preciounitario = parseFloat($(this).find('.Precio').text());


            if (cantidad > 0 && preciounitario > 0) {
                productos.push({
                    productoid: productoid,
                    cantidad: cantidad,
                    preciounitario: preciounitario
                });
            }
        });

        // Validar que al menos haya un producto
        if (productos.length === 0) {
            hideLoadingModal();
            Swal.fire({
                title: "Error en venta",
                text: 'Debe agregar al menos un producto a la venta',
                icon: "info",
            });
            return;
        }

        // Crear el objeto de datos para enviar al servidor
        const datosVenta = {
            cliente_id: cliente_id,
            usuario_id: usuario_id,
            tipo_venta: tipo_venta,
            tipo_entrega: tipo_entrega,
            productos: productos,
            montoPagoInicial: pagoInicial,
            observacion: observacion
        };

        // Enviar la solicitud AJAX al servidor
        $.ajax({
            url: '/saveSale', // URL donde está tu ruta para guardar la venta
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(datosVenta),
            success: function (response) {
                if (response.status === 'success') {
                    //hideLoadingModal();
                    // Mostrar SweetAlert de éxito y recargar la página
                    Swal.fire({
                        title: "Venta registrada exitosamente",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1000,
                    }).then(() => {
                        hideLoadingModal();
                        // Recargar la página después de eliminar
                        if (pagoInicial > 0) {
                            abrirFacturaParaImprimir(response.NumFact, 1);
                        } else {
                            abrirFacturaParaImprimir(response.NumFact, 2);
                        }


                    });

                } else {
                    hideLoadingModal();
                    // Si hubo un error, mostrar el mensaje de error
                    Swal.fire({
                        title: "Error en venta",
                        text: data.message,
                        icon: "error",
                    });
                }
            },
            error: function (xhr, status, error) {
                hideLoadingModal();
                Swal.fire({
                    title: "Error en venta",
                    text: 'Ocurrió un error al registrar la venta. Inténtalo de nuevo',
                    icon: "error",
                });
            }
        });


    }

    async function abrirFacturaParaImprimir(ventaId, tienePagoInicial) {
        try {
            showLoadingModal();

            const response = await fetch(`/ver_factura/${ventaId}/${tienePagoInicial}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf',
                },
            });

            if (!response.ok) {
                throw new Error(`Error al descargar el PDF: ${response.statusText}`);
            }

            // Convertir la respuesta en un blob
            const blob = await response.blob();

            // Usar FileSaver para forzar la descarga
            saveAs(blob, `factura_${ventaId}.pdf`);
            hideLoadingModal();

            $('input').val('');
            $('textarea').val('');
            montoTotal = 0.00
            productQuantity = 0.00;
            productPrice = 0.00;
            ClienteID = 0;
            location.reload();
        } catch (error) {
            hideLoadingModal();
            console.error('Error al descargar el PDF:', error);
        }
    }

    function filtrarClientes() {
        const filtro = document.getElementById("buscarCliente").value.toLowerCase();
        const items = document.querySelectorAll("#listaClientes li");

        items.forEach(item => {
            const nombreCliente = item.textContent.toLowerCase();
            if (nombreCliente.includes(filtro)) {
                item.style.display = ""; // Mostrar si coincide
            } else {
                item.style.display = "none"; // Ocultar si no coincide
            }
        });
    }

    $('#btnCancelar').on('click', function () {
        // Selecciona todos los inputs y los limpia
        $('input').val('');
        $('textarea').val('');
        montoTotal = 0.00
        productQuantity = 0.00;
        productPrice = 0.00;
        ClienteID = 0;
        location.reload();

    });

    // Ejecutar filtrarClientes en tiempo real mientras el usuario escribe
    document.getElementById("buscarCliente").addEventListener("input", filtrarClientes);
});

function showModalPagoInicial() {
    // Verifica si ya existe una instancia
    if (!modalPagoInicialInstance) {
        // Crea la instancia solo si no existe
        modalPagoInicialInstance = new bootstrap.Modal(document.getElementById("modalPagoInicial"));
    }
    // Muestra el modal usando la instancia existente
    modalPagoInicialInstance.show();
}

function hideModalPagoInicial() {
    // Usa la instancia global si existe
    if (modalPagoInicialInstance) {
        modalPagoInicialInstance.hide();
    }
}

function removeFormProduct() {
    let ul = document.getElementById("formProduct");
    // Limpia el <ul> eliminando todos sus elementos hijos
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    const tabla = document.getElementById('tableProducts');

    var filas = tabla.getElementsByTagName("tbody")[0].getElementsByTagName("tr").length;

    if (filas > 0) {

        document.getElementById("btnGuardarVenta").removeAttribute("disabled");
    }

    document.getElementById("buscador").removeAttribute("disabled");
    document.getElementById("buscador").value = "";
    document.getElementById('btn-close').remove();


}

function dltProduct(btn, price, quantity) {
    // Obtener la fila en la que se encuentra el botón
    const fila = btn.parentNode.parentNode;

    // Obtener la tabla
    const tabla = document.getElementById('tableProducts');

    console.log((price * quantity));
    montoTotal -= parseFloat(price * quantity);

    $("#montoTotal").text(montoTotal);

    // Eliminar la fila de la tabla
    tabla.deleteRow(fila.rowIndex);


    var filas = tabla.getElementsByTagName("tbody")[0].getElementsByTagName("tr").length;

    if (filas == 0) {
        document.getElementById("btnGuardarVenta").setAttribute("disabled", true);
    }
}