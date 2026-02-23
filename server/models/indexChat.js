import sequelize from "../config/db.js";
import User from "./User.js";
import ChatRoom from "./ChatRoom.js";
import Message from "./Message.js";

ChatRoom.hasMany(Message, {
    foreignKey: 'roomId',
    onDelete: 'CASCADE'
})
Message.belongsTo(ChatRoom, {foreignKey: 'roomId'})
User.hasMany(Message, {
    foreignKey: 'authorId',
    onDelete: 'SET NULL'
})
Message.belongsTo(User, {foreignKey: 'authorId'})
User.belongsTo(ChatRoom, {
    foreignKey: 'place',
    targetKey: 'place'
})
export {User, ChatRoom, Message}