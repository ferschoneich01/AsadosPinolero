let navbar = document.querySelector(".navmenu");
let logout = document.querySelector("#logout");
let btnToggle = document.querySelector("#btn-menu");

// ABRE MENU AL CLICK Y CAMBIA DE ICONO
btnToggle.addEventListener("click", () => {
    navbar.classList.toggle("open");
    menuBtnChange()
});


// FUNCION CAMBIAR ICONO
function menuBtnChange() {
    if (navbar.classList.contains("open")) {
        btnToggle.classList.replace("bx-menu", "bx-left-arrow");
    } else {
        btnToggle.classList.replace("bx-left-arrow", "bx-menu");
    }
}

//Para cerrar la sesion
logout.addEventListener("click", (event) => {
    event.preventDefault();
    Swal.fire({
        title: "¿Estás seguro de que deseas cerrar la sesión?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, salir",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/logout'; // Redirigir solo si se confirma
        }
    });
});


// Función para obtener la fecha y hora actuales
function actualizarFechaHora() {
    const fechaActual = new Date();

    // Formatear la fecha
    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1; // Los meses comienzan desde 0
    const año = fechaActual.getFullYear();

    // Obtener las horas, minutos y segundos
    let horas = fechaActual.getHours();
    const minutos = fechaActual.getMinutes();

    // Determinar si es AM o PM
    const sufijo = horas >= 12 ? 'PM' : 'AM';

    // Convertir a formato de 12 horas
    horas = horas % 12;
    horas = horas ? horas : 12; // El '0' debe ser '12' en formato de 12 horas

    // Formatear los minutos y segundos para que siempre tengan 2 dígitos
    const minutosFormateados = minutos < 10 ? '0' + minutos : minutos;
    // Formatear la fecha y hora completa
    const fechaFormateada = `${dia}/${mes}/${año}`;
    const horaFormateada = `${horas}:${minutosFormateados}${sufijo}`;

    // Insertar la fecha y hora en la etiqueta <p> con id "fecha-hora"
    document.getElementById('fecha').textContent = `Fecha: ${fechaFormateada} - Hora: ${horaFormateada}`;
}

function saludoInicial() {
    // Obtener la hora actual
    const now = new Date();
    const hour = now.getHours();
    let greeting = "";

    // Determinar el saludo según la hora
    if (hour >= 6 && hour < 12) {
        greeting = "Buenos días";
    } else if (hour >= 12 && hour < 18) {
        greeting = "Buenas tardes";
    } else {
        greeting = "Buenas noches";
    }

    console.log("entro");
    // Actualizar el contenido del label
    document.getElementById("greetingLabel").innerText = greeting;
}

// Llamar a la función cada segundo (1000 milisegundos)
setInterval(actualizarFechaHora, 1000);

// Llamar a la función inmediatamente para mostrar la hora sin esperar 1 segundo
actualizarFechaHora();

saludoInicial()