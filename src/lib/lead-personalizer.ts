// Sistema de personalización de mensajes según el tipo de lead
// Adapta el tono y estilo según el perfil detectado

export interface LeadProfile {
  type:
    | 'young_entrepreneur'
    | 'established_business'
    | 'corporate'
    | 'solopreneur'
    | 'content_creator'
    | 'unknown';
  ageGroup: 'gen_z' | 'millennial' | 'gen_x' | 'boomer' | 'unknown';
  communicationStyle: 'formal' | 'casual' | 'very_casual' | 'mixed';
  industryVertical?: string;
  techSavviness: 'high' | 'medium' | 'low';
  decisionMakingStyle: 'quick' | 'analytical' | 'consultative' | 'emotional';
}

export interface PersonalizationRules {
  greetingStyle: string[];
  vocabularyLevel: 'simple' | 'moderate' | 'sophisticated';
  useSlang: boolean;
  useEmojis: boolean;
  sentenceLength: 'short' | 'medium' | 'long';
  persuasionStyle: 'direct' | 'storytelling' | 'data_driven' | 'emotional';
  examplePhrases: {
    greeting: string[];
    question: string[];
    closing: string[];
  };
}

// Analizar el perfil del lead basado en sus mensajes
export function analyzeLeadProfile(messages: string[]): LeadProfile {
  const combinedText = messages.join(' ').toLowerCase();

  // Detectar grupo de edad por el lenguaje
  const ageGroup = detectAgeGroup(combinedText);

  // Detectar estilo de comunicación
  const communicationStyle = detectCommunicationStyle(combinedText);

  // Detectar tipo de lead
  const type = detectLeadType(combinedText);

  // Detectar nivel técnico
  const techSavviness = detectTechSavviness(combinedText);

  // Detectar estilo de toma de decisiones
  const decisionMakingStyle = detectDecisionStyle(messages);

  return {
    type,
    ageGroup,
    communicationStyle,
    techSavviness,
    decisionMakingStyle,
  };
}

// Detectar grupo de edad
function detectAgeGroup(text: string): LeadProfile['ageGroup'] {
  const genZIndicators = [
    'bro',
    'lit',
    'sus',
    'lowkey',
    'highkey',
    'vibes',
    'no cap',
    'fr',
    'lol',
    'lmao',
    'xd',
  ];
  const millennialIndicators = ['jaja', 'jeje', 'tio', 'colega', 'crack', 'top', 'epic', 'fail'];
  const genXIndicators = ['saludos', 'cordialmente', 'estimado', 'atentamente'];

  const genZCount = genZIndicators.filter(ind => text.includes(ind)).length;
  const millennialCount = millennialIndicators.filter(ind => text.includes(ind)).length;
  const genXCount = genXIndicators.filter(ind => text.includes(ind)).length;

  if (genZCount > millennialCount && genZCount > genXCount) return 'gen_z';
  if (millennialCount > genXCount) return 'millennial';
  if (genXCount > 0) return 'gen_x';

  return 'unknown';
}

// Detectar estilo de comunicación
function detectCommunicationStyle(text: string): LeadProfile['communicationStyle'] {
  const formalIndicators = ['usted', 'cordialmente', 'atentamente', 'estimado', 'distinguido'];
  const veryCasualIndicators = ['bro', 'tio', 'joder', 'coño', 'puto', 'xd', 'jaja'];

  const formalCount = formalIndicators.filter(ind => text.includes(ind)).length;
  const veryCasualCount = veryCasualIndicators.filter(ind => text.includes(ind)).length;

  if (formalCount > 2) return 'formal';
  if (veryCasualCount > 2) return 'very_casual';
  if (veryCasualCount > 0 || text.includes('!') || text.includes('?')) return 'casual';

  return 'mixed';
}

