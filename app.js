let carrito = [];
let turnoActual = 'manana';
let metodoPagoActual = null;
let total = 0;
let datosCatalogo = { categorias: [], productos: [] };
let categoriasStock = [];

const API_URL = "https://kioscoback.onrender.com";

// --- NAVEGACIÓN ---
function navigate(viewId) {
    // 1. Ocultamos todas las vistas
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    // 2. Mostramos la vista solicitada
    document.getElementById(viewId).classList.add('active');
    
    // 3. Cargamos los datos dependiendo de a dónde entramos
    if (viewId === 'view-venta') {
        cargarCatalogo();
    }
    if (viewId === 'view-catalogo') {
        cargarHistorialVentas();
    }
    if (viewId === 'view-stock') {
        cargarVistaStock(); // <-- Esta es la línea clave que faltaba ejecutar al entrar
    }
}

// --- LÓGICA VISTA VENTA ---
function setShift(shift) {
    turnoActual = shift;
    const body = document.getElementById('app-body');
    body.className = `shift-${shift}`;
}

async function cargarCatalogo() {
    try {
        const res = await fetch(`${API_URL}/api/catalogo-actual`);
        datosCatalogo = await res.json();
        renderCategorias();
    } catch (error) {
        console.error("Error al cargar catálogo", error);
    }
}

function renderCategorias() {
    const container = document.getElementById('categorias-container');
    container.innerHTML = '';
    
    datosCatalogo.categorias.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'cat-btn';
        btn.textContent = cat.nombre;
        btn.style.borderColor = cat.color;
        btn.style.color = cat.color; // Mapeando color de texto y borde
        btn.onclick = () => renderProductos(cat.id, cat.color);
        container.appendChild(btn);
    });
}

function renderProductos(categoriaId, colorCategoria) {
    const container = document.getElementById('productos-container');
    container.innerHTML = '';
    
    const filtrados = datosCatalogo.productos.filter(p => p.categoria_id === categoriaId);
    
    filtrados.forEach(prod => {
        const btn = document.createElement('div');
        btn.className = 'prod-btn';
        btn.textContent = prod.nombre;
        btn.style.borderColor = colorCategoria;
        btn.style.color = colorCategoria;
        btn.onclick = () => agregarAlCarrito(prod);
        container.appendChild(btn);
    });
}

function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    actualizarTotal();
}

function setMetodoPago(metodo) {
    metodoPagoActual = metodo;
    document.getElementById('btn-transferencia').classList.remove('selected');
    document.getElementById('btn-efectivo').classList.remove('selected');
    document.getElementById(`btn-${metodo}`).classList.add('selected');
}

function actualizarTotal() {
    total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    document.getElementById('total-monto').textContent = total;
}

