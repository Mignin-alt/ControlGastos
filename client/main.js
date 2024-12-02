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

    actualizarNavbar(!!token);

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
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
            
            actualizarNavbar(true);
            
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
    try {
        const response = await fetch('/api/gastos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los gastos');
        }

        const gastos = await response.json();
        console.log('Gastos cargados:', gastos);

        // Separar y mostrar los gastos
        const gastosRecurrentes = gastos.filter(g => g.es_recurrente);
        const gastosNoRecurrentes = gastos.filter(g => !g.es_recurrente);

        mostrarGastosRecurrentes(gastosRecurrentes);
        mostrarGastosNoRecurrentes(gastosNoRecurrentes);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los gastos');
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
            // Asegurarnos de que el campo año no sea required cuando editamos
            const añoInput = document.getElementById('año');
            if (añoInput) {
                añoInput.required = false;
            }
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
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === añoActual) option.selected = true;
            añoInput.appendChild(option);
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

    // Agrupar por año, mes y tipo de gasto
    const gastosAgrupados = {};
    gastosFiltrados.forEach(gasto => {
        const año = gasto.año;
        const mes = gasto.mes;
        const key = `${año}-${mes}`;
        
        if (!gastosAgrupados[key]) {
            gastosAgrupados[key] = {
                año,
                mes,
                totalRecurrentes: 0,
                totalNoRecurrentes: 0
            };
        }

        if (gasto.tiene_recurrentes) {
            gastosAgrupados[key].totalRecurrentes += parseFloat(gasto.total);
        } else {
            gastosAgrupados[key].totalNoRecurrentes += parseFloat(gasto.total);
        }
    });

    // Generar HTML
    let html = '';
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    Object.values(gastosAgrupados).forEach(periodo => {
        html += `
            <div class="periodo-gasto">
                <h3>${meses[periodo.mes - 1]} ${periodo.año}</h3>
                <p class="total-mes">Total Recurrentes: ${periodo.totalRecurrentes.toFixed(2)}€</p>
                <p class="total-mes">Total No Recurrentes: ${periodo.totalNoRecurrentes.toFixed(2)}€</p>
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

function actualizarNavbar(estaAutenticado) {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');

    if (estaAutenticado) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    actualizarNavbar(false);
    window.location.href = '/inicio';
}

function calcularCantidadMasComun(gastos) {
    // Convertir todas las cantidades a números y agruparlas
    const cantidades = {};
    gastos.forEach(gasto => {
        const cantidad = parseFloat(gasto.cantidad) || 0;
        cantidades[cantidad] = (cantidades[cantidad] || 0) + 1;
    });

    // Encontrar la cantidad que más se repite
    let cantidadMasComun = 0;
    let maxRepeticiones = 0;

    Object.entries(cantidades).forEach(([cantidad, repeticiones]) => {
        if (repeticiones > maxRepeticiones) {
            maxRepeticiones = repeticiones;
            cantidadMasComun = parseFloat(cantidad);
        }
    });

    return cantidadMasComun.toFixed(2);
}

function mostrarGasto(gasto, container) {
    let html = '';
    const fecha = new Date(gasto.fecha).toLocaleDateString();
    
    if (gasto.es_recurrente) {
        const cantidadMasComun = calcularCantidadMasComun(gasto.hijos || []);
        html = `
            <div class="gasto-item recurrente">
                <div class="gasto-header" onclick="toggleGastoRecurrente('${gasto.id}')">
                    <div class="gasto-info">
                        <h3>${gasto.concepto}</h3>
                        <p id="cantidad-${gasto.id}">${cantidadMasComun} - ${gasto.categoria}</p>
                        <p>Fecha: ${fecha}</p>
                    </div>
                    <div class="gasto-actions">
                        <button onclick="event.stopPropagation(); editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                        <button onclick="event.stopPropagation(); borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                        <button onclick="event.stopPropagation(); borrarGrupoRecurrente('${gasto.concepto}', '${gasto.fecha}')" class="btn-borrar-grupo">
                            Borrar Grupo Completo
                        </button>
                        <span class="toggle-icon">▼</span>
                    </div>
                </div>
                <div id="detalles-${gasto.id}" style="display: none;" class="gasto-detalles">
                    <!-- Aquí irán los detalles del gasto recurrente -->
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="gasto-item">
                <div class="gasto-header">
                    <div class="gasto-info">
                        <h3>${gasto.concepto}</h3>
                        <p>${gasto.cantidad}€ - ${gasto.categoria}</p>
                        <p>Fecha: ${fecha}</p>
                    </div>
                    <div class="gasto-actions">
                        <button onclick="editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                        <button onclick="borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.insertAdjacentHTML('beforeend', html);
}

async function borrarGrupoRecurrente(concepto, fecha) {
    if (!confirm(`¿Estás seguro de que deseas borrar todos los gastos recurrentes de "${concepto}"?`)) {
        return;
    }

    try {
        const response = await fetch('/api/gastos/recurrente', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ concepto, fecha })
        });

        if (!response.ok) {
            throw new Error('Error al borrar el grupo de gastos');
        }

        // Recargar los gastos después de borrar
        await cargarGastos();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al borrar el grupo de gastos recurrentes');
    }
}

