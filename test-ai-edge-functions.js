// Test script for AI Edge Functions
// Run with: node test-ai-edge-functions.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awyslztbkykhjhhykacf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXNsenRia3lraGpoaHlrYWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzEyNjEsImV4cCI6MjA2NTc0NzI2MX0.chmGUF4NxbsE8D3tujYzDC7Xm0zEQP7j6_L0VGrqyVc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAIResponse() {
  console.log('🧪 Testing ai-response Edge Function...\n');
  
  try {
    const testMessages = [
      {
        role: 'user',
        content: 'Hola, ¿qué servicios ofrecen?'
      }
    ];

    const { data, error } = await supabase.functions.invoke('ai-response', {
      body: {
        messages: testMessages,
        model: 'gemini-2.5-flash',
        currentPhase: 1,
        leadType: 'business',
        conversationId: 'test-conv-123',
        leadId: 'test-lead-123',
        enableTracking: false
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      return false;
    }

    console.log('✅ Response received:');
    console.log('Success:', data.success);
    console.log('Response:', data.response?.substring(0, 100) + '...');
    console.log('Metadata:', data.metadata);
    return true;

  } catch (err) {
    console.error('❌ Exception:', err);
    return false;
  }
}

async function testAIAnalyze() {
  console.log('\n🧪 Testing ai-analyze Edge Function...\n');
  
  try {
    const testMessages = [
      { role: 'user', content: 'Hola, necesito ayuda con marketing' },
      { role: 'assistant', content: '¡Hola! Me alegra que te interese el marketing. ¿Qué tipo de negocio tienes?' },
      { role: 'user', content: 'Tengo una tienda online de ropa' }
    ];

    const { data, error } = await supabase.functions.invoke('ai-analyze', {
      body: {
        conversationId: 'test-conv-456',
        leadId: 'test-lead-456',
        messages: testMessages,
        forceReanalyze: true
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      return false;
    }

    console.log('✅ Analysis received:');
    console.log('Success:', data.success);
    console.log('Analysis:', data.analysis);
    return true;

  } catch (err) {
    console.error('❌ Exception:', err);
    return false;
  }
}

async function testQuickActions() {
  console.log('\n🧪 Testing ai-quick-actions Edge Function...\n');
  
  try {
    const testMessages = [
      { role: 'user', content: 'Necesito mejorar mis ventas online' },
      { role: 'assistant', content: 'Entiendo que quieres mejorar tus ventas online. ¿Cuál es tu principal desafío?' },
      { role: 'user', content: 'No tengo suficiente tráfico en mi sitio web' }
    ];

    const { data, error } = await supabase.functions.invoke('ai-quick-actions', {
      body: {
        messages: testMessages,
        model: 'gemini-2.5-flash',
        action: 'suggest_messages'
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      return false;
    }

    console.log('✅ Quick action response:');
    console.log('Success:', data.success);
    console.log('Suggestions:', data.suggestions);
    return true;

  } catch (err) {
    console.error('❌ Exception:', err);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Edge Functions tests...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using anon key:', supabaseAnonKey.substring(0, 20) + '...\n');

  const results = {
    aiResponse: await testAIResponse(),
    aiAnalyze: await testAIAnalyze(),
    quickActions: await testQuickActions()
  };

  console.log('\n📊 Test Summary:');
  console.log('ai-response:', results.aiResponse ? '✅ PASSED' : '❌ FAILED');
  console.log('ai-analyze:', results.aiAnalyze ? '✅ PASSED' : '❌ FAILED');
  console.log('ai-quick-actions:', results.quickActions ? '✅ PASSED' : '❌ FAILED');

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
}

// Run tests
runAllTests();