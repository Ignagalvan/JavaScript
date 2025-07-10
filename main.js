document.addEventListener("DOMContentLoaded", () => {
    const divListaProductos = document.getElementById('lista-productos');
    const inputNombreProducto = document.getElementById('nombre-producto');
    const inputCantidadProducto = document.getElementById('cantidad-producto');
    const botonAgregarCarrito = document.getElementById('boton-agregar-carrito');
    const areaMensajes = document.getElementById('area-mensajes');
    const divItemsCarrito = document.getElementById('items-carrito');
    const pTotalCarrito = document.getElementById('total-carrito');
    const botonFinalizarCompra = document.getElementById('boton-finalizar-compra');
    const botonVaciarCarrito = document.getElementById('boton-vaciar-carrito');

    let listaProductos = [];
    let stockOriginal = []; // Guardamos el stock original
    let carrito = [];

    fetch('./assets/productos.json')
        .then(res => res.json())
        .then(data => {
            listaProductos = data;
            // Guardamos una copia del stock original
            stockOriginal = data.map(producto => ({
                nombre: producto.nombre,
                cantidadStock: producto.cantidadStock
            }));
            cargarDesdeLocalStorage();
            mostrarProductos();
            mostrarCarrito();
        });

    function mostrarMensaje(msg, tipo = 'info') {
        areaMensajes.textContent = msg;
        areaMensajes.className = `area-mensajes ${tipo}`;
    }

    function mostrarSweetAlert(msg, icon = 'info') {
        Swal.fire({
            text: msg,
            icon: icon,
            confirmButtonText: 'OK'
        });
    }

    function guardarEnLocalStorage() {
        localStorage.setItem('listaProductos', JSON.stringify(listaProductos));
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }

    function cargarDesdeLocalStorage() {
        const productosGuardados = localStorage.getItem('listaProductos');
        const carritoGuardado = localStorage.getItem('carrito');
        if (productosGuardados) listaProductos = JSON.parse(productosGuardados);
        if (carritoGuardado) carrito = JSON.parse(carritoGuardado);
    }

    function restaurarStockCarrito() {
        // Solo restaurar el stock de los productos que están en el carrito
        // (para cuando se vacía el carrito sin finalizar la compra)
        carrito.forEach(itemCarrito => {
            const producto = listaProductos.find(p => p.nombre === itemCarrito.nombre);
            if (producto) {
                producto.cantidadStock += itemCarrito.cantidad;
            }
        });
    }

    function mostrarProductos() {
        divListaProductos.innerHTML = "";
        listaProductos.forEach(p => {
            const pDiv = document.createElement("div");
            pDiv.innerHTML = `<strong>${p.nombre}</strong> - $${p.precio} (Stock: ${p.cantidadStock})`;
            divListaProductos.appendChild(pDiv);
        });
    }

    function mostrarCarrito() {
        divItemsCarrito.innerHTML = "";
        let total = 0;
        carrito.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.textContent = `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}`;
            divItemsCarrito.appendChild(itemDiv);
            total += item.precio * item.cantidad;
        });
        if (carrito.length > 0) {
            const totalP = document.createElement("p");
            totalP.id = "total-carrito";
            totalP.innerHTML = `<strong>Total: $${total}</strong>`;
            divItemsCarrito.appendChild(totalP);
        }
    }

    botonAgregarCarrito.addEventListener("click", () => {
        const nombre = inputNombreProducto.value.trim();
        const cantidad = parseInt(inputCantidadProducto.value);

        const producto = listaProductos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

        if (!producto) {
            mostrarSweetAlert("Producto no encontrado", "error");
            return;
        }

        if (cantidad > producto.cantidadStock) {
            mostrarSweetAlert("Stock insuficiente", "warning");
            return;
        }

        producto.cantidadStock -= cantidad;

        const existente = carrito.find(item => item.nombre === producto.nombre);
        if (existente) {
            existente.cantidad += cantidad;
        } else {
            carrito.push({ nombre: producto.nombre, precio: producto.precio, cantidad });
        }

        guardarEnLocalStorage();
        mostrarProductos();
        mostrarCarrito();
        mostrarMensaje("Producto agregado al carrito", "info");
    });

    botonFinalizarCompra.addEventListener("click", () => {
        if (carrito.length === 0) {
            mostrarSweetAlert("El carrito está vacío", "warning");
            return;
        }

        let resumen = "Gracias por tu compra!\n\nResumen:\n";
        carrito.forEach(p => {
            resumen += `- ${p.nombre} x${p.cantidad} = ${p.precio * p.cantidad}\n`;
        });

        Swal.fire({
            title: 'Compra finalizada',
            text: resumen,
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        // Solo vaciamos el carrito, NO restauramos el stock
        // porque la compra ya se finalizó
        carrito = [];
        guardarEnLocalStorage();
        mostrarCarrito();
    });

    botonVaciarCarrito.addEventListener("click", () => {
        // Restaurar el stock solo de los productos que están en el carrito
        restaurarStockCarrito();
        
        carrito = [];
        guardarEnLocalStorage();
        mostrarProductos(); // Actualizar la vista de productos
        mostrarCarrito();
        mostrarMensaje("Carrito vaciado", "info");
    });
});