function mostrarGastosRecurrentes(gastos) {
    const container = document.getElementById('gastosRecurrentes');
    container.innerHTML = '';
    
    console.log('Mostrando gastos recurrentes:', gastos); // Para debug
    
    // Agrupar gastos recurrentes por concepto y año
    const gastosAgrupados = {};
    gastos.filter(g => g.es_recurrente).forEach(gasto => {
        const fecha = new Date(gasto.fecha);
        const año = fecha.getFullYear();
        const key = `${gasto.concepto}-${año}`;
        
        if (!gastosAgrupados[key]) {
            gastosAgrupados[key] = {
                concepto: gasto.concepto,
                categoria: gasto.categoria,
                año: año,
                fecha: gasto.fecha,
                gastos: []
            };
        }
        gastosAgrupados[key].gastos.push(gasto);
    });

    Object.entries(gastosAgrupados).forEach(([key, grupo]) => {
        const cantidadMasComun = calcularCantidadMasComun(grupo.gastos);
        const html = `
            <div class="gasto-recurrente-grupo">
                <div class="gasto-recurrente-header" onclick="toggleGastoRecurrente('${key}')">
                    <div class="gasto-info-principal">
                        <h4>${grupo.concepto}</h4>
                        <p>${cantidadMasComun}€/mes</p>
                        <p>${grupo.categoria}</p>
                        <p>${grupo.año}</p>
                    </div>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="gasto-recurrente-detalles" id="detalles-${key}" style="display: none;">
                    ${grupo.gastos.map(gasto => {
                        const cantidad = parseFloat(gasto.cantidad) || 0; // Asegurarse de que sea un número
                        return `
                            <div class="gasto-mensual">
                                <div class="gasto-mensual-info">
                                    <span>${new Date(gasto.fecha).toLocaleString('es', { month: 'long' })}</span>
                                    <span>${cantidad.toFixed(2)}€</span>
                                </div>
                                <div class="gasto-actions">
                                    <button onclick="editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                                    <button onclick="borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function mostrarGastosNoRecurrentes(gastos) {
    const container = document.getElementById('gastosNoRecurrentes');
    container.innerHTML = '';

    gastos.forEach(gasto => {
        const cantidad = parseFloat(gasto.cantidad) || 0;
        const html = `
            <div class="gasto-item">
                <p><strong>Concepto:</strong> ${gasto.concepto}</p>
                <p><strong>Cantidad:</strong> ${cantidad.toFixed(2)}€</p>
                <p><strong>Categoría:</strong> ${gasto.categoria}</p>
                <p><strong>Fecha:</strong> ${new Date(gasto.fecha).toLocaleDateString()}</p>
                <div class="gasto-actions">
                    <button onclick="editarGasto('${gasto.id}')" class="btn-editar">Editar</button>
                    <button onclick="borrarGasto('${gasto.id}')" class="btn-borrar">Borrar</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}