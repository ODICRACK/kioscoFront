let carrito = [];
let turnoActual = 'manana';
let metodoPagoActual = null;
let total = 0;
let datosCatalogo = { categorias: [], productos: [] };

const API_URL = "https://kiosco-backend.onrender.com";

// --- NAVEGACIÓN ---
function navigate(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'view-venta') cargarCatalogo();
    if (viewId === 'view-catalogo') cargarHistorialVentas();
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
        const res = await fetch(`${API_URL}}/api/ventas`);
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