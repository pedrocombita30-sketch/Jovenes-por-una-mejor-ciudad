const prisma = require('../config/database');

const normalize = (text) => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
};

const suggestEscalation =
  'No tengo respuesta para esa consulta, pero puedo escalar tu solicitud a un colaborador humano que te atenderá de inmediato.';

const fallbackAnswer =
  'Gracias por tu mensaje. Si necesitas más información, puedo ayudarte con temas como: actividades e inscripciones, capacitaciones, recursos descargables, voluntariado o datos de contacto de la organización.';

const RULES = [
  {
    keywords: ['hola', 'buenas', 'saludos', 'hey', 'buen dia', 'buenas tardes', 'buenas noches'],
    answer:
      '¡Hola! Soy el asistente virtual de Jóvenes por una Mejor Ciudad. Estoy aquí para ayudarte con información sobre actividades, capacitaciones, recursos, voluntariado y más. ¿En qué puedo ayudarte?',
  },
  {
    keywords: ['gracias', 'muchas gracias', 'genial', 'excelente', 'perfecto'],
    answer: '¡Con gusto! Si necesitas algo más, aquí estoy. Que tengas un excelente día.',
  },
  {
    keywords: ['humano', 'agente', 'persona', 'asesor', 'escalar', 'hablar con alguien', 'operador'],
    answer: suggestEscalation,
    escalate: true,
  },
];

async function findKnowledgeMatch(message) {
  const normalized = normalize(message);
  const words = normalized.split(' ').filter((w) => w.length > 2);

  const entries = await prisma.chatbotKnowledge.findMany({ where: { active: true } });

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of entries) {
    const entryWords = normalize(entry.keywords)
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    let score = 0;
    for (const keyword of entryWords) {
      const kw = keyword.split(' ')[0];
      if (kw && normalized.includes(kw)) score += 1;
    }
    for (const word of words) {
      if (entryWords.some((kw) => kw.split(' ').includes(word))) score += 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 1) {
    return { answer: bestEntry.answer, match: true };
  }

  return { answer: null, match: false };
}

async function openAIResponse(messages, apiKey, model) {
  const base = process.env.AI_MODEL || model || 'gpt-3.5-turbo';
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const systemMessage = {
    role: 'system',
    content:
      'Eres el asistente virtual oficial de "Jóvenes por una Mejor Ciudad", una organización juvenil sin fines de lucro. Responde de forma breve, amable y en español. Si no conoces la respuesta, sugiere escalar la conversación a un colaborador humano.',
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: base,
      messages: [systemMessage, ...messages.slice(-10)],
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    throw new Error('Error al comunicarse con el proveedor de IA.');
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function generateResponse(userMessage, history) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && process.env.NODE_ENV !== 'test') {
    try {
      const messages = [
        ...history.map((m) => ({
          role: m.sender === 'USUARIO' ? 'user' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ];
      const answer = await openAIResponse(messages, apiKey);
      return { answer, usedMock: false, escalate: false };
    } catch (err) {
      console.error('IA fallback al mock:', err.message);
    }
  }

  // Modo mock
  for (const rule of RULES) {
    const normalized = normalize(userMessage);
    if (rule.keywords.some((k) => normalized.includes(k))) {
      return { answer: rule.answer, usedMock: true, escalate: !!rule.escalate };
    }
  }

  const knowledge = await findKnowledgeMatch(userMessage);
  if (knowledge.match) {
    return { answer: knowledge.answer, usedMock: true, escalate: false };
  }

  // Contexto básico: si la respuesta anterior fue un saludo, responder coherentemente
  const lastUserMsg = history.filter((m) => m.sender === 'USUARIO').slice(-1)[0];
  const lastBotMsg = history.filter((m) => m.sender === 'BOT').slice(-1)[0];

  if (lastBotMsg && normalize(lastBotMsg.content).includes('asistente virtual')) {
    return { answer: fallbackAnswer, usedMock: true, escalate: false };
  }

  return { answer: suggestEscalation, usedMock: true, escalate: true };
}

module.exports = { generateResponse };