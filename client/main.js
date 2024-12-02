let token = localStorage.getItem('token');
let gastoForm;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    const gastosSection = document.getElementById('gastosSection');
    const gastoForm = document.getElementById('gastoForm');
    
    if (loginForm) {
        mostrarLogin();
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registroForm) {
        mostrarRegistro();
        registroForm.addEventListener('submit', handleRegistro);
    }
    
    if (gastosSection) {
        mostrarGastos();
    }

    if (gastoForm) {
        gastoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            
            const esRecurrente = document.getElementById('esRecurrente').checked;
            const formData = {
                concepto: document.getElementById('concepto').value,
                cantidad: parseFloat(document.getElementById('cantidad').value),
                categoria: document.getElementById('categoria').value,
                esRecurrente: esRecurrente,
                fecha: document.getElementById('fecha').value,
                año: esRecurrente && !form.dataset.modo ? document.getElementById('año').value : null
            };

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
    }

    if (token) {
        const authForms = document.getElementById('authForms');
        const mainContent = document.getElementById('mainContent');
        
        if (authForms && mainContent) {
            authForms.style.display = 'none';
            mainContent.style.display = 'block';
            mostrarVistaDetallada();
        }
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
            
            const authForms = document.getElementById('authForms');
            const mainContent = document.getElementById('mainContent');
            
            if (authForms) {
                authForms.style.display = 'none';
            }
            
            if (mainContent) {
                mainContent.style.display = 'block';
                mostrarVistaDetallada();
            } else {
                window.location.href = '/gastos';
            }
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Error de autenticación');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al intentar iniciar sesión');
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
            mostrarGastosDetallados(gastos);
        } else {
            alert('Error al cargar los gastos');
        }
    } catch (error) {
        console.error('Error al cargar gastos:', error);
    }
}

function mostrarLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.style.display = 'block';
    }
}

function mostrarRegistro() {
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.style.display = 'block';
    }
}

function mostrarGastos() {
    const gastosSection = document.getElementById('gastosSection');
    if (gastosSection) {
        gastosSection.style.display = 'block';
    }
}

function mostrarGastosDetallados(gastos) {
    const gastosRecurrentes = document.getElementById('gastosRecurrentes');
    const gastosNoRecurrentes = document.getElementById('gastosNoRecurrentes');
    
    gastosRecurrentes.innerHTML = '';
    gastosNoRecurrentes.innerHTML = '';

    // Agrupar gastos recurrentes por concepto y año
    const gastosRecurrentesAgrupados = {};
    gastos.filter(g => g.es_recurrente).forEach(gasto => {
        const año = new Date(gasto.fecha).getFullYear();
        const key = `${gasto.concepto}-${año}`;
        if (!gastosRecurrentesAgrupados[key]) {
            gastosRecurrentesAgrupados[key] = [];
        }
        gastosRecurrentesAgrupados[key].push(gasto);
    });

    // Mostrar gastos recurrentes agrupados
    Object.entries(gastosRecurrentesAgrupados).forEach(([key, grupo]) => {
        const primerGasto = grupo[0];
        const gastoHTML = `
            <div class="gasto-recurrente-grupo">
                <div class="gasto-recurrente-header" onclick="toggleGastoRecurrente('${key}')">
                    <div class="gasto-info-principal">
                        <h4>${primerGasto.concepto}</h4>
                        <p>${parseFloat(primerGasto.cantidad).toFixed(2)}€/mes</p>
                        <p>${primerGasto.categoria}</p>
                        <p>${new Date(primerGasto.fecha).getFullYear()}</p>
                    </div>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="gasto-recurrente-detalles" id="detalles-${key}" style="display: none;">
                    ${grupo.map(gasto => `
                        <div class="gasto-mensual">
                            <div class="gasto-mensual-info">
                                <span>${new Date(gasto.fecha).toLocaleDateString('es-ES', { month: 'long' })}</span>
                                <span>${parseFloat(gasto.cantidad).toFixed(2)}€</span>
                            </div>
                            <div class="gasto-actions">
                                <button onclick="editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                                <button onclick="borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        gastosRecurrentes.innerHTML += gastoHTML;
    });

    // Mostrar gastos no recurrentes
    gastos.filter(g => !g.es_recurrente).forEach(gasto => {
        const gastoHTML = `
            <div class="gasto-item">
                <p><strong>Concepto:</strong> ${gasto.concepto}</p>
                <p><strong>Cantidad:</strong> ${parseFloat(gasto.cantidad).toFixed(2)}€</p>
                <p><strong>Categoría:</strong> ${gasto.categoria}</p>
                <p><strong>Fecha:</strong> ${new Date(gasto.fecha).toLocaleDateString()}</p>
                <div class="gasto-actions">
                    <button onclick="editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                    <button onclick="borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                </div>
            </div>
        `;
        gastosNoRecurrentes.innerHTML += gastoHTML;
    });
}

