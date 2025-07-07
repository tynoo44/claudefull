# Setter AI - Professional Appointment Setting Platform

> Advanced AI-powered CRM for professional appointment setters using Quantum Creators B2B methodology

## 🚀 Features

### **AI-Powered Intelligence**
- **Gemini 2.5 Pro Integration** - Advanced prompt engineering with script validation
- **Real-time Script Adherence** - 0.0-1.0 scoring system for message quality
- **Hierarchical Prompts** - Phase-specific templates and few-shot learning
- **Smart Suggestions** - Context-aware message recommendations

### **Lead Management CRM**
- **5-Phase Sales Pipeline** - Quantum Creators methodology tracking
- **Real-time Updates** - Instant synchronization across all users
- **Advanced Filtering** - Search by status, tags, procedence
- **Lead Scoring** - Automatic qualification based on conversations

### **Unified Messaging**
- **Multi-Platform Support** - Instagram, WhatsApp, Facebook
- **Template System** - Dynamic scripts with variables and analytics
- **Conversation History** - Complete tracking with AI analysis
- **Real-time Notifications** - Browser push + in-app alerts

### **Performance Optimized**
- **Instant Navigation** - <50ms tab switching
- **Smart Caching** - Persistent data between sessions
- **Progressive Loading** - On-demand conversation fetching
- **Minimal API Calls** - 90% reduction in database queries

## 📋 Tech Stack

- **Frontend**: React 19.1.0 + TypeScript + Vite 5
- **AI**: Google Gemini 2.5 Pro API
- **Database**: Supabase (PostgreSQL + Realtime)
- **Auth**: Supabase Auth with OAuth
- **Styling**: Tailwind CSS 3.4.17
- **Dev Tools**: ESLint + Prettier + Husky

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Gemini API key

### Installation

```bash
# Clone repository
git clone https://github.com/your-user/setter-ai.git
cd setter-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

### Environment Setup

```env
# Required
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional
VITE_USER_ID=your_authorized_user_id
```

### Database Setup

Run these SQL commands in Supabase:

```sql
-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prompts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.script_templates;

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Authenticated users can read all data" 
ON public.leads FOR SELECT 
USING (auth.role() = 'authenticated');
```

### Start Development

```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── gemini.ts              # AI response generation
│   ├── prompt-manager.ts      # Hierarchical prompt system
│   ├── response-validator.ts  # Script validation engine
│   └── supabase.ts           # Database client
├── components/
│   ├── Chat/
│   │   ├── AIChatSidebar.tsx  # AI assistant interface
│   │   └── ChatInterface.tsx  # Conversation view
│   ├── Leads/                 # Lead management
│   └── Templates/             # Message templates
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript definitions
└── pages/                     # Route components
```

## 🤖 AI System

### Prompt Engineering Architecture

1. **Base Prompts** - Role definitions and system instructions
2. **Script Templates** - Phase-specific message patterns
3. **Few-Shot Examples** - Learning from successful conversations
4. **Dynamic Context** - Real-time adaptation to conversation flow

### Script Validation

- **Key Phrase Matching** - Detects required elements
- **Synonym Recognition** - Flexible language understanding
- **Alignment Scoring** - 0.0-1.0 quality measurement
- **Auto-Regeneration** - Improves responses below threshold

## 📊 Development Workflow

### Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                 # Production build
npm run preview              # Preview production

# Code Quality
npm run lint                  # ESLint check
npm run lint:fix             # Fix linting issues
npm run format               # Format with Prettier
npm run type-check          # TypeScript validation

# Scripts
npm run parse-script         # Parse Quantum scripts
```

### TaskMaster Integration

```bash
# Task Management
task-master next             # Get next task
task-master show <id>        # View task details
task-master set-status --id=<id> --status=done

# Current Progress: 17/27 tasks completed
# Next: Task 18 - Conversation State Management
```

## 🔧 Configuration

### Model Configuration (.taskmaster/config.json)

```json
{
  "models": {
    "main": {
      "provider": "google",
      "modelId": "gemini-2.5-pro-preview-05-06",
      "temperature": 0.2
    }
  }
}
```

### Database Schema

```sql
-- AI System Tables
prompts (prompt_type, role_definition, content, active)
script_templates (phase, lead_type, content, variables)
few_shot_examples (phase, example_input, example_output)
conversations (lead_id, current_phase, qualification_score)

-- Business Tables
leads (instagram_id, username, status, procedence)
message_templates (name, content, conversion_rate)
```

## 🐛 Troubleshooting

### Realtime not working?

```sql
-- Check publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Re-add tables if needed
ALTER PUBLICATION supabase_realtime 
ADD TABLE public.your_table;
```

### Cache issues?

```javascript
// Clear cache
localStorage.removeItem('setterai_cache');

// Verify localStorage
console.log(localStorage.getItem('setterai_cache'));
```

## 🤝 Contributing

1. **Follow development protocols** (see CLAUDE.md)
2. **Use English** for all technical work
3. **Plan before coding** - Create task breakdowns
4. **Log everything** in `.taskmaster/logs/`
5. **Test performance** before PRs

### Code Standards

- Components under 500 lines
- TypeScript strict mode
- ESLint + Prettier compliance
- Performance-first approach

## 📈 Roadmap

### Phase 1: Core Features ✅
- Lead management
- Chat interface
- Template system
- Basic AI integration

### Phase 2: AI Enhancement (Current)
- Advanced prompt engineering ✅
- Script validation ✅
- Conversation state tracking 🚧
- Performance analytics 📋

### Phase 3: Advanced Features
- Dynamic context optimization
- A/B testing framework
- Setter feedback loop
- Multi-language support

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Quantum Creators** - For the B2B methodology
- **Supabase Team** - For excellent realtime infrastructure
- **Google AI** - For Gemini API access
- **React Team** - For React 19 innovations

---

## ⚡ **Performance Metrics**

| Feature | Performance | Notes |
|---------|------------|-------|
| Tab Switch | <50ms | Instant navigation |
| Initial Load | 1-2s | With full cache |
| API Calls | -90% | Smart caching |
| Realtime Lag | <100ms | Native WebSockets |

---

**Built for appointment setters who demand speed, intelligence, and results.** 🚀