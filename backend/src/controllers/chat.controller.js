const crypto = require('crypto');
const prisma = require('../config/database');

// Personal autorizado (ADMIN o COLABORADOR) puede consultar cualquier conversación.
const esPersonal = (req) => ['ADMIN', 'COLABORADOR'].includes(req.user?.role?.name);

const tokenValido = (esperado, recibido) => {
  if (!esperado || !recibido) return false;
  const a = Buffer.from(String(esperado));
  const b = Buffer.from(String(recibido));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Conversaciones de visitantes (sin cuenta): solo quien tiene su token puede leerlas o escribir.
// Conversaciones de usuarios registrados: solo su dueño.
function comprobarAcceso(conversation, req) {
  if (esPersonal(req)) return;
  if (!conversation.userId && tokenValido(conversation.accessToken, req.get('x-conversation-token'))) return;
  if (conversation.userId && req.user && req.user.id === conversation.userId) return;
  throw new AppError('No tienes acceso a esta conversación.', 403);
}
const { AppError, asyncHandler } = require('../utils/helpers');
const { generateResponse } = require('../services/ai.service');
const { ROLES, NOTIFICATION_TYPES } = require('../utils/constants');

exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { message, conversationId } = req.body;

  if (!message || !message.trim()) {
    throw new AppError('El mensaje no puede estar vacío.', 400);
  }

  let conversation;

  if (conversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
    });
    if (!conversation) throw new AppError('Conversación no encontrada.', 404);
    comprobarAcceso(conversation, req);
    if (conversation.status === 'CERRADA') {
      throw new AppError('Esta conversación está cerrada. Inicia una nueva.', 400);
    }
  } else {
    if (req.user) {
      conversation = await prisma.conversation.findFirst({
        where: { userId: req.user.id, status: 'ACTIVA' },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userId: req.user.id, status: 'ACTIVA' },
        });
      }
    } else {
      conversation = await prisma.conversation.create({
        data: { userId: null, status: 'ACTIVA', accessToken: crypto.randomBytes(32).toString('hex') },
      });
    }
  }

  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'USUARIO',
      content: message,
    },
  });

  // Los 10 mensajes MÁS RECIENTES (incluido el que acaba de llegar), en orden cronológico para la IA.
  const history = (
    await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { id: 'desc' },
      take: 10,
    })
  ).reverse();

  const { answer, usedMock, escalate } = await generateResponse(message, history);

  const botMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: 'BOT',
      content: answer,
    },
  });

  if (escalate) {
    const escalated = await escalateConversation(conversation.id);
    if (escalated) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'BOT',
          content:
            'Tu conversación ha sido escalada a un colaborador. En breve alguien de nuestro equipo te atenderá.',
        },
      });
    }
  }

  res.json({
    success: true,
    data: {
      conversationId: conversation.id,
      userMessage,
      botMessage,
      usedMock,
      escalated: escalate,
      accessToken: conversation.userId ? undefined : conversation.accessToken,
    },
  });
});

async function escalateConversation(conversationId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.status === 'ESCALADA') return false;

  const colaboradores = await prisma.user.findMany({
    where: { role: { name: ROLES.COLABORADOR }, isActive: true },
    orderBy: { id: 'asc' },
  });

  const admins = await prisma.user.findMany({
    where: { role: { name: ROLES.ADMIN }, isActive: true },
    orderBy: { id: 'asc' },
  });

  const collaborator = colaboradores[0] || admins[0];

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'ESCALADA',
      assignedTo: collaborator ? collaborator.id : null,
    },
  });

  if (collaborator) {
    await prisma.notification.create({
      data: {
        userId: collaborator.id,
        type: NOTIFICATION_TYPES.ESCALAMIENTO,
        message: 'Una conversación del chatbot fue escalada. Requiere tu atención.',
        conversationId,
      },
    });
  }

  return true;
}

exports.getConversations = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  const where = {};
  if (status) where.status = status;

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedCollaborator: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ success: true, data: conversations });
});

exports.getConversation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedCollaborator: { select: { id: true, firstName: true, lastName: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!conversation) throw new AppError('Conversación no encontrada.', 404);

  res.json({ success: true, data: conversation });
});

exports.pollConversation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const after = Number(req.query.after) || 0;

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw new AppError('Conversación no encontrada.', 404);

  comprobarAcceso(conversation, req);

  const messages = await prisma.message.findMany({
    where: { conversationId: id, id: { gt: after } },
    orderBy: { id: 'asc' },
  });

  res.json({
    success: true,
    data: {
      conversationId: conversation.id,
      status: conversation.status,
      messages,
    },
  });
});

exports.escalateConversation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw new AppError('Conversación no encontrada.', 404);
  if (conversation.status === 'CERRADA') {
    throw new AppError('Esta conversación está cerrada.', 400);
  }

  const escalated = await escalateConversation(id);

  if (!escalated && conversation.status === 'ESCALADA') {
    throw new AppError('Esta conversación ya fue escalada.', 400);
  }

  await prisma.message.create({
    data: {
      conversationId: id,
      sender: 'BOT',
      content: 'La conversación fue escalada a un colaborador. En breve te atenderá.',
    },
  });

  res.json({ success: true, message: 'Conversación escalada a un colaborador.' });
});

exports.collaboratorReply = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { message } = req.body;

  if (!message || !message.trim()) throw new AppError('El mensaje es obligatorio.', 400);

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw new AppError('Conversación no encontrada.', 404);
  if (conversation.status === 'CERRADA') {
    throw new AppError('Esta conversación está cerrada.', 400);
  }

  if (conversation.assignedTo && conversation.assignedTo !== req.user.id) {
    throw new AppError('No tienes asignada esta conversación.', 403);
  }

  const reply = await prisma.message.create({
    data: {
      conversationId: id,
      sender: 'COLABORADOR',
      content: message,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { assignedTo: req.user.id, status: 'ACTIVA' },
  });

  await clearEscalationNotifications(id);

  res.status(201).json({ success: true, data: reply });
});

function clearEscalationNotifications(conversationId) {
  return prisma.notification.updateMany({
    where: { conversationId, isRead: false },
    data: { isRead: true },
  });
}

exports.closeConversation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  await prisma.conversation.update({
    where: { id },
    data: { status: 'CERRADA' },
  });

  await clearEscalationNotifications(id);

  res.json({ success: true, message: 'Conversación cerrada.' });
});

exports.getMyConversation = asyncHandler(async (req, res, next) => {
  const conversation = await prisma.conversation.findFirst({
    where: { userId: req.user.id, status: { in: ['ACTIVA', 'ESCALADA'] } },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ success: true, data: conversation });
});

module.exports = exports;