// Función para mostrar/ocultar detalles de gasto recurrente
function toggleGastoRecurrente(key) {
    const detalles = document.getElementById(`detalles-${key}`);
    const header = detalles.previousElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (detalles.style.display === 'none') {
        detalles.style.display = 'block';
        icon.textContent = '▲';
    } else {
        detalles.style.display = 'none';
        icon.textContent = '▼';
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

function editarGasto(id) {
    const form = document.getElementById('gastoForm');
    form.dataset.modo = 'editar';
    form.dataset.gastoId = id;

    fetch(`/api/gastos/${id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(gasto => {
        document.getElementById('concepto').value = gasto.concepto;
        document.getElementById('cantidad').value = gasto.cantidad;
        document.getElementById('categoria').value = gasto.categoria;
        
        const fechaInput = document.getElementById('fecha');
        const esRecurrenteInput = document.getElementById('esRecurrente');
        const añoContainer = document.getElementById('añoContainer');
        const fechaContainer = document.getElementById('fechaContainer');
        
        // Siempre mostramos la fecha al editar
        fechaContainer.style.display = 'block';
        añoContainer.style.display = 'none';
        fechaInput.value = new Date(gasto.fecha).toISOString().split('T')[0];
        fechaInput.required = true;
        
        // Si es recurrente, deshabilitamos el checkbox
        if (gasto.es_recurrente) {
            esRecurrenteInput.checked = true;
            esRecurrenteInput.disabled = true;
        } else {
            esRecurrenteInput.checked = false;
            esRecurrenteInput.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar el gasto');
    });
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

function toggleFechaInput() {
    const esRecurrente = document.getElementById('esRecurrente').checked;
    const fechaContainer = document.getElementById('fechaContainer');
    const añoContainer = document.getElementById('añoContainer');
    const fechaInput = document.getElementById('fecha');
    const añoInput = document.getElementById('año');

    if (esRecurrente) {
        fechaContainer.style.display = 'none';
        añoContainer.style.display = 'block';
        fechaInput.required = false;
        añoInput.required = true;
        
        // Llenar el selector de años
        const añoActual = new Date().getFullYear();
        añoInput.innerHTML = '';
        for (let i = añoActual - 2; i <= añoActual + 2; i++) {
            añoInput.innerHTML += `<option value="${i}" ${i === añoActual ? 'selected' : ''}>${i}</option>`;
        }
    } else {
        fechaContainer.style.display = 'block';
        añoContainer.style.display = 'none';
        fechaInput.required = true;
        añoInput.required = false;
    }
}

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

async function cargarGastosAgrupados() {
    try {
        const response = await fetch('/api/gastos/agrupados', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const gastosAgrupados = await response.json();
            window.todosLosGastos = gastosAgrupados;
            actualizarFiltroAños(gastosAgrupados);
            mostrarGastosAgrupados(gastosAgrupados);
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            mostrarLogin();
        }
    } catch (error) {
        console.error('Error al cargar gastos agrupados:', error);
    }
}

function mostrarGastosAgrupados(gastos) {
    const container = document.getElementById('resumenGastosAgrupados');
    const añoFiltro = document.getElementById('filtroAño').value;
    const mesFiltro = document.getElementById('filtroMes').value;

    // Filtrar gastos según los filtros seleccionados
    let gastosFiltrados = gastos;
    if (añoFiltro) {
        gastosFiltrados = gastosFiltrados.filter(g => g.año == añoFiltro);
    }
    if (mesFiltro) {
        gastosFiltrados = gastosFiltrados.filter(g => g.mes == mesFiltro);
    }

    // Agrupar por año y mes
    const gastosAgrupados = {};
    gastosFiltrados.forEach(gasto => {
        const año = gasto.año;
        const mes = gasto.mes;
        const key = `${año}-${mes}`;
        
        if (!gastosAgrupados[key]) {
            gastosAgrupados[key] = {
                año,
                mes,
                semanas: {},
                totalMes: 0,
                tiene_recurrentes: false
            };
        }
        
        const semana = gasto.semana;
        if (!gastosAgrupados[key].semanas[semana]) {
            gastosAgrupados[key].semanas[semana] = 0;
        }
        
        gastosAgrupados[key].semanas[semana] += parseFloat(gasto.total);
        gastosAgrupados[key].totalMes += parseFloat(gasto.total);
        gastosAgrupados[key].tiene_recurrentes = gastosAgrupados[key].tiene_recurrentes || gasto.tiene_recurrentes;
    });

    // Generar HTML
    let html = '';
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    Object.values(gastosAgrupados).forEach(periodo => {
        html += `
            <div class="periodo-gasto">
                <h3>${meses[periodo.mes - 1]} ${periodo.año}</h3>
                <p class="total-mes">Total del mes: ${periodo.totalMes.toFixed(2)}€</p>
                ${periodo.tiene_recurrentes ? '<p class="recurrente-badge">Incluye gastos recurrentes</p>' : ''}
                <div class="semanas-container">
                    ${Object.entries(periodo.semanas).map(([semana, total]) => `
                        <div class="semana-gasto">
                            <span>Semana ${semana}</span>
                            <span>${total.toFixed(2)}€</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html || '<p>No hay gastos para el período seleccionado</p>';
}

function actualizarFiltroAños(gastos) {
    const años = [...new Set(gastos.map(g => g.año))].sort((a, b) => b - a);
    const selectAño = document.getElementById('filtroAño');
    const añoActual = selectAño.value || '';
    
    selectAño.innerHTML = '<option value="">Todos los años</option>';
    años.forEach(año => {
        const selected = año.toString() === añoActual ? 'selected' : '';
        selectAño.innerHTML += `<option value="${año}" ${selected}>${año}</option>`;
    });
}

function filtrarGastosAgrupados() {
    const añoFiltro = document.getElementById('filtroAño').value;
    const mesFiltro = document.getElementById('filtroMes').value;
    
    let gastosFiltrados = window.todosLosGastos;

    if (añoFiltro) {
        gastosFiltrados = gastosFiltrados.filter(g => g.año.toString() === añoFiltro);
    }
    if (mesFiltro) {
        gastosFiltrados = gastosFiltrados.filter(g => g.mes.toString() === mesFiltro);
    }

    mostrarGastosAgrupados(gastosFiltrados);
}

function mostrarVistaDetallada() {
    const vistaDetallada = document.getElementById('vistaDetallada');
    if (vistaDetallada) {
        vistaDetallada.style.display = 'block';
        cargarGastos();
    }
}

function mostrarVistaAgrupada() {
    document.getElementById('vistaDetallada').style.display = 'none';
    document.getElementById('vistaAgrupada').style.display = 'block';
    cargarGastosAgrupados();
}

async function handleLogin(event) {
    event.preventDefault();
    await login();
}

async function handleRegistro(event) {
    event.preventDefault();
    await registrar();
}