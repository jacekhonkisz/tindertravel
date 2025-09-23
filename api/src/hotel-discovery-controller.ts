import { GlobalLuxuryHotelFetcher } from './global-luxury-hotel-fetcher';
import { DatabaseService } from './database';

interface DiscoverySession {
  id: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  progress: any;
  config: DiscoveryConfig;
}

interface DiscoveryConfig {
  targetCount: number;
  continents: string[];
  skipExisting: boolean;
  batchSize: number;
  qualityThreshold: {
    minPhotos: number;
    minRating: number;
  };
}

export class HotelDiscoveryController {
  private fetcher: GlobalLuxuryHotelFetcher;
  private databaseService: DatabaseService;
  private currentSession: DiscoverySession | null = null;
  private sessions: Map<string, DiscoverySession> = new Map();

  constructor() {
    this.fetcher = new GlobalLuxuryHotelFetcher();
    this.databaseService = new DatabaseService();
  }

  /**
   * Start a new hotel discovery session
   */
  async startDiscovery(config: Partial<DiscoveryConfig> = {}): Promise<string> {
    if (this.currentSession && this.currentSession.status === 'running') {
      throw new Error('A discovery session is already running. Stop it first or wait for completion.');
    }

    const sessionId = `discovery_${Date.now()}`;
    const fullConfig: DiscoveryConfig = {
      targetCount: 1000,
      continents: ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'],
      skipExisting: true,
      batchSize: 20,
      qualityThreshold: {
        minPhotos: 4,
        minRating: 4.0
      },
      ...config
    };

    this.currentSession = {
      id: sessionId,
      status: 'running',
      startTime: new Date(),
      progress: null,
      config: fullConfig
    };

    this.sessions.set(sessionId, this.currentSession);

    console.log(`🚀 Starting hotel discovery session: ${sessionId}`);
    console.log(`📋 Configuration:`, fullConfig);

    // Start the discovery process (non-blocking)
    this.runDiscoverySession(sessionId, fullConfig).catch(error => {
      console.error(`❌ Discovery session ${sessionId} failed:`, error);
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession.status = 'failed';
        this.currentSession.endTime = new Date();
      }
    });

    return sessionId;
  }

  /**
   * Stop the current discovery session
   */
  async stopDiscovery(): Promise<boolean> {
    if (!this.currentSession || this.currentSession.status !== 'running') {
      return false;
    }

    console.log(`⏹️ Stopping discovery session: ${this.currentSession.id}`);
    this.currentSession.status = 'paused';
    this.currentSession.endTime = new Date();
    
    return true;
  }

  /**
   * Get current session status
   */
  getCurrentSession(): DiscoverySession | null {
    return this.currentSession;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): DiscoverySession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): DiscoverySession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStats(): Promise<{
    totalHotels: number;
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    lastUpdate: Date;
  }> {
    const totalHotels = await this.getTotalHotelsInDatabase();
    const sessions = Array.from(this.sessions.values());
    
    return {
      totalHotels,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'running').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      lastUpdate: new Date()
    };
  }

  /**
   * Run the actual discovery session
   */
  private async runDiscoverySession(sessionId: string, config: DiscoveryConfig): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      console.log(`🔍 Running discovery with config:`, config);
      
      const progress = await this.fetcher.fetchGlobalLuxuryHotels({
        targetCount: config.targetCount,
        continents: config.continents,
        skipExisting: config.skipExisting,
        batchSize: config.batchSize
      });

      // Update session with final results
      session.progress = progress;
      session.status = 'completed';
      session.endTime = new Date();

      console.log(`✅ Discovery session ${sessionId} completed successfully`);
      console.log(`📊 Final stats: ${progress.totalHotelsStored} hotels stored`);

    } catch (error) {
      console.error(`❌ Discovery session ${sessionId} failed:`, error);
      session.status = 'failed';
      session.endTime = new Date();
      throw error;
    }
  }

  /**
   * Get total hotels in database
   */
  private async getTotalHotelsInDatabase(): Promise<number> {
    try {
      const result = await this.databaseService.getHotels({ limit: 1 });
      return result.total;
    } catch (error) {
      console.error('Failed to get hotel count:', error);
      return 0;
    }
  }

  /**
   * Get live progress for current session
   */
  getLiveProgress(): any {
    if (!this.currentSession || this.currentSession.status !== 'running') {
      return null;
    }

    return this.fetcher.getProgress();
  }

  /**
   * Validate discovery configuration
   */
  validateConfig(config: Partial<DiscoveryConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.targetCount && (config.targetCount < 1 || config.targetCount > 5000)) {
      errors.push('Target count must be between 1 and 5000');
    }

    if (config.batchSize && (config.batchSize < 1 || config.batchSize > 100)) {
      errors.push('Batch size must be between 1 and 100');
    }

    if (config.continents && config.continents.length === 0) {
      errors.push('At least one continent must be selected');
    }

    if (config.qualityThreshold) {
      if (config.qualityThreshold.minPhotos < 1 || config.qualityThreshold.minPhotos > 20) {
        errors.push('Minimum photos must be between 1 and 20');
      }
      if (config.qualityThreshold.minRating < 1 || config.qualityThreshold.minRating > 5) {
        errors.push('Minimum rating must be between 1 and 5');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get recommended configuration based on current database state
   */
  async getRecommendedConfig(): Promise<DiscoveryConfig> {
    const stats = await this.getDiscoveryStats();
    
    // Adjust target count based on existing hotels
    let targetCount = 1000;
    if (stats.totalHotels > 500) {
      targetCount = Math.max(200, 1000 - stats.totalHotels);
    }

    // Adjust batch size based on system load
    const batchSize = stats.activeSessions > 0 ? 10 : 20;

    return {
      targetCount,
      continents: ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'],
      skipExisting: true,
      batchSize,
      qualityThreshold: {
        minPhotos: 4,
        minRating: 4.0
      }
    };
  }

  /**
   * Export discovery results
   */
  async exportResults(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      session: {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        config: session.config
      },
      progress: session.progress,
      exportTime: new Date()
    };
  }
} 