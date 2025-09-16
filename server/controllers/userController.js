import User from '../models/User.js';
import bcrypt from 'bcryptjs'

const register = async (req, res) => {
  try {
    const {
        firstName,
        lastName,
        loginLv,
        email,
        password,
        place,
        operators = []
    } = req.body
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({error: 'Тело запроса пустое'})
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = await User.create({ 
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      loginLv: loginLv,
      place: place,
      operators: operators.filter(op => op.trim() !== '')
    });


    res.status(201).json({ 
      id: user.id,
      email: user.email,
      firstName: user.firstName
    });
    
  } catch (error) {
    console.error('Полная ошибка регистрации:', error); 

    let errorMessage = 'Ошибка регистрации';
    if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'Пользователь с таким email уже существует';
    } else if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors.map(e => e.message).join(', ');
  }
    
    res.status(400).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export default register