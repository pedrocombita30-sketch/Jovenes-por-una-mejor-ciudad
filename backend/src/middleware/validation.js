const { body, validationResult } = require('express-validator');

const validate = (rules) => {
  return async (req, res, next) => {
    await Promise.all(rules.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, message: messages.join(' · ') });
  };
};

const validators = {
  register: [
    body('email').isEmail().withMessage('Ingresa un correo electrónico válido.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres.'),
    body('firstName').notEmpty().withMessage('El nombre es obligatorio.'),
    body('lastName').notEmpty().withMessage('El apellido es obligatorio.'),
  ],
  login: [
    body('email').isEmail().withMessage('Ingresa un correo electrónico válido.'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  ],
  createClient: [
    body('firstName').notEmpty().withMessage('El nombre es obligatorio.'),
    body('lastName').notEmpty().withMessage('El apellido es obligatorio.'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Correo inválido.'),
  ],
  createResource: [
    body('title').notEmpty().withMessage('El título es obligatorio.'),
    body('type').notEmpty().withMessage('El tipo de recurso es obligatorio.'),
  ],
};

module.exports = { validate, validators };