import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
// const userId = process.env.VITE_USER_ID || ''; // Currently unused

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ScriptTemplate {
  phase: number;
  template_type: string;
  lead_type?: string;
  content: string;
  variables: string[];
  example_usage?: string;
  priority?: number;
}

interface ObjectionHandler {
  objection_type: string;
  objection_keywords: string[];
  empathy_response: string;
  reframe_response: string;
  value_response: string;
  example_context?: string;
}

// Extract variables from template content
function extractVariables(content: string): string[] {
  const variablePattern = /\[([A-Z_]+)\]/g;
  const matches = content.match(variablePattern) || [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

// Validate template content
function validateTemplate(template: ScriptTemplate): boolean {
  if (!template.content || template.content.trim().length < 10) {
    console.warn(`Template too short or empty: ${template.template_type}`);
    return false;
  }
  if (template.phase < 1 || template.phase > 6) {
    console.warn(`Invalid phase number: ${template.phase}`);
    return false;
  }
  return true;
}

// Parse the script content
async function parseQuantumScript() {
  try {
    const scriptPath = path.join(process.cwd(), 'appointment_setting', 'QUANTUM_SCRIPT_B2B.md');
    const content = await fs.readFile(scriptPath, 'utf-8');
    
    const templates: ScriptTemplate[] = [];
    const objectionHandlers: ObjectionHandler[] = [];
    
    // Split content into sections
    const sections = content.split(/^##\s+/m);
    
    sections.forEach(section => {
      const lines = section.trim().split('\n');
      if (lines.length === 0) return;
      
      const sectionTitle = lines[0].trim();
      
      // Parse Phase sections
      if (sectionTitle.match(/Fase \d+:/)) {
        const phaseMatch = sectionTitle.match(/Fase (\d+):/);
        if (!phaseMatch) return;
        
        const phase = parseInt(phaseMatch[1]);
        let currentTemplateType = '';
        let currentContent: string[] = [];
        
        lines.forEach((line, idx) => {
          if (idx === 0) return;
          
          // Detect template types
          if (line.match(/^###\s+/)) {
            if (currentContent.length > 0 && currentTemplateType) {
              const content = currentContent.join('\n').trim();
              const variables = extractVariables(content);
              
              const template = {
                phase,
                template_type: currentTemplateType,
                content,
                variables,
                priority: 0
              };
              
              if (validateTemplate(template)) {
                templates.push(template);
              }
            }
            
            currentTemplateType = line.replace(/^###\s+/, '').toLowerCase()
              .replace(/opción [ab]/i, 'greeting')
              .replace(/preguntas clave/i, 'question')
              .replace(/transición/i, 'transition');
            currentContent = [];
          } else if (line.trim().startsWith('>') || line.trim().startsWith('-')) {
            const cleanLine = line.replace(/^>\s*/, '').replace(/^-\s*/, '').trim();
            if (cleanLine) currentContent.push(cleanLine);
          }
        });
        
        // Save last template
        if (currentContent.length > 0 && currentTemplateType) {
          const content = currentContent.join('\n').trim();
          const variables = extractVariables(content);
          
          const template = {
            phase,
            template_type: currentTemplateType,
            content,
            variables,
            priority: 0
          };
          
          if (validateTemplate(template)) {
            templates.push(template);
          }
        }
      }
      
      // Parse Follow Ups section
      if (sectionTitle.includes('Follow Ups')) {
        let currentFollowUpType = '';
        
        lines.forEach((line, idx) => {
          if (idx === 0) return;
          
          if (line.includes('Follow Up') && line.includes('Horas')) {
            const hoursMatch = line.match(/(\d+)\s+Horas/);
            currentFollowUpType = hoursMatch ? `follow_up_${hoursMatch[1]}h` : 'follow_up';
          } else if (line.trim().startsWith('>') && currentFollowUpType) {
            const content = line.replace(/^>\s*/, '').trim();
            const variables = extractVariables(content);
            
            templates.push({
              phase: 6, // Follow-ups as phase 6
              template_type: currentFollowUpType,
              content,
              variables,
              priority: 0
            });
          }
        });
      }
    });
    
    // Parse objection handlers from the guide section
    const objectionSection = sections.find(s => s.includes('El prospecto indica explícitamente no tener capacidad de inversión'));
    if (objectionSection) {
      objectionHandlers.push({
        objection_type: 'price',
        objection_keywords: ['caro', 'precio', '5000', 'inversión', 'no tengo', 'no puedo pagar'],
        empathy_response: 'Entiendo perfectamente tu situación actual, [NOMBRE].',
        reframe_response: 'En este caso, mi recomendación es que sigas trabajando en tu proyecto/canal, aprendiendo y mejorando con cada paso.',
        value_response: 'Cuando tengas la disponibilidad para invertir en acelerar tus conocimientos y habilidades, estaremos encantados de volver a conversar.',
        example_context: 'Cuando el lead indica que no puede invertir 5000€'
      });
    }
    
    return { templates, objectionHandlers };
  } catch (error) {
    console.error('Error parsing script:', error);
    throw error;
  }
}

// Insert templates into Supabase
async function insertTemplates(templates: ScriptTemplate[]) {
  console.log(`Inserting ${templates.length} script templates...`);
  
  // First, check for existing templates to avoid duplicates
  const { data: existing } = await supabase
    .from('script_templates')
    .select('phase, template_type, content');
  
  const existingSet = new Set(
    existing?.map(t => `${t.phase}-${t.template_type}-${t.content.substring(0, 50)}`) || []
  );
  
  // Filter out duplicates
  const uniqueTemplates = templates.filter(t => {
    const key = `${t.phase}-${t.template_type}-${t.content.substring(0, 50)}`;
    return !existingSet.has(key);
  });
  
  if (uniqueTemplates.length === 0) {
    console.log('No new templates to insert (all duplicates)');
    return;
  }
  
  console.log(`Inserting ${uniqueTemplates.length} unique templates...`);
  
  // Insert in batches to avoid timeout
  const batchSize = 10;
  for (let i = 0; i < uniqueTemplates.length; i += batchSize) {
    const batch = uniqueTemplates.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('script_templates')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting templates:', error);
      throw error;
    }
    
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(templates.length / batchSize)}`);
  }
}

// Insert objection handlers into Supabase
async function insertObjectionHandlers(handlers: ObjectionHandler[]) {
  console.log(`Inserting ${handlers.length} objection handlers...`);
  
  const { error } = await supabase
    .from('objection_handlers')
    .insert(handlers);
  
  if (error) {
    console.error('Error inserting objection handlers:', error);
    throw error;
  }
}

// Insert initial prompts
async function insertInitialPrompts() {
  const prompts = [
    {
      prompt_type: 'main',
      version: 1,
      role_definition: `Eres un Appointment Setter experto de Quantum Creators con estas características:
- 5 años de experiencia en ventas B2B de alto ticket
- Especialista en YouTube para negocios
- Dominas las 5 fases del script de Quantum perfectamente
- Tu objetivo principal: Cualificar y agendar llamadas con leads de alto potencial`,
      system_instructions: `Antes de responder, SIEMPRE sigue este proceso mental:
1. ANALIZAR: ¿En qué fase está el lead según el script?
2. IDENTIFICAR: ¿Qué información crítica me falta?
3. OBJETIVO: ¿Cuál es mi próximo micro-objetivo?
4. ESTRATEGIA: ¿Qué técnica del script debo aplicar?
5. GENERAR: Crear respuesta alineada al script`,
      content: `# Información del Servicio
- Precio: 5.000€
- Garantía: Triplicar facturación en 12 meses o devolución 100% + 5.000€
- Incluye: Formación, mentorías 1a1, plan personalizado, comunidad

# Metodología de las 5 Fases
1. SITUACIÓN ACTUAL: Entender el negocio y uso de YouTube
2. DOLOR: Identificar problemas y frustraciones
3. SITUACIÓN DESEADA: Objetivos y motivaciones
4. OBSTÁCULO: Qué impide alcanzar objetivos
5. OFERTA A LLAMADA: Si está cualificado, agendar

# Formato de Respuesta
- Mensajes concisos y naturales
- Máximo 3 párrafos por mensaje
- Un emoji profesional máximo
- Preguntas abiertas que inviten a compartir`,
      active: true,
      performance_score: 0.00
    },
    {
      prompt_type: 'summarize',
      version: 1,
      content: `Analiza esta conversación como Consultor Senior de Ventas y proporciona:

## 📊 FICHA DEL LEAD
- **Nombre**: [Extraer]
- **Negocio**: [Tipo y descripción]
- **Fase Actual**: [1-5 según script]
- **Nivel de Cualificación**: [Alto/Medio/Bajo]
- **Capacidad de Inversión**: [Confirmada/Probable/Dudosa/No confirmada]

## 🎯 PUNTOS CLAVE
### Dolor Principal
[Máximo 2 líneas con el problema más urgente]

### Objetivo Declarado
[Qué quiere lograr específicamente]

### Obstáculos Identificados
[Qué le impide avanzar]

## 📈 MÉTRICAS DE CUALIFICACIÓN
- Urgencia: ⭐⭐⭐⭐⭐ [1-5 estrellas]
- Capacidad: ⭐⭐⭐⭐⭐ [1-5 estrellas]
- Compromiso: ⭐⭐⭐⭐⭐ [1-5 estrellas]

## ✅ PRÓXIMA ACCIÓN
[Una línea clara y específica]`,
      active: true,
      performance_score: 0.00
    },
    {
      prompt_type: 'analyze_phase',
      version: 1,
      content: `Identifica la fase actual de la conversación:

## ANÁLISIS DE FASE
- **Fase Actual**: [1-5]
- **Información Obtenida**: [Resumen de lo que sabemos]
- **Información Faltante**: [Qué necesitamos saber]

## PROGRESO POR FASE
✅ Fase 1 - Situación Actual: [Completado/Pendiente]
✅ Fase 2 - Dolor: [Completado/Pendiente]
✅ Fase 3 - Situación Deseada: [Completado/Pendiente]
✅ Fase 4 - Obstáculo: [Completado/Pendiente]
✅ Fase 5 - Oferta: [Completado/Pendiente]

## SIGUIENTE PASO
[Acción específica para avanzar a la siguiente fase]`,
      active: true,
      performance_score: 0.00
    },
    {
      prompt_type: 'suggest_message',
      version: 1,
      content: `Genera 3 opciones de respuesta siguiendo el script de Quantum:

OPCIÓN 1 - SCRIPT PURO
[Respuesta exacta del script oficial]

OPCIÓN 2 - SCRIPT ADAPTADO
[Script personalizado al contexto del lead]

OPCIÓN 3 - ESTRATÉGICA
[Aplicando psicología de ventas avanzada]

Cada opción debe:
✓ Avanzar hacia el objetivo de la fase
✓ Mantener tono profesional pero cercano
✓ Incluir pregunta abierta o CTA claro
✓ Ser copy-paste ready`,
      active: true,
      performance_score: 0.00
    }
  ];
  
  console.log('Inserting initial prompts...');
  
  const { error } = await supabase
    .from('prompts')
    .insert(prompts);
  
  if (error) {
    console.error('Error inserting prompts:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('Starting Quantum Script parsing and insertion...');
    
    // Parse the script
    const { templates, objectionHandlers } = await parseQuantumScript();
    
    console.log(`Parsed ${templates.length} templates and ${objectionHandlers.length} objection handlers`);
    
    // Insert data
    await insertTemplates(templates);
    await insertObjectionHandlers(objectionHandlers);
    await insertInitialPrompts();
    
    console.log('✅ Script parsing and insertion completed successfully!');
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
}

// Run if called directly
main();