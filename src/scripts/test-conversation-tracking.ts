/**
 * Manual Testing Script for Conversation State Tracking System
 * 
 * This script tests the complete conversation tracking system including:
 * - RPC functions
 * - ConversationStateManager
 * - Database operations
 * - Score calculations
 */

import { ConversationStateManager } from '../lib/conversation-state-manager';
import { supabase } from '../lib/supabase';

// Test data
const TEST_CONVERSATION_ID = 'test-conv-' + Date.now();
const TEST_LEAD_ID = 'test-lead-' + Date.now();

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  data?: any;
}

class ConversationTrackingTester {
  private results: TestResult[] = [];

  private addResult(testName: string, passed: boolean, error?: string, data?: any) {
    this.results.push({ testName, passed, error, data });
    console.log(`${passed ? '✅' : '❌'} ${testName}${error ? `: ${error}` : ''}`);
  }

  async runAllTests() {
    console.log('🧪 Starting Conversation Tracking System Tests...\n');

    await this.testDatabaseConnection();
    await this.testNewConversationCreation();
    await this.testPhaseProgression();
    await this.testScoreCalculation();
    await this.testDataRetrieval();
    await this.testErrorHandling();
    await this.testUICompatibility();
    await this.cleanup();

    this.printSummary();
  }

  async testDatabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('count')
        .limit(1);