// Detectar tipo de lead
function detectLeadType(text: string): LeadProfile['type'] {
  if (text.includes('mi empresa') || text.includes('empleados') || text.includes('equipo')) {
    return 'established_business';
  }
  if (text.includes('canal') || text.includes('youtube') || text.includes('contenido')) {
    return 'content_creator';
  }
  if (text.includes('empezando') || text.includes('idea') || text.includes('proyecto')) {
    return 'young_entrepreneur';
  }
  if (text.includes('freelance') || text.includes('solo') || text.includes('yo mismo')) {
    return 'solopreneur';
  }
  if (text.includes('corporativo') || text.includes('departamento') || text.includes('gerente')) {
    return 'corporate';
  }

  return 'unknown';
}

// Detectar nivel técnico
function detectTechSavviness(text: string): LeadProfile['techSavviness'] {
  const techTerms = ['api', 'analytics', 'seo', 'roi', 'kpi', 'funnel', 'conversion', 'métrica'];
  const techCount = techTerms.filter(term => text.includes(term)).length;

  if (techCount >= 3) return 'high';
  if (techCount >= 1) return 'medium';
  return 'low';
}

// Detectar estilo de toma de decisiones
function detectDecisionStyle(messages: string[]): LeadProfile['decisionMakingStyle'] {
  const lastMessages = messages.slice(-5).join(' ').toLowerCase();

  if (
    lastMessages.includes('datos') ||
    lastMessages.includes('números') ||
    lastMessages.includes('resultados')
  ) {
    return 'analytical';
  }
  if (
    lastMessages.includes('siento') ||
    lastMessages.includes('me gusta') ||
    lastMessages.includes('corazón')
  ) {
    return 'emotional';
  }
  if (
    lastMessages.includes('equipo') ||
    lastMessages.includes('consultar') ||
    lastMessages.includes('hablar con')
  ) {
    return 'consultative';
  }
  if ((messages.length < 3 && lastMessages.includes('dale')) || lastMessages.includes('vamos')) {
    return 'quick';
  }

  return 'analytical'; // default
}

// Obtener reglas de personalización según el perfil
export function getPersonalizationRules(profile: LeadProfile): PersonalizationRules {
  const baseRules: PersonalizationRules = {
    greetingStyle: ['Hola', 'Hey', 'Buenas'],
    vocabularyLevel: 'moderate',
    useSlang: false,
    useEmojis: false,
    sentenceLength: 'medium',
    persuasionStyle: 'direct',
    examplePhrases: {
      greeting: [],
      question: [],
      closing: [],
    },
  };

  // Personalizar según tipo de lead
  switch (profile.type) {
    case 'young_entrepreneur':
      baseRules.greetingStyle = ['Hey', 'Qué tal', 'Buenas'];
      baseRules.useSlang = true;
      baseRules.sentenceLength = 'short';
      baseRules.persuasionStyle = 'storytelling';
      baseRules.examplePhrases = {
        greeting: [
          'Hey bro, vi tu proyecto y mola bastante',
          'Qué tal tio, he visto lo que estás montando',
        ],
        question: [
          'Cuéntame, qué es lo que más te está costando ahora mismo',
          'En qué punto estás con tu proyecto',
        ],
        closing: ['Dale, cuando quieras lo hablamos', 'Genial tio, seguimos en contacto'],
      };
      break;

    case 'established_business':
      baseRules.vocabularyLevel = 'sophisticated';
      baseRules.sentenceLength = 'medium';
      baseRules.persuasionStyle = 'data_driven';
      baseRules.examplePhrases = {
        greeting: [
          'Buenos días, he visto su empresa y me parece muy interesante',
          'Hola, veo que llevan tiempo en el sector',
        ],
        question: [
          'Qué estrategias están utilizando actualmente para crecer',
          'Cuáles son sus principales retos este año',
        ],
        closing: [
          'Podemos agendar una llamada para explorar opciones',
          'Le propongo una reunión breve para analizar su caso',
        ],
      };
      break;

    case 'content_creator':
      baseRules.useSlang = true;
      baseRules.useEmojis = true;
      baseRules.persuasionStyle = 'emotional';
      baseRules.examplePhrases = {
        greeting: ['Hey! Vi tu canal y está genial 🔥', 'Buenas! Me flipó tu último vídeo'],
        question: ['Cómo llevas el tema de monetización', 'Qué tal va el crecimiento del canal'],
        closing: [
          'Si quieres lo charlamos y vemos cómo disparar tu canal 🚀',
          'Dale, te cuento cómo triplicar tus views',
        ],
      };
      break;
  }

  // Ajustar según edad
  if (profile.ageGroup === 'gen_z') {
    baseRules.useSlang = true;
    baseRules.sentenceLength = 'short';
    baseRules.greetingStyle = ['Hey', 'Buenas', 'Qué pasa'];
  } else if (profile.ageGroup === 'gen_x' || profile.ageGroup === 'boomer') {
    baseRules.useSlang = false;
    baseRules.vocabularyLevel = 'sophisticated';
    baseRules.greetingStyle = ['Buenos días', 'Hola', 'Buenas tardes'];
  }

  // Ajustar según estilo de comunicación
  if (profile.communicationStyle === 'very_casual') {
    baseRules.useSlang = true;
    baseRules.sentenceLength = 'short';
  } else if (profile.communicationStyle === 'formal') {
    baseRules.useSlang = false;
    baseRules.vocabularyLevel = 'sophisticated';
    baseRules.sentenceLength = 'long';
  }

  return baseRules;
}

