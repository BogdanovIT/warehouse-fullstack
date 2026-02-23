import sequelize from "../config/db.js";
import User from "./User.js";
import Role from "./Role.js";
import UserRole from "./UserRole.js";

User.associate({ Role, UserRole })
Role.associate({ User, UserRole })
UserRole.associate?.({ User, Role })

const models = {
    User,
    Role,
    UserRole
}

sequelize.models = {
    ...sequelize.models,
    ...models
}

export { sequelize, User, Role, UserRole}