async function procesarVenta() {
    if (carrito.length === 0) return alert('El carrito está vacío');
    if (!metodoPagoActual) return alert('Selecciona un método de pago');

    try {
        const res = await fetch(`${API_URL}}/api/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                turno: turnoActual,
                metodo_pago: metodoPagoActual,
                total: total,
                carrito: carrito
            })
        });

        const data = await res.json();
        
        if (data.success) {
            alert('Venta realizada exitosamente');
            limpiarVenta();
        } else {
            alert('Error en la base de datos: ' + data.error);
        }
    } catch (error) {
        alert('Error de conexión con el servidor');
        console.error(error)
    }
}

function limpiarVenta() {
    carrito = [];
    metodoPagoActual = null;
    actualizarTotal();
    document.getElementById('productos-container').innerHTML = ''; // Limpia lista
    document.getElementById('btn-transferencia').classList.remove('selected');
    document.getElementById('btn-efectivo').classList.remove('selected');
}

// --- LÓGICA VISTA CATÁLOGO ---
async function cargarHistorialVentas() {
    try {
        const res = await fetch(`${API_URL}/api/ventas`);
        const ventas = await res.json();
        const tbody = document.querySelector('#tabla-ventas tbody');
        tbody.innerHTML = '';

        ventas.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.turno}</td>
                <td>$${v.total}</td>
                <td>${new Date(v.fecha_hora).toLocaleString()}</td>
                <td>${v.metodo_pago}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar historial", error);
    }
}

// --- LÓGICA VISTA STOCK ---

// Esta función se debe llamar cuando el usuario navega a la vista stock
async function cargarVistaStock() {
    try {
        // Usamos un endpoint diferente para traer TODO, incluso sin stock
        const res = await fetch(`${API_URL}/api/stock-completo`);
        const data = await res.json();

        categoriasStock = data.categorias; // <--- AGREGA ESTA LÍNEA

        renderizarListaStock(data.categorias, data.productos);
    } catch (error) {
        console.error("Error al cargar stock", error);
    }
}

// Para que se cargue al entrar a la vista, actualiza la función navigate() que ya tenías:
/* 
function navigate(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'view-venta') cargarCatalogo();
    if (viewId === 'view-catalogo') cargarHistorialVentas();
    if (viewId === 'view-stock') cargarVistaStock(); // <--- AGREGA ESTA LÍNEA
}
*/

function renderizarListaStock(categorias, productos) {
    const container = document.getElementById('contenedor-stock-list');
    container.innerHTML = ''; // Limpiar previo

    categorias.forEach(cat => {
        // Título de la categoría
        const tituloCat = document.createElement('h3');
        tituloCat.textContent = cat.nombre;
        tituloCat.style.textAlign = 'center';
        container.appendChild(tituloCat);

        // Filtrar productos de esta categoría
        const prods = productos.filter(p => p.categoria_id === cat.id);
        
        prods.forEach(prod => {
            const fila = document.createElement('div');
            fila.className = 'stock-row';
            fila.innerHTML = `
                <div class="stock-nombre">${prod.nombre}</div>
                <input type="number" class="stock-input" value="${prod.stock}" 
                       onchange="actualizarProducto(${prod.id}, 'stock', this.value)">
                <div class="stock-precio">
                    $ <input type="number" class="stock-input" value="${prod.precio}" 
                             onchange="actualizarProducto(${prod.id}, 'precio', this.value)">
                </div>
            `;
            container.appendChild(fila);
        });
    });
}

// Funciones para crear usando prompts nativos (para ser veloces)
async function crearCategoria() {
    const nombre = prompt("Nombre de la nueva categoría:");
    if (!nombre) return;
    
    // Asignamos un color aleatorio o predefinido para la categoría
    const colores = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFF333'];
    const color = colores[Math.floor(Math.random() * colores.length)];

    await fetch(`${API_URL}/api/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, color })
    });
    cargarVistaStock(); // Recargar la vista
}

async function crearProducto() {
    // 1. Armamos un texto dinámico con las opciones (ej: "1: Gomitas \n 2: Galletitas")
    const listaOpciones = categoriasStock.map(c => `${c.id}: ${c.nombre}`).join('\n');
    
    // 2. Se lo mostramos al usuario en el prompt
    const catId = prompt(`¿A qué categoría pertenece? Ingresa el NÚMERO:\n\n${listaOpciones}`);
    
    if (!catId) return; // Si el usuario cancela, detenemos la función

    const nombre = prompt("Nombre del producto:");
    const precio = prompt("Precio de venta:");
    const stock = prompt("Stock inicial:");

    if (!nombre || !precio) return;

    await fetch(`${API_URL}/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            categoria_id: parseInt(catId), 
            nombre, 
            precio: parseFloat(precio), 
            stock: parseInt(stock) || 0 
        })
    });
    
    cargarVistaStock(); // Recargamos para ver el nuevo producto
}

async function actualizarProducto(id, campo, valor) {
    await fetch(`${API_URL}/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campo, valor })
    });
}