// Aplicar personalización a un mensaje
export function personalizeMessage(
  message: string,
  profile: LeadProfile,
  messageType: 'greeting' | 'question' | 'statement' | 'closing',
): string {
  const rules = getPersonalizationRules(profile);
  let personalizedMessage = message;

  // Reemplazar saludos genéricos
  if (messageType === 'greeting' && rules.examplePhrases.greeting.length > 0) {
    const randomGreeting =
      rules.examplePhrases.greeting[
        Math.floor(Math.random() * rules.examplePhrases.greeting.length)
      ];
    return randomGreeting;
  }

  // Ajustar vocabulario
  if (rules.vocabularyLevel === 'simple' && rules.useSlang) {
    personalizedMessage = personalizedMessage
      .replace('¿Cuál es', 'Cuál es')
      .replace('¿Qué', 'Qué')
      .replace('podríamos', 'podemos')
      .replace('sería interesante', 'estaría guay')
      .replace('me gustaría', 'me mola');
  }

  // Agregar emojis si aplica
  if (rules.useEmojis && messageType === 'closing') {
    personalizedMessage += ' 🚀';
  }

  // Ajustar longitud
  if (rules.sentenceLength === 'short') {
    // Dividir mensajes largos
    const sentences = personalizedMessage.split('. ');
    if (sentences.length > 2) {
      personalizedMessage = sentences.slice(0, 2).join('. ') + '.';
    }
  }

  return personalizedMessage;
}

// Sugerir siguiente mensaje basado en el perfil
export function suggestNextMessage(profile: LeadProfile, phase: number): string[] {
  const suggestions: string[] = [];

  // Generar sugerencias según la fase y el perfil
  switch (phase) {
    case 1: // Contacto inicial
      if (profile.type === 'young_entrepreneur') {
        suggestions.push(
          'Hey! Vi que estás montando algo interesante. Cuéntame, en qué punto estás con tu proyecto',
        );
        suggestions.push('Buenas tio! Me llamó la atención tu idea. Qué tal va todo');
      } else if (profile.type === 'established_business') {
        suggestions.push(
          'Buenos días. Veo que llevan un tiempo consolidados en el sector. Me gustaría conocer cuáles son sus principales retos actuales',
        );
        suggestions.push(
          'Hola, he estado revisando su empresa y me parece muy interesante su propuesta. Cómo están abordando el crecimiento digital',
        );
      }
      break;

    case 2: // Dolor
      if (profile.decisionMakingStyle === 'analytical') {
        suggestions.push(
          'Entiendo. Y en términos de números, qué impacto está teniendo esto en tu negocio',
        );
        suggestions.push(
          'Vale, y has medido cuánto te está costando este problema en tiempo o dinero',
        );
      } else if (profile.decisionMakingStyle === 'emotional') {
        suggestions.push('Vaya, imagino que eso debe ser bastante frustrante. Cómo lo llevas');
        suggestions.push(
          'Uf, entiendo perfectamente esa sensación. Cuánto tiempo llevas lidiando con esto',
        );
      }
      break;
  }

  return suggestions;
}