      if (error) throw error;
      this.addResult('Database Connection', true, undefined, data);
    } catch (error) {
      this.addResult('Database Connection', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async testNewConversationCreation() {
    try {
      const result = await ConversationStateManager.updateConversationState({
        conversationId: TEST_CONVERSATION_ID,
        leadId: TEST_LEAD_ID,
        userMessage: 'Hola, estoy interesado en mejorar mis ventas',
        aiResponse: 'Perfecto, cuéntame más sobre tu situación actual de ventas',
        currentPhase: 1,
        phaseInfo: {
          current_situation: 'Interesado en mejorar ventas'
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create conversation');
      }

      this.addResult('New Conversation Creation', true, undefined, {
        memoryId: result.memory_id,
        score: result.qualification_score,
        phaseChanged: result.phase_changed
      });
    } catch (error) {
      this.addResult('New Conversation Creation', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async testPhaseProgression() {
    try {
      // Test progression through phases 2-5
      const phases = [
        {
          phase: 2,
          userMessage: 'Mis ventas han bajado mucho últimamente',
          aiResponse: 'Entiendo tu preocupación. ¿Cuál sería tu situación ideal?',
          phaseInfo: { pain_points: ['Ventas bajas', 'Falta de clientes'] }
        },
        {
          phase: 3,
          userMessage: 'Me gustaría duplicar mis ventas en 6 meses',
          aiResponse: '¡Excelente objetivo! ¿Qué obstáculos ves para lograrlo?',
          phaseInfo: { desired_situation: 'Duplicar ventas en 6 meses' }
        },
        {
          phase: 4,
          userMessage: 'No tengo un sistema organizado de seguimiento',
          aiResponse: 'Ese es exactamente el tipo de problema que solucionamos...',
          phaseInfo: { obstacles: ['Falta de sistema', 'Desorganización'] }
        },
        {
          phase: 5,
          userMessage: 'Me interesa, ¿cuándo podemos hablar?',
          aiResponse: '¡Perfecto! Te propongo que agendemos una llamada...',
          phaseInfo: { offer_presented: true, appointment_interest: true }
        }
      ];

      let allPassed = true;
      for (const phaseTest of phases) {
        const result = await ConversationStateManager.updateConversationState({
          conversationId: TEST_CONVERSATION_ID,
          leadId: TEST_LEAD_ID,
          userMessage: phaseTest.userMessage,
          aiResponse: phaseTest.aiResponse,
          currentPhase: phaseTest.phase,
          phaseInfo: phaseTest.phaseInfo
        });

        if (!result.success || result.current_phase !== phaseTest.phase) {
          allPassed = false;
          throw new Error(`Phase ${phaseTest.phase} progression failed`);
        }
      }

      this.addResult('Phase Progression (1-5)', allPassed, undefined, { finalPhase: 5 });
    } catch (error) {
      this.addResult('Phase Progression (1-5)', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async testScoreCalculation() {
    try {
      // Get final conversation memory to check score calculation
      const memory = await ConversationStateManager.getConversationMemory(TEST_CONVERSATION_ID);
      
      if (!memory) {
        throw new Error('Conversation memory not found');
      }

      const score = memory.qualification_score.score;
      const breakdown = memory.qualification_score.breakdown;

      // Score should be high since we progressed through all phases
      const expectedMinimumScore = 0.7; // Minimum expected for phase 5
      
      if (score < expectedMinimumScore) {
        throw new Error(`Score too low: ${score}, expected >= ${expectedMinimumScore}`);
      }

      if (!breakdown || !breakdown.phase_score || !breakdown.engagement_score || !breakdown.info_completeness) {
        throw new Error('Score breakdown missing components');
      }

      this.addResult('Score Calculation', true, undefined, {
        totalScore: score,
        breakdown: breakdown,
        phase: memory.current_phase
      });
    } catch (error) {
      this.addResult('Score Calculation', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async testDataRetrieval() {
    try {
      // Test different retrieval methods
      const memoryByConv = await ConversationStateManager.getConversationMemory(TEST_CONVERSATION_ID);
      const memoryByLead = await ConversationStateManager.getConversationMemoryByLead(TEST_LEAD_ID);
      
      if (!memoryByConv || !memoryByLead) {
        throw new Error('Memory retrieval failed');
      }

      if (memoryByConv.id !== memoryByLead.id) {
        throw new Error('Inconsistent memory retrieval between conversation and lead ID');
      }

      // Test high score conversations
      const highScoreConversations = await ConversationStateManager.getConversationsByScore(0.5, 1.0);
      
      const ourConversation = highScoreConversations.find(conv => conv.conversation_id === TEST_CONVERSATION_ID);
      if (!ourConversation) {
        throw new Error('Test conversation not found in high score results');
      }

      this.addResult('Data Retrieval', true, undefined, {
        memoryConsistency: true,
        foundInHighScore: true,
        totalHighScoreConversations: highScoreConversations.length
      });
    } catch (error) {
      this.addResult('Data Retrieval', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async testErrorHandling() {
    try {
      // Test with invalid conversation ID
      const invalidResult = await ConversationStateManager.updateConversationState({
        conversationId: 'invalid-uuid',
        leadId: 'invalid-uuid',
        userMessage: 'Test message',
        aiResponse: 'Test response',
        currentPhase: 1
      });

      // This should either succeed (create new) or fail gracefully
      const gracefulError = !invalidResult.success && invalidResult.error;
      
      // Test missing memory
      const missingMemory = await ConversationStateManager.getConversationMemory('non-existent-id');
      if (missingMemory !== null) {
        throw new Error('Should return null for non-existent conversation');
      }

      this.addResult('Error Handling', true, undefined, {
        invalidIdHandled: gracefulError || invalidResult.success,
        missingMemoryHandled: true
      });
    } catch (error) {
      this.addResult('Error Handling', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async testUICompatibility() {
    try {
      // Test that data structure is compatible with ConversationStateIndicator
      const memory = await ConversationStateManager.getConversationMemory(TEST_CONVERSATION_ID);
      
      if (!memory) {
        throw new Error('No memory to test UI compatibility');
      }

      // Check required fields for UI component
      const requiredFields = [
        'id', 'lead_id', 'conversation_id', 'current_phase',
        'qualification_score', 'conversation_summary', 'last_interaction'
      ];

      const missingFields = requiredFields.filter(field => !(field in memory));
      if (missingFields.length > 0) {
        throw new Error(`Missing required UI fields: ${missingFields.join(', ')}`);
      }

      // Check qualification_score structure
      const qScore = memory.qualification_score;
      if (!qScore.score || !qScore.breakdown || !qScore.last_update) {
        throw new Error('Invalid qualification_score structure for UI');
      }

      this.addResult('UI Compatibility', true, undefined, {
        allFieldsPresent: true,
        validScoreStructure: true,
        phase: memory.current_phase,
        score: qScore.score
      });
    } catch (error) {
      this.addResult('UI Compatibility', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async cleanup() {
    try {
      // Clean up test data
      const { error } = await supabase
        .from('conversation_memory')
        .delete()
        .eq('conversation_id', TEST_CONVERSATION_ID);

      if (error) throw error;
      
      this.addResult('Cleanup', true, undefined, { testDataRemoved: true });
    } catch (error) {
      this.addResult('Cleanup', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! Conversation tracking system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
      
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.testName}: ${r.error}`));
    }
    
    console.log('\n📋 Test Details:');
    this.results.forEach(r => {
      console.log(`\n${r.testName}:`);
      console.log(`  Status: ${r.passed ? 'PASSED' : 'FAILED'}`);
      if (r.error) console.log(`  Error: ${r.error}`);
      if (r.data) console.log(`  Data: ${JSON.stringify(r.data, null, 2)}`);
    });
  }
}

// Export for use in other scripts
export { ConversationTrackingTester };

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ConversationTrackingTester();
  tester.runAllTests().catch(console.error);
}