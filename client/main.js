let token = localStorage.getItem('token');
let gastoForm;

document.addEventListener('DOMContentLoaded', () => {
    gastoForm = document.getElementById('gastoForm');
    
    if (token) {
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        cargarGastos();
    } else {
        mostrarLogin();
    }
});

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            cargarGastos();
        } else {
            alert('Error de autenticación');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarGastos() {
    token = localStorage.getItem('token');
    
    if (!token) {
        mostrarLogin();
        return;
    }

    try {
        const response = await fetch('/api/gastos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const gastos = await response.json();
            mostrarGastos(gastos);
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            mostrarLogin();
        }
    } catch (error) {
        console.error('Error al cargar gastos:', error);
    }
}

function mostrarLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
}

function mostrarGastos(gastos) {
    const resumenGastos = document.getElementById('resumenGastos');
    resumenGastos.innerHTML = '<h2>Historial de Gastos</h2>';
    
    if (Array.isArray(gastos) && gastos.length > 0) {
        gastos.forEach(gasto => {
            const fecha = new Date(gasto.fecha).toLocaleDateString();
            const cantidad = parseFloat(gasto.cantidad);
            resumenGastos.innerHTML += `
                <div class="gasto-item">
                    <p><strong>Concepto:</strong> ${gasto.concepto}</p>
                    <p><strong>Cantidad:</strong> ${cantidad.toFixed(2)}€</p>
                    <p><strong>Categoría:</strong> ${gasto.categoria}</p>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    ${gasto.es_recurrente ? '<p><em>Gasto Recurrente</em></p>' : ''}
                    <div class="gasto-actions">
                        <button onclick="editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                        <button onclick="borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                    </div>
                    <hr>
                </div>
            `;
        });
    } else {
        resumenGastos.innerHTML += '<p>No hay gastos registrados</p>';
    }
}

async function registrar() {
    const nombre = document.getElementById('registerNombre').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password })
        });

        if (response.ok) {
            alert('Registro exitoso. Por favor, inicia sesión.');
            mostrarLogin();
        } else {
            const error = await response.json();
            alert(error.message || 'Error en el registro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error en el registro');
    }
}

function mostrarRegistro() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function mostrarLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

async function editarGasto(id) {
    const gasto = await obtenerGastoPorId(id);
    if (!gasto) return;

    document.getElementById('concepto').value = gasto.concepto;
    document.getElementById('cantidad').value = gasto.cantidad;
    document.getElementById('categoria').value = gasto.categoria;
    document.getElementById('fecha').value = gasto.fecha.split('T')[0];
    document.getElementById('esRecurrente').checked = gasto.es_recurrente;

    const form = document.getElementById('gastoForm');
    form.dataset.modo = 'editar';
    form.dataset.gastoId = id;
}

async function borrarGasto(id) {
    if (!confirm('¿Estás seguro de que quieres borrar este gasto?')) return;

    try {
        const response = await fetch(`/api/gastos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            cargarGastos();
        } else {
            alert('Error al borrar el gasto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al borrar el gasto');
    }
}

document.getElementById('gastoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        concepto: document.getElementById('concepto').value,
        cantidad: parseFloat(document.getElementById('cantidad').value),
        categoria: document.getElementById('categoria').value,
        fecha: document.getElementById('fecha').value,
        esRecurrente: document.getElementById('esRecurrente').checked
    };

    const form = e.target;
    const modo = form.dataset.modo;
    const gastoId = form.dataset.gastoId;

    try {
        const url = modo === 'editar' ? `/api/gastos/${gastoId}` : '/api/gastos';
        const method = modo === 'editar' ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            form.reset();
            form.dataset.modo = 'crear';
            delete form.dataset.gastoId;
            cargarGastos();
        } else {
            alert('Error al guardar el gasto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el gasto');
    }
});

async function obtenerGastoPorId(id) {
    try {
        const response = await fetch(`/api/gastos/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
} 