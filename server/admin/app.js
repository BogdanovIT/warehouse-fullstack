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

        const userRes = await fetch(`${API}/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const userData = await userRes.json();
        const isSuperuser = userData.roles?.some(r => r.code === 'superuser');

        const deptSelect = document.getElementById('department-select');
        if (isSuperuser) {
            const departments = await loadDepartments();
            deptSelect.innerHTML = departments.map(d => 
                `<option value="${d}" ${d === userData.place ? 'selected' : ''}>${d}</option>`
            ).join('');
        } else {
            deptSelect.innerHTML = `<option value="${userData.place}">${userData.place}</option>`;
            deptSelect.disabled = true; // нельзя менять
        }
        currentDepartment = userData.place;

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
        const res = await fetch(`${API}/employees`, {
            headers: { 'Authorization': `Bearer ${token}`},
        })
        const employees = await res.json()
        if (!res.ok) throw new Error(employees.message)
        
        document.getElementById('main-content').innerHTML = `
        <h2>Сотрудники (${dept || 'Все подразделения'}) </h2>
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
async function loadUsers() {
    document.getElementById('main-content').innerHTML = `
        <h2>Ползователи</h2>
        <div class="table-wrapper">
            <p>Загрузка...</p>
        </div>
    `
}
function onDepartmentChange() {
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