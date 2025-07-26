// Minimal test for AI Edge Function
// Run with: node test-ai-minimal.mjs

const SUPABASE_URL = 'https://awyslztbkykhjhhykacf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXNsenRia3lraGpoaHlrYWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzEyNjEsImV4cCI6MjA2NTc0NzI2MX0.chmGUF4NxbsE8D3tujYzDC7Xm0zEQP7j6_L0VGrqyVc';

async function testAIResponse() {
  console.log('🧪 Testing AI Edge Function...\n');
  
  const payload = {
    messages: [
      {
        role: 'user',
        content: 'Hola, ¿qué servicios ofrecen?'
      }
    ],
    model: 'gemini-2.5-flash',
    currentPhase: 1,
    leadType: 'business',
    enableTracking: false
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-response`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Test PASSED - AI responded successfully');
      console.log('AI Response preview:', data.response?.substring(0, 100) + '...');
    } else {
      console.log('\n❌ Test FAILED - Error:', data.error);
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error);
  }
}

// Run test
testAIResponse();