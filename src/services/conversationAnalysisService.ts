// Refactored conversation analysis service - modularized version
import { supabase } from '../lib/supabase';
import { analyzeConversation } from '../lib/ai-service';
import { detectIntent } from '../lib/intent-detector';
import { analyzeLeadProfile } from '../lib/lead-personalizer';

// Import modular components
import { AnalysisResult, ConversationMessage, ConversationData } from './analysis/types';
import { analyzeSentiments } from './analysis/sentimentAnalyzer';
import { generateEnrichedAnalysis } from './analysis/enrichmentService';
import { updateLeadFromAnalysis } from './analysis/leadUpdateService';
import { QueueManager } from './analysis/queueManager';

class ConversationAnalysisService {
  private queueManager: QueueManager;

  constructor() {
    this.queueManager = new QueueManager({
      messageDelay: 30 * 1000, // 30 seconds
      maxConcurrentAnalyses: 5,
      checkInterval: 10000, // 10 seconds
    });
  }

  // Start the analysis service
  start() {
    this.queueManager.start(() => this.processAnalysisQueue());
  }

  // Stop the service
  stop() {
    this.queueManager.stop();
  }

  // Process analysis queue with priority system
  private async processAnalysisQueue() {
    if (!this.queueManager.canProcess()) return;

    try {
      // Process priority queue first
      await this.processPriorityQueue();

      // Then process normal queue if capacity allows
      if (this.queueManager.canProcess()) {
        await this.processNormalQueue();
      }
    } catch (error) {
      console.error('Error in analysis queue processing:', error);
    }
  }

  // Process high priority conversations
  private async processPriorityQueue() {
    const priorityArray = this.queueManager.getPriorityQueue();

    for (const conversationId of priorityArray) {
      if (!this.queueManager.canProcess()) break;

      if (!this.queueManager.isInQueue(conversationId)) {
        this.queueManager.removeFromQueues(conversationId);
        this.analyzeConversation(conversationId, true); // No await - process in parallel
      }
    }
  }

  // Process normal queue
  private async processNormalQueue() {
    try {
      // Get conversations needing analysis
      const { data: conversationsNeedingAnalysis, error } = await supabase.rpc(
        'get_conversations_needing_analysis',
      );

      if (error) {
        console.error('Error getting conversations needing analysis:', error);
        return;
      }

      if (!conversationsNeedingAnalysis || conversationsNeedingAnalysis.length === 0) {
        console.log('📭 No conversations need analysis at this time');
        return;
      }

      console.log(
        `📋 Processing ${conversationsNeedingAnalysis.length} conversations from normal queue`,
      );

      // Process conversations not already in processing
      for (const conv of conversationsNeedingAnalysis) {
        if (!this.queueManager.canProcess()) break;

        const conversationId = conv.conversation_id;

        // Skip if already processing
        if (this.queueManager.isInQueue(conversationId)) {
          continue;
        }

        // Check if enough time has passed since last message
        const lastMessageTime = new Date(conv.last_message_at).getTime();
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        const { messageDelay } = this.queueManager.getStatus();

        if (timeSinceLastMessage >= messageDelay) {
          this.analyzeConversation(conversationId, false); // No await - process in parallel
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between starts
        }
      }
    } catch (error) {
      console.error('Error in normal queue processing:', error);
    }
  }

  // Analyze a specific conversation
  private async analyzeConversation(conversationId: string, isPriority = false) {
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversationId received:', conversationId);
      console.trace();
      return;
    }

    console.log(`Starting analysis for conversation: ${conversationId}, isPriority: ${isPriority}`);

    // Mark as processing
    this.queueManager.markAsProcessing(conversationId);

    try {
      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error(`Error fetching messages for ${conversationId}:`, messagesError);
        return;
      }

      if (!messages || messages.length === 0) {
        console.log(`No messages found for conversation ${conversationId}`);
        return;
      }

      console.log(`Found ${messages.length} messages for conversation ${conversationId}`);

