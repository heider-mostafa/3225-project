export type AgentType = 'financial' | 'legal' | 'condition' | 'location' | 'scheduling' | 'general';

export interface HeyGenSession {
  session_id: string;
  access_token: string;
  agent_type: AgentType;
  property_id: string;
  websocket_url: string;
  expires_at: string;
} 