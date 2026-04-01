// Queue manager - handles analysis queue processing

import { AnalysisQueueConfig } from './types';

export class QueueManager {
  private analysisQueue: Set<string> = new Set();
  private priorityQueue: Set<string> = new Set();
  private currentlyProcessing: Set<string> = new Set();
  private activeAnalyses: Set<string> = new Set();
  private isRunning = false;
  private isProcessing = false;
  private analysisInterval: ReturnType<typeof setTimeout> | null = null;
  private config: AnalysisQueueConfig;

  constructor(config: AnalysisQueueConfig) {
    this.config = config;
  }

  start(processCallback: () => void) {
    if (this.isRunning) {
      console.log('Analysis service already running');
      return;
    }

    console.log('Starting analysis service...');
    this.isRunning = true;

    // Execute every check interval
    this.analysisInterval = setInterval(() => {
      console.log('Running scheduled analysis queue processing...');
      processCallback();
    }, this.config.checkInterval);

    // Execute immediately
    console.log('Running immediate analysis queue processing...');
    processCallback();
  }

  stop() {
    this.isRunning = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  addToQueue(conversationId: string, priority = false) {
    if (priority) {
      this.priorityQueue.add(conversationId);
      this.analysisQueue.delete(conversationId); // Remove from normal queue if present
    } else {
      this.analysisQueue.add(conversationId);
    }
  }

  removeFromQueues(conversationId: string) {
    this.priorityQueue.delete(conversationId);
    this.analysisQueue.delete(conversationId);
    this.currentlyProcessing.delete(conversationId);
    this.activeAnalyses.delete(conversationId);
  }

  isInQueue(conversationId: string): boolean {
    return (
      this.priorityQueue.has(conversationId) ||
      this.analysisQueue.has(conversationId) ||
      this.currentlyProcessing.has(conversationId)
    );
  }

  canProcess(): boolean {
    return this.isRunning && this.currentlyProcessing.size < this.config.maxConcurrentAnalyses;
  }

  markAsProcessing(conversationId: string) {
    this.currentlyProcessing.add(conversationId);
    this.activeAnalyses.add(conversationId);
  }

  markAsCompleted(conversationId: string) {
    this.removeFromQueues(conversationId);
  }

  getPriorityQueue(): string[] {
    return Array.from(this.priorityQueue);
  }

  getNormalQueue(): string[] {
    return Array.from(this.analysisQueue);
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.analysisQueue.size,
      priorityQueueSize: this.priorityQueue.size,
      activeAnalyses: this.activeAnalyses.size,
      maxConcurrent: this.config.maxConcurrentAnalyses,
      messageDelay: this.config.messageDelay,
    };
  }

  setProcessing(value: boolean) {
    this.isProcessing = value;
  }

  clearQueues() {
    this.analysisQueue.clear();
    this.priorityQueue.clear();
  }
}
