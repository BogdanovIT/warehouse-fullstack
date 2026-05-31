const API = '/api'
let token = ''
let currentDepartment = ''

function showLogin() {
    document.getElementById('main-content').innerHTML = `
    <div class="login-box">
        <h2>Вход в админку</h2>
        <div class="error" id="login-error"></div>
        <input type="email" id="login-email" placeholder="Email">
        <input type="password" id="login-password" placeholder="Пароль">
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
        
        token = data.accessToken;
        sessionStorage.setItem('token', token);

        const isSuperuser = data.user.roles.some(r => r.code === 'superuser');
        const userPlace = data.user.place ;
        const deptSelect = document.getElementById('department-select');

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
        case 'attendance': return showPlaceholder('Табель', "Модуль в разработке")
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
                    <input type="text" id="emp-fullname" value="${employee ? employee.fullName : ''}" required>
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
                        <option value="true" ${employee && employee.isHourly ? 'Selected' : ''}>Сделка</option>
                        <option value="false" ${employee && !employee.isHourly ? 'Selected' : ''}>Оклад</option>
                    </select>
                </div>
                <div>
                    <button type="button" class="btn-cancel" onclick="loadPage('employees')">Отмена</button>                    
                    <button type="submit" class="btn-save"">${btnText}</button>                    
                </div>
            </form>
        </div>
    `;
}

async function saveEmployee(event, id) {
    event.preventDefault()
    const data = {
        fullName: document.getElementById('emp-fullName').value.trim(),
        shortName: document.getElementById('emp-shortName').value.trim() || null,
        loginLv: document.getElementById('emp-loginLv').value.trim() || null,
        position: document.getElementById('emp-position').value.trim() || null,
        isHourly: document.getElementById('emp-isHourly').value === 'true',
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