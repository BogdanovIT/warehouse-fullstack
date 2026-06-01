const API = '/api'
let token = ''
let currentDepartment = ''

function showLogin() {
    document.getElementById('main-content').innerHTML = `
    <div class="login-box">
        <h2>Вход в админку</h2>
        <div class="error" id="login-error"></div>
        <input type="email" id="login-email" placeholder="Email" value="">
        <input type="password" id="login-password" placeholder="Пароль" value="">
        <button onclick="login()">Войти</button>
    </div>
    `
}
async function loadDepartments() {
    const departments = [
        "ФРЦ БРИЗ Шереметьево",
        "МОС БРИЗ Медведково",
        "МОС БРИЗ Саларьево",
        "МОС БРИЗ Рязанское",
        "ДРЦ БРИЗ Софьино",
        "РРЦ Бриз Екатеринбург LV",
        "РРЦ Бриз Ростов LV",
        "РРЦ Бриз Новосибирск LV",
        "РРЦ Бриз Самара LV",
        "РРЦ Бриз Краснодар LV"
    ]
    return departments
}
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!data.accessToken) {
            document.getElementById('login-error').textContent = data.message || 'Ошибка входа';
            return;
        }
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        token = data.accessToken;
        sessionStorage.setItem('token', token);

        const isSuperuser = data.user.roles.some(r => r.code === 'superuser');
        const userPlace = data.user.place ;
        const deptSelect = document.getElementById('department-select');
        sessionStorage.setItem('isSuperuser', isSuperuser ? 'true' : 'false');
        sessionStorage.setItem('currentDepartment', userPlace);
        if (isSuperuser) {
            const departments = await loadDepartments();
            deptSelect.innerHTML = departments.map(d => 
                `<option value="${d}" ${d === userPlace ? 'selected' : ''}>${d}</option>`
            ).join('');
            deptSelect.disabled = false
        } else {
            deptSelect.innerHTML = `<option value="${userPlace}">${userPlace}</option>`;
            deptSelect.disabled = true; 
        }
        currentDepartment = userPlace;

        loadPage('employees');
        
    } catch (e) {
        document.getElementById('login-error').textContent = 'Сервер недоступен';
    }
}
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault()
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'))
        item.classList.add('active')
        loadPage(item.dataset.page)
    })
})
async function loadPage(page) {
    if (!token) {
        token = sessionStorage.getItem('token')
        if (!token) return showLogin
    }
    switch(page) {
        case 'employees': return loadEmployees()
        case 'users': return loadUsers()
        case 'attendance': return loadAttendance()
        case 'chozrabota': return showPlaceholder('Хозработы', "Модуль в разработке")
    }
}
async function loadEmployees() {
    try {
        const dept = document.getElementById('department-select')?.value || currentDepartment
        const url = dept 
            ? `${API}/employees?department=${encodeURIComponent(dept)}`
            : `${API}/employees`
            console.log('Запрос', url)
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}`},
        })
        const employees = await res.json()
        if (!res.ok) throw new Error(employees.message)
        
        document.getElementById('main-content').innerHTML = `
        <h2>Сотрудники (${dept || 'Все подразделения'}) </h2>
        <button class="btn-add" onclick="showEmployeeForm()">+ Добавить сотрудника</button>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Должность</th>
                        <th>Логин</th>
                        <th>Тип</th>
                        <th>Активен</th>
                    </tr>
                </thead>
                <tbody>
                    ${employees.map(e => `
                        <tr>
                            <td>${e.id}</td>
                            <td>${e.fullName}</td>
                            <td>${e.position || '-'}</td>
                            <td>${e.loginLv || '-'}</td>
                            <td>${e.isHourly ? 'Сделка' : 'Оклад'}</td>
                            <td>${e.isActive ? '✅' : '❌'}</td>
                            <td class="actions">
                                <button class="btn-edit" onclick="showEmployeeForm(${JSON.stringify(e).replace(/"/g, '&quot;')})">✎</button>
                                ${e.isActive ? `<button class="btn-delete" onclick="deactivateEmployee(${e.id})"></button>` : '✕'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `
    } catch (error) {
        if (error.message === 'Token expired' || error.message === 'Invalid token') {
            token = null
            sessionStorage.removeItem('token')
            showLogin()
        } else {
            document.getElementById('main-content').innerHTML = `<p style="color:red">${error.message}</p>`
        }
    }
}
function showEmployeeForm(employee = null) {
    const title = employee ? 'Редактировать запись' : 'Добавить запись'
    const btnText = employee ? 'Сохранить' : 'Добавить'

    document.getElementById('main-content').innerHTML = `
        <h2>${title}</h2>
        <div class="table-wrapper">
            <form onsubmit="saveEmployee(event, ${employee ? employee.id : null})">
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" id="emp-fullName" value="${employee ? employee.fullName : ''}" required>
                </div>
                <div class="form-group">
                    <label>Краткое имя</label>
                    <input type="text" id="emp-shortName" value="${employee ? employee.shortName || '' : ''}">
                </div>
                <div class="form-group">
                    <label>Логин</label>
                    <input type="text" id="emp-loginLv" value="${employee ? employee.loginLv || '' : ''}">
                </div>
                <div class="form-group">
                    <label>Должность</label>
                    <input type="text" id="emp-position" value="${employee ? employee.position || '' : ''}">
                </div>
                <div class="form-group">
                    <label>Тип</label>
                    <select id="emp-isHourly">
                        <option value="true" ${employee && employee.isHourly ? 'selected' : ''}>Сделка</option>
                        <option value="false" ${employee && !employee.isHourly ? 'selected' : ''}>Оклад</option>
                    </select>
                </div>
                <div>
                    <button type="button" class="btn-cancel" onclick="loadPage('employees')">Отмена</button>                    
                    <button type="submit" class="btn-save">${btnText}</button>                    
                </div>
            </form>
        </div>
    `;
}
async function showRoleEditor(user) {
    const allRoles = await fetch(`${API}/users/roles`, {
        headers: { 'Authorization': `Bearer ${token}` },
    }).then(r => r.json())
    const userRoleIds = user.roles.map(r => r.id)
    document.getElementById('main-content').innerHTML = `
    <h2>Роли пользователя: ${user.email}</h2>
    <div class="table-wrapper">
        <form onsubmit="saveRoles(event, ${user.id})">
            ${allRoles.map(role => `
                <div class="form-group">
                    <label>
                        <input type="checkbox" value="${role.id}"
                            ${userRoleIds.includes(role.id) ? 'checked' : ''}>
                        ${role.name} (${role.code})
                    </label>
                </div>
                `).join('')}
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="loadPage('users')">Отмена</button>
                    <button type="submit" class="btn-save">Сохранить</button>
                </div>
        </form>
    </div>
    `
}
async function saveRoles(event, userId) {
    event.preventDefault()
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
    const roleIds = Array.from(checkboxes).map(cb => parseInt(cb.value))

    try {
        const res = await fetch(`${API}/users/${userId}/roles`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roleIds })
        })
        if (!res.ok) throw new Error('Ошибка')
        loadPage('users')
    } catch (error) {
        alert(error.message)
    }
}
async function toggleBlock(userId, isBlocked) {
    const action = isBlocked ? 'разблокировать' : 'заблокировать'
    if (!confirm(`Точно ${action} пользователя?`)) return
    try {
        const res = await fetch(`${API}/users/${userId}/block`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_blocked: !isBlocked })
        })
        if (!res.ok) throw new Error('Ошибка')
        loadPage('users')
    } catch (error) {
        alert(error.message)
    }
}
async function saveEmployee(event, id) {
    event.preventDefault()
    const dept = document.getElementById('department-select')?.value || currentDepartment
    const data = {
        fullName: document.getElementById('emp-fullName').value.trim(),
        shortName: document.getElementById('emp-shortName').value.trim() || null,
        loginLv: document.getElementById('emp-loginLv').value.trim() || null,
        position: document.getElementById('emp-position').value.trim() || null,
        isHourly: document.getElementById('emp-isHourly').value === 'true',
        department: dept
    }
    if (!data.fullName) {
        alert('ФИО обязательно')
        return
    }
    try {
        const url = id
            ? `${API}/employees/${id}`
            : `${API}/employees`
        const method = id ? 'PUT' : 'POST'
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data)
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.message)
        loadPage('employees')
    } catch (error) {
        alert(error.message)
    }
}
async function deactivateEmployee(id) {
    if (!confirm('Деактивировать сотрудника?')) return
    try {
        const res = await fetch(`${API}/employees/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive: false })
        })
        if (!res.ok) throw new Error('Ошибка')
            loadPage('employees')
    } catch (error) {
        alert(error.message)
    }
}
async function loadUsers() {
    try {
        const dept = document.getElementById('department-select')?.value || currentDepartment
        const url = dept 
            ? `${API}/users?department=${encodeURIComponent(dept)}`
            : `${API}/users`
        
        const res = await fetch(url, {
            headers: {'Authorization': `Bearer ${token}`},
        })
        const users = await res.json()
        if (!res.ok) throw new Error(users.message)
            document.getElementById('main-content').innerHTML = `
        <h2>Пользователи</h2>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Имя</th>
                        <th>Логин</th>
                        <th>Подразделение</th>
                        <th>Роли</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.id}</td>
                            <td>${u.email}</td>
                            <td>${u.firstName || ''} ${u.lastName || ''}</td>
                            <td>${u.login || '-'}</td>
                            <td>${u.place || '-'}</td>
                            <td>${u.roles.map(r => r.name).join(', ')}</td>
                            <td>${u.is_blocked ? '❌ Заблокирован' : '✅ Активен' }</td>
                            <td class="action">
                                <button class="btn-edit" onclick='showRoleEditor(${JSON.stringify(u).replace(/'/g, "&#39;")})'>👤</button>
                                <button class="btn-delete" onclick="toggleBlock(${u.id}, ${u.is_blocked ? 'true' : 'false'})">
                                    ${u.is_blocked ? '🔓' : '🚫'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `
    } catch (error) {
        if (error.message === 'Token expired' || error.message === 'Invalid token') {
            token = null
            sessionStorage.removeItem('token')
            showLogin()
        } else {
            document.getElementById('main-content').innerHTML = `<p style="color:red">${error.message}</p>`
        }    
    }
}
function onDepartmentChange() {
    currentDepartment = document.getElementById('department-select').value
    const activePage = document.querySelector('.nav-item.active')?.dataset?.page || 'employees'
    loadPage(activePage)
}
function showPlaceholder(title, text) {
    document.getElementById('main-content').innerHTML= `
        <h2>${title}</h2>
        <div class="table-wrapper"><p>${text}</p></div>
    `
}
if (sessionStorage.getItem('token')) {
    token = sessionStorage.getItem('token')
    fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: '' })
    }).catch(() => {})
    const savedDept = sessionStorage.getItem('currentDepartment')
    const isSuperuser = sessionStorage.getItem('isSuperuser') === 'true'
    if (isSuperuser) {
        loadDepartments().then(departments => {
            const deptSelect = document.getElementById('department-select')
            deptSelect.innerHTML = departments.map(d =>
                `<option value="${d}" ${d === savedDept ? 'selected' : ''}>${d}</option>`
            ).join('')
            deptSelect.disabled = false
        })
    }
    currentDepartment = savedDept || ''
    loadPage('employees')
} else {
    showLogin()
}
function logout() {
    token = null
    currentDepartment = ''
    sessionStorage.removeItem('token')
    document.getElementById('department-select').innerHTML = ''
    showLogin()
}
async function loadAttendance() {
    const dept = document.getElementById('department-select')?.value || currentDepartment
    const date = document.getElementById('att-date')?.value || new Date().toISOString().split('T')[0]
    
    const url = dept 
        ? `${API}/attendance/${date}?department=${encodeURIComponent(dept)}` 
        : `${API}/attendance/${date}`;
    try {
        const res = await fetch(url, {
            headers: {'Authorization': `Bearer ${token}`}
        })
        const records = await res.json()
        const isSaved = records.length > 0 && records.some(r => r.id !== undefined)
        const savedBadge = isSaved 
            ? '<span class="badge badge-saved">✓ Сохранен</span>'
            : '<span class="badge badge-unsaved">Не сохранен</span>'
        if (!res.ok) throw new Error(records.message)
        const filtered = dept 
            ? records.filter(r => r.department === dept || !r.department)
            : records
        document.getElementById('main-content').innerHTML = `
            <h2>Табель ${savedBadge}</h2>
            <div class="att-date-row">
                <button class="btn-date" onclick="changeDate(-1)">◀</button>
                <input type="date" id="att-date" value="${date}" onchange="loadAttendance()" class="date-input">
                <button class="btn-date" onclick="changeDate(1)">▶</button>
            </div>
            <div class="table-wrapper" style="margin-top: 20px;">
                <table>
                    <thead>
                        <tr>
                            <th>Сотрудник</th>
                            <th>Должность</th>
                            <th>Статус</th>
                            <th>Часы (оклад)</th>
                            <th>Переработка</th>
                            <th>Командировка</th>
                            <th>Примечание</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(r => `
                            <tr>
                                <td>${r.fullName}</td>
                                <td>${r.position || ''}</td>
                                <td>
                                    <select class="att-status" onchange="onStatusChange(${r.employeeId}, this.value)">
                                        <option value="present" ${r.status === 'present' ? 'selected' : ''}>Явка</option>
                                        <option value="absent" ${r.status === 'absent' ? 'selected' : ''}>Отсутствие</option>
                                        <option value="sick" ${r.status === 'sick' ? 'selected' : ''}>Заболевание</option>
                                        <option value="vacation" ${r.status === 'vacation' ? 'selected' : ''}>Отпуск</option>
                                        <option value="business_trip" ${r.status === 'business_trip' ? 'selected' : ''}>Командировка</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="number" step="0.5" value="${r.standartHours || 8}"
                                        id="hours-${r.employeeId}" class="att-input"
                                        ${!['present', 'business_trip'].includes(r.status) ? 'disabled' : ''}
                                </td>
                                <td>
                                    <input type="number" step="0.5" value="${r.overtimeHours || 0}"
                                        id="overtime-${r.employeeId}" class="att-input"
                                        ${!['present', 'business_trip'].includes(r.status) ? 'disabled' : ''}
                                </td>
                                <td>
                                    <input type="number" step="0.5" value="${r.businessTripHours || 0}"
                                        id="trip-${r.employeeId}" class="att-input"
                                        ${!['present', 'business_trip'].includes(r.status) ? 'disabled' : ''}
                                </td>
                                <td>
                                    <input type="text" value="${r.comment || ''}"
                                        id="comment-${r.employeeId}" class="att-input">
                                </td>
                            </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
            <button class="btn-save" style="margin-top: 20px;" onclick="saveAttendance()">Сохранить табель</button>
        `;
        window._attendanceRecords = filtered
    } catch (error) {
        if (error.message === 'Token expired' || error.message === 'Invalid token') {
            token = null
            sessionStorage.removeItem('token')
            showLogin
        } else {
            document.getElementById('main-content').innerHTML = `<p style="color: red">${error.message}</p>`
        }
    }
}
function changeDate(delta) {
    const input = document.getElementById('att-date')
    const date = new Date(input.value)
    date.setDate(date.getDate() + delta)
    input.value = date.toISOString().split('T')[0]
    loadAttendance
}
function onStatusChange(employeeId, status) {
    const hours = document.getElementById(`hours-${employeeId}`)
    const overtime = document.getElementById(`overtime-${employeeId}`)
    const trip = document.getElementById(`trip-${employeeId}`)
    if (['present', 'business_trip'].includes(status)) {
        hours.disabled = false
        overtime.disabled = false
        trip.disabled = false
        if (status === 'present' && (!hours.value || hours.value === '0')) {
            hours.value = 8
        } 
        if (status === 'business_trip' && (!trip.value || trip.value === '0')) {
            trip.value = 8
        }
    } else {
        hours.disabled = true
        overtime.disabled = true
        trip.disabled = true
        hours.value = 0
        overtime.value = 0
        trip.value = 0
    }
}
async function saveAttendance() {
    const date = document.getElementById('att-date').value
    const records = window._attendanceRecords || []
    const dept = document.getElementById('department-select')?.value || currentDepartment 
    const url = dept 
        ? `${API}/attendance/${date}?department=${encodeURIComponent(dept)}`
        : `${API}/attendance/${date}`
    const payload = {
        records: records.map(r => ({
            employeeId: r.employeeId,
            status: document.querySelector(`[onchange="onStatusChange(${r.employeeId}, this.value)"]`)?.value || r.status,
            standartHours: parseFloat(document.getElementById(`hours-${r.employeeId}`)?.value) || 0,
            overtimeHours: parseFloat(document.getElementById(`overtime-${r.employeeId}`)?.value) || 0,
            businessTripHours: parseFloat(document.getElementById(`trip-${r.employeeId}`)?.value) || 0,
            comment: document.getElementById(`comment-${r.employeeId}`)?.value || '',
        }))
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        alert('Табель сохранен')
        loadAttendance
    } catch (error) {
        alert(error.message)
    }
}