      // Fetch conversation and lead data
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          leads (*)
        `)
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error(`Error fetching conversation ${conversationId}:`, convError);
        return;
      }

      if (!conversation) {
        console.error(`No conversation found for ${conversationId}`);
        return;
      }

      // Convert messages to proper type
      const typedMessages: ConversationMessage[] = messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender_type: msg.sender_type,
        created_at: msg.created_at,
      }));

      // Perform analyses
      const sentimentAnalysis = analyzeSentiments(typedMessages);

      // Analyze intent of last lead message
      const leadMessages = messages.filter(m => m.sender_type === 'lead');
      const lastLeadMessage = leadMessages[leadMessages.length - 1];
      const intent = lastLeadMessage ? detectIntent(lastLeadMessage.text, {
        conversationId,
        leadId: conversation.lead_id
      }) : null;

      // Analyze lead profile
      const leadProfile = analyzeLeadProfile(leadMessages.map(m => m.text), {
        leadId: conversation.lead_id
      });

      // Full conversation analysis
      console.log(`Calling analyzeConversation for ${conversationId}`);
      const conversationAnalysis = await analyzeConversation({
        conversationId,
        leadId: conversation.lead_id,
        messages: messages.map(m => ({
          role: m.sender_type === 'lead' ? 'user' : 'assistant',
          content: m.text
        })),
        forceReanalyze: true,
      });

      if (!conversationAnalysis.success) {
        console.log(
          `ConversationAnalyzer failed for ${conversationId}: ${conversationAnalysis.error}`,
        );
        return;
      }

      console.log(`ConversationAnalyzer successful for ${conversationId}`);

      // Generate enriched analysis with AI
      const enrichedAnalysis = await generateEnrichedAnalysis(
        typedMessages,
        conversation as ConversationData,
        null, // Memory not available from new AI service
        intent,
        leadProfile,
      );

      // Save analysis result
      const analysisResult: AnalysisResult = {
        conversation_id: conversationId,
        lead_id: conversation.lead_id,
        analysis_data: enrichedAnalysis.analysis_data,
        sentiment_scores: sentimentAnalysis as any,
        phase_progress: enrichedAnalysis.phase_progress,
        key_insights: enrichedAnalysis.key_insights,
        warnings: enrichedAnalysis.warnings,
        action_threads: enrichedAnalysis.action_threads,
        urgency_score: Math.round(intent?.urgencyLevel || 5),
        capacity_score: Math.round(0.5 * 10), // Default score during migration
        engagement_score: Math.round(0.5 * 10), // Default score during migration
      };

      // Save to database
      const { error: saveError } = await supabase
        .from('conversation_analysis')
        .insert(analysisResult);

      if (saveError) {
        console.error('Error saving analysis:', saveError);
        return;
      }

      console.log(`✅ Analysis saved for conversation ${conversationId}`);

      // Update lead with analysis info
      await updateLeadFromAnalysis(
        conversation.lead_id,
        enrichedAnalysis,
        conversationAnalysis,
      );

      // Update last analyzed timestamp if priority
      if (isPriority) {
        await supabase
          .from('conversations')
          .update({
            last_analyzed_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
    } finally {
      // Always mark as completed
      this.queueManager.markAsCompleted(conversationId);
    }
  }

  // Public methods for external use
  async startBackgroundAnalysis() {
    console.log('🚀 Starting background conversation analysis service...');
    const status = this.queueManager.getStatus();
    console.log(`⚙️ Configuration: 
      - Message delay: ${status.messageDelay / 1000}s
      - Max concurrent analyses: ${status.maxConcurrent}
      - Check interval: 10s
      - Queue wait time: 2-10s`);

    this.queueManager.setProcessing(true);
    this.start();
    this.processQueue();
  }

  stopBackgroundAnalysis() {
    console.log('Stopping background conversation analysis...');
    this.queueManager.setProcessing(false);
    this.queueManager.clearQueues();
    this.stop();
  }

  private async processQueue() {
    const status = this.queueManager.getStatus();
    
    while (status.isProcessing) {
      try {
        // Check for conversations needing analysis
        const { data: conversations, error } = await supabase
          .rpc('get_conversations_needing_analysis')
          .limit(50);

        if (error) {
          console.error('Error fetching conversations for analysis:', error);
        } else if (conversations && conversations.length > 0) {
          console.log(`📊 Found ${conversations.length} conversations needing analysis`);

          // Add to queue
          for (const conv of conversations) {
            this.queueManager.addToQueue(conv.conversation_id);
          }
        }

        // Process queues
        await this.processAnalysisQueue();

        // Wait before next check
        const waitTime = 
          status.queueSize === 0 && status.priorityQueueSize === 0 ? 10000 : 2000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error) {
        console.error('Error in background analysis process:', error);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  prioritizeConversation(conversationId: string) {
    this.queueManager.addToQueue(conversationId, true);
    console.log(`Prioritized conversation ${conversationId} for analysis`);
  }

  async refreshAnalysis(conversationId: string): Promise<AnalysisResult | null> {
    if (!conversationId) {
      console.error('Cannot refresh analysis: conversationId is undefined');
      return null;
    }

    this.queueManager.markAsProcessing(conversationId);

    try {
      await this.analyzeConversation(conversationId, true);

      // Fetch the analysis result
      const { data: analysis } = await supabase
        .from('conversation_analysis')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      return analysis as AnalysisResult;
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      return null;
    } finally {
      this.queueManager.markAsCompleted(conversationId);
    }
  }

  getAnalysisStatus() {
    const status = this.queueManager.getStatus();
    
    console.log(`📈 Analysis Service Status:
      - Processing: ${status.isProcessing ? '✅' : '❌'}
      - Priority Queue: ${status.priorityQueueSize} conversations
      - Normal Queue: ${status.queueSize} conversations
      - Active Analyses: ${status.activeAnalyses}/${status.maxConcurrent}
      - Message Delay: ${status.messageDelay / 1000}s`);

    return status;
  }
}

// Export singleton instance
export const conversationAnalysisService = new ConversationAnalysisService();