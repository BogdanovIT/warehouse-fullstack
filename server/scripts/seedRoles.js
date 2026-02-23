import sequelize from "../config/db.js";
import Role from "../models/Role.js";

const defaultRoles = [
    {
        code: 'storekeeper',
        name: 'Кладовщик',
        description: 'Кладовщик - базовый доступ к задачам и личной статистике',
        permissions: ['view_own_tasks', 'view_own_stats', 'update_task_status', 'scan_barcode', 'view_schedule'],
        level: 10
    },
    {
        code: 'senior_storekeeper',
        name: 'Старший клкладовщик',
        description: 'Старший кладовщик - доступ к статистике своей зоны/смены',
        permissions: ['view_oun_tasks', 'view_own_stats', 'view_team_stats', 'assign_tasks',
            'update_task_status', 'scan_barcode', 'view_schedule', 'edit_schedule', 'approve_requests',
            'view_reports'],
        level: 30
    },
    {
        code: 'director',
        name: 'Директор',
        description: 'Руководитель - полный доступ к статистике и управлению',
        permissions: ['view_all_stats', 'manage_users', 'configure_kpi', 'generate_reports', 'view_financial',
            'assign_tasks', 'edit_schedule', 'system_settings', 'audit_log'],
        level: 50
    },
    {
        code: 'superuser',
        name: 'Суперпользователь',
        description: 'Суперпользователь - полный доступ ко всему',
        permissions: ['*'],
        level: 100
    }
]
async function seedRoles() {
    try {
        await sequelize.authenticate()
        await Role.sync({ force: false })
        for (const roleData of defaultRoles) {
            const [role, created] = await Role.findOrCreate({
                where: { code: roleData.code},
                defaults: roleData
            })
            if (!created) {
                await role.update(roleData)
                console.log(`Роль "${roleData.name}" обновлена`)
            } else {
                console.log(`Роль "${roleData.name}" создана`)
            }
        }
        console.log('Роли успешно инициализированы')
        process.exit(0)
    } catch (error) {
        console.log('Ошибка при инициализации ролей', error)
        process.exit(1)
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    seedRoles()
}

export default seedRoles