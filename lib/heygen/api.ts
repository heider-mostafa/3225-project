import { HeyGenSession, AgentType } from './types';

export class HeyGenAPI {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || '';
    this.apiUrl = process.env.HEYGEN_API_URL || 'https://api.heygen.com/v1';
  }

  async createVideoSession(propertyId: string, agentType: AgentType): Promise<HeyGenSession> {
    const response = await fetch(`${this.apiUrl}/video/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_id: this.getAvatarId(agentType),
        voice_id: this.getVoiceId(agentType),
        property_id: propertyId,
        agent_type: agentType,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create HeyGen session');
    }

    return response.json();
  }

  async generatePropertyVideo(propertyId: string, script: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script,
        property_id: propertyId,
        video_settings: {
          resolution: '1080p',
          format: 'mp4',
          duration: '60s',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate property video');
    }

    const data = await response.json();
    return data.video_url;
  }

  private getAvatarId(agentType: AgentType): string {
    const avatarMap = {
      financial: process.env.HEYGEN_AVATAR_FINANCIAL,
      legal: process.env.HEYGEN_AVATAR_LEGAL,
      condition: process.env.HEYGEN_AVATAR_CONDITION,
      location: process.env.HEYGEN_AVATAR_LOCATION,
      scheduling: process.env.HEYGEN_AVATAR_SCHEDULING,
      general: process.env.HEYGEN_AVATAR_GENERAL,
    };
    return avatarMap[agentType] || '';
  }

  private getVoiceId(agentType: AgentType): string {
    const voiceMap = {
      financial: process.env.HEYGEN_VOICE_FINANCIAL,
      legal: process.env.HEYGEN_VOICE_LEGAL,
      condition: process.env.HEYGEN_VOICE_CONDITION,
      location: process.env.HEYGEN_VOICE_LOCATION,
      scheduling: process.env.HEYGEN_VOICE_SCHEDULING,
      general: process.env.HEYGEN_VOICE_GENERAL,
    };
    return voiceMap[agentType] || '';
  }
}