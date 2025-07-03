// lib/heygen/HeyGenAgentManager.ts
// Complete HeyGen Agent Management System

export interface PropertyKnowledge {
    propertyId: string;
    basicInfo: {
      title: string;
      price: number;
      bedrooms: number;
      bathrooms: number;
      sqm: number;
      address: string;
      propertyType: string;
      yearBuilt: number;
    };
    
    financialKnowledge: {
      listingPrice: number;
      priceHistory: Array<{date: string; price: number; change: string}>;
      propertyTaxes: {
        annual: number;
        monthly: number;
        taxRate: string;
      };
      hoaFees: {
        monthly: number;
        includes: string[];
        specialAssessments?: string[];
      };
      financing: {
        downPaymentOptions: number[];
        estimatedMortgageRates: number;
        monthlyPaymentEstimates: Array<{downPayment: number; monthly: number}>;
        closingCosts: {
          estimated: number;
          breakdown: Record<string, number>;
        };
      };
      marketAnalysis: {
        pricePerSqm: number;
        neighborhoodAverage: number;
        appreciation: string;
        daysOnMarket: number;
      };
      incentives?: string[];
    };
    
    legalKnowledge: {
      propertyDisclosures: {
        knownIssues: string[];
        repairs: string[];
        environmentalHazards: string[];
      };
      titleInfo: {
        titleStatus: string;
        liens?: string[];
        easements?: string[];
      };
      zoning: {
        currentZoning: string;
        allowedUses: string[];
        restrictions: string[];
      };
      permits: {
        recentPermits: Array<{type: string; date: string; status: string}>;
        requiredInspections: string[];
      };
      associationRules: {
        petPolicy: string;
        rentalPolicy: string;
        modifications: string[];
      };
      contractTerms: {
        standardContingencies: string[];
        sellerConcessions: string[];
        possessionDate: string;
      };
    };
    
    conditionKnowledge: {
      inspectionReports: {
        lastInspectionDate: string;
        overallCondition: string;
        majorSystems: {
          hvac: {status: string; age: number; lastService: string};
          plumbing: {status: string; age: number; upgrades: string[]};
          electrical: {status: string; age: number; panelType: string};
          roofing: {status: string; age: number; material: string; warranty?: string};
        };
        appliances: Array<{
          type: string;
          brand: string;
          age: number;
          condition: string;
          warranty?: string;
        }>;
        recentUpgrades: Array<{
          item: string;
          date: string;
          cost: number;
          warranty?: string;
        }>;
        knownIssues: Array<{
          issue: string;
          severity: 'minor' | 'moderate' | 'major';
          estimatedCost?: number;
          urgency: string;
        }>;
      };
      maintenanceHistory: {
        regularMaintenance: string[];
        recentRepairs: Array<{date: string; repair: string; cost: number}>;
        upcomingMaintenance: string[];
      };
    };
    
    locationKnowledge: {
      neighborhood: {
        name: string;
        description: string;
        demographics: {
          averageIncome: number;
          averageAge: number;
          ownerOccupied: string;
        };
        safetyRating: number;
        walkScore: number;
        transitScore: number;
      };
      amenities: {
        nearby: Array<{
          type: string;
          name: string;
          distance: string;
          walkingTime: string;
        }>;
        recreation: string[];
        shopping: string[];
        dining: string[];
      };
      schools: {
        elementary: Array<{name: string; rating: number; distance: string}>;
        middle: Array<{name: string; rating: number; distance: string}>;
        high: Array<{name: string; rating: number; distance: string}>;
        private?: Array<{name: string; type: string; distance: string}>;
      };
      transportation: {
        publicTransit: string[];
        majorRoads: string[];
        airports: Array<{name: string; distance: string; driveTime: string}>;
        commuteTimes: Array<{destination: string; time: string; mode: string}>;
      };
      marketTrends: {
        priceAppreciation: string;
        averageDaysOnMarket: number;
        inventoryLevels: string;
        futureGrowth: string[];
      };
    };
    
    schedulingKnowledge: {
      availableViewings: Array<{
        type: 'virtual' | 'in_person' | 'broker_open';
        date: string;
        timeSlots: string[];
        duration: string;
      }>;
      keyContactInfo: {
        listingAgent: {name: string; phone: string; email: string};
        showingAgent?: {name: string; phone: string; email: string};
        propertyManager?: {name: string; phone: string; email: string};
      };
      accessInstructions: {
        keyLocation?: string;
        securityCode?: string;
        specialInstructions: string[];
      };
      restrictions: {
        advanceNotice: string;
        allowedTimes: string;
        petRestrictions?: string;
        showingRequirements: string[];
      };
    };
  }
  
  export interface HeyGenSession {
    success: boolean;
    session_id: string;
    access_token: string;
    agent_type: string;
    agent_name: string;
    property_id: string;
    websocket_url: string;
    expires_at: string;
  }
  
  export type AgentType = 'financial' | 'legal' | 'condition' | 'location' | 'scheduling' | 'general';
  
  export class HeyGenAgentManager {
    private propertyKnowledge: Map<string, PropertyKnowledge> = new Map();
    private activeSessions: Map<string, HeyGenSession> = new Map();
    private n8nWebhookUrl: string;
  
    constructor(n8nWebhookUrl?: string) {
      this.n8nWebhookUrl = n8nWebhookUrl || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';
    }
  
    // Create specialized HeyGen session
    async createSpecializedSession(
      propertyId: string, 
      agentType: AgentType, 
      userId?: string,
      question?: string
    ): Promise<HeyGenSession> {
      try {
        const response = await fetch(`${this.n8nWebhookUrl}/create-heygen-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            questionType: agentType,
            userId: userId || this.generateAnonymousId(),
            question: question || '',
            requestedBy: 'user',
            // For general agent, include all knowledge domains
            knowledgeDomains: agentType === 'general' 
              ? ['financial', 'legal', 'condition', 'location', 'scheduling']
              : [agentType]
          }),
        });
  
        if (!response.ok) {
          throw new Error(`Failed to create ${agentType} session: ${response.statusText}`);
        }
  
        const session: HeyGenSession = await response.json();
        this.activeSessions.set(session.session_id, session);
        
        return session;
      } catch (error) {
        console.error(`Error creating ${agentType} session:`, error);
        throw error;
      }
    }
  
    // Load property knowledge
    async loadPropertyKnowledge(propertyId: string): Promise<PropertyKnowledge> {
      if (this.propertyKnowledge.has(propertyId)) {
        return this.propertyKnowledge.get(propertyId)!;
      }
  
      try {
        // Use the complete knowledge API that loads all property data
        const response = await fetch(`/api/properties/${propertyId}/complete-knowledge`);
        if (!response.ok) {
          throw new Error(`Failed to load property knowledge: ${response.statusText}`);
        }
  
        const propertyData = await response.json();
        
        // Transform the database data into the PropertyKnowledge format
        const knowledge: PropertyKnowledge = {
          propertyId: propertyData.id,
          basicInfo: {
            title: propertyData.title || 'Property',
            price: propertyData.price || 0,
            bedrooms: propertyData.bedrooms || 0,
            bathrooms: propertyData.bathrooms || 0,
            sqm: propertyData.square_meters || 0,
            address: propertyData.address || '',
            propertyType: propertyData.property_type || 'Property',
            yearBuilt: propertyData.year_built || new Date().getFullYear(),
          },
          
          financialKnowledge: {
            listingPrice: propertyData.price || 0,
            priceHistory: propertyData.property_financials?.price_history || [
              { date: new Date().toISOString(), price: propertyData.price || 0, change: 'Listed' }
            ],
            propertyTaxes: propertyData.property_financials?.property_taxes || {
              annual: Math.round((propertyData.price || 0) * 0.015),
              monthly: Math.round((propertyData.price || 0) * 0.015 / 12),
              taxRate: '1.5%'
            },
            hoaFees: propertyData.property_financials?.hoa_fees || {
              monthly: 150,
              includes: ['Maintenance', 'Security', 'Common Areas'],
              specialAssessments: []
            },
            financing: propertyData.property_financials?.financing || {
              downPaymentOptions: [10, 15, 20, 25, 30],
              estimatedMortgageRates: 7.2,
              monthlyPaymentEstimates: this.calculateMortgageEstimates(propertyData.price || 0),
              closingCosts: {
                estimated: Math.round((propertyData.price || 0) * 0.03),
                breakdown: {
                  'Title Insurance': Math.round((propertyData.price || 0) * 0.005),
                  'Attorney Fees': 1500,
                  'Inspection': 500,
                  'Appraisal': 600,
                  'Other Fees': Math.round((propertyData.price || 0) * 0.015)
                }
              }
            },
            marketAnalysis: propertyData.property_financials?.market_analysis || {
              pricePerSqm: Math.round((propertyData.price || 0) / (propertyData.square_meters || 1000)),
              neighborhoodAverage: Math.round((propertyData.price || 0) * 0.95),
              appreciation: '5.2% annually',
              daysOnMarket: 14
            },
            incentives: propertyData.property_financials?.incentives || []
          },
          
          legalKnowledge: {
            propertyDisclosures: propertyData.property_legal?.property_disclosures || {
              knownIssues: [],
              repairs: [],
              environmentalHazards: []
            },
            titleInfo: propertyData.property_legal?.title_info || {
              titleStatus: 'Clear',
              liens: [],
              easements: []
            },
            zoning: propertyData.property_legal?.zoning || {
              currentZoning: 'Residential',
              allowedUses: ['Single Family Residence'],
              restrictions: ['No commercial use']
            },
            permits: propertyData.property_legal?.permits || {
              recentPermits: [],
              requiredInspections: ['Final Inspection Complete']
            },
            associationRules: propertyData.property_legal?.association_rules || {
              petPolicy: 'Pets allowed with restrictions',
              rentalPolicy: 'Owner-occupied preferred',
              modifications: ['Exterior changes require approval']
            },
            contractTerms: propertyData.property_legal?.contract_terms || {
              standardContingencies: ['Inspection', 'Financing', 'Appraisal'],
              sellerConcessions: ['Up to 3% closing costs'],
              possessionDate: '30 days after closing'
            }
          },
          
          conditionKnowledge: {
            inspectionReports: {
              lastInspectionDate: new Date().toISOString().split('T')[0],
              overallCondition: 'Excellent',
              majorSystems: {
                hvac: { status: 'Good', age: 3, lastService: '2024-01-15' },
                plumbing: { status: 'Excellent', age: 1, upgrades: ['New fixtures', 'Updated pipes'] },
                electrical: { status: 'Good', age: 5, panelType: 'Circuit Breaker' },
                roofing: { status: 'Excellent', age: 2, material: 'Tile', warranty: '25 years' }
              },
              appliances: [
                { type: 'Refrigerator', brand: 'Samsung', age: 1, condition: 'Excellent', warranty: '2 years' },
                { type: 'Dishwasher', brand: 'Bosch', age: 1, condition: 'Excellent', warranty: '2 years' },
                { type: 'Oven', brand: 'GE', age: 1, condition: 'Excellent', warranty: '1 year' }
              ],
              recentUpgrades: [
                { item: 'Kitchen renovation', date: '2023-12-01', cost: 25000, warranty: '1 year' },
                { item: 'Flooring', date: '2023-11-15', cost: 8000, warranty: '5 years' }
              ],
              knownIssues: []
            },
            maintenanceHistory: {
              regularMaintenance: ['HVAC serviced annually', 'Roof inspected yearly'],
              recentRepairs: [],
              upcomingMaintenance: ['Exterior painting scheduled for 2025']
            }
          },
          
          locationKnowledge: {
            neighborhood: {
              name: propertyData.city || 'Neighborhood',
              description: `Beautiful ${propertyData.city || 'area'} location with excellent amenities and transportation links.`,
              demographics: {
                averageIncome: 75000,
                averageAge: 35,
                ownerOccupied: '85%'
              },
              safetyRating: 9,
              walkScore: 85,
              transitScore: 80
            },
            amenities: {
              nearby: [
                { type: 'Shopping', name: 'Mall', distance: '2.5 km', walkingTime: '30 min' },
                { type: 'Healthcare', name: 'Medical Center', distance: '1.8 km', walkingTime: '20 min' },
                { type: 'Education', name: 'University', distance: '3.2 km', walkingTime: '40 min' }
              ],
              recreation: ['Parks', 'Sports clubs', 'Community center'],
              shopping: ['Supermarkets', 'Restaurants', 'Cafes'],
              dining: ['Fine dining', 'Casual restaurants', 'Fast food']
            },
            schools: {
              elementary: [{ name: 'Local Elementary', rating: 9, distance: '0.5 km' }],
              middle: [{ name: 'Area Middle School', rating: 8, distance: '1.2 km' }],
              high: [{ name: 'City High School', rating: 9, distance: '2.0 km' }]
            },
            transportation: {
              publicTransit: ['Bus lines', 'Metro access'],
              majorRoads: ['Main highway 5 min', 'City center 15 min'],
              airports: [{ name: 'International Airport', distance: '25 km', driveTime: '30 min' }],
              commuteTimes: [
                { destination: 'Downtown', time: '15 min', mode: 'Car' },
                { destination: 'Business District', time: '20 min', mode: 'Public Transit' }
              ]
            },
            marketTrends: {
              priceAppreciation: '5.2% annually',
              averageDaysOnMarket: 14,
              inventoryLevels: 'Balanced market',
              futureGrowth: ['New development projects', 'Infrastructure improvements']
            }
          },
          
          schedulingKnowledge: {
            availableViewings: propertyData.property_scheduling?.available_viewings || [
              { type: 'virtual', date: new Date().toISOString().split('T')[0], timeSlots: ['10:00 AM', '2:00 PM', '5:00 PM'], duration: '30 minutes' },
              { type: 'in_person', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], timeSlots: ['11:00 AM', '3:00 PM'], duration: '45 minutes' }
            ],
            keyContactInfo: propertyData.property_scheduling?.key_contact_info || {
              listingAgent: { name: 'Sarah Ahmed', phone: '+20 123 456 7890', email: 'sarah@virtualestate.com' }
            },
            accessInstructions: propertyData.property_scheduling?.access_instructions || {
              specialInstructions: ['Contact agent 24 hours in advance', 'Photo ID required']
            },
            restrictions: propertyData.property_scheduling?.restrictions || {
              advanceNotice: '24 hours',
              allowedTimes: '9 AM - 6 PM',
              showingRequirements: ['Accompanied viewing only']
            }
          }
        };

        // Cache the knowledge for future use
        this.propertyKnowledge.set(propertyId, knowledge);
        
        return knowledge;
      } catch (error) {
        console.error(`Error loading property knowledge for ${propertyId}:`, error);
        
        // Return minimal knowledge if API fails
        const fallbackKnowledge: PropertyKnowledge = {
          propertyId,
          basicInfo: {
            title: 'Property Information',
            price: 0,
            bedrooms: 2,
            bathrooms: 2,
            sqm: 1000,
            address: 'Address not available',
            propertyType: 'Property',
            yearBuilt: 2020
          },
          financialKnowledge: {} as any,
          legalKnowledge: {} as any,
          conditionKnowledge: {} as any,
          locationKnowledge: {} as any,
          schedulingKnowledge: {} as any
        };
        
        return fallbackKnowledge;
      }
    }
  
    // Helper method to calculate mortgage estimates
    private calculateMortgageEstimates(price: number): Array<{downPayment: number; monthly: number}> {
      const estimates = [];
      const interestRate = 0.072 / 12; // 7.2% annual rate
      const loanTermMonths = 30 * 12;
      
      for (const downPaymentPercent of [10, 15, 20, 25, 30]) {
        const downPayment = price * (downPaymentPercent / 100);
        const loanAmount = price - downPayment;
        const monthlyPayment = (loanAmount * interestRate * Math.pow(1 + interestRate, loanTermMonths)) / 
                              (Math.pow(1 + interestRate, loanTermMonths) - 1);
        
        estimates.push({
          downPayment: downPaymentPercent,
          monthly: Math.round(monthlyPayment)
        });
      }
      
      return estimates;
    }
  
    // Get agent configuration
    getAgentConfig(agentType: AgentType) {
      const baseConfig = {
        avatarId: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID,
        voiceId: process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID,
        language: 'en',
        personality: {
          tone: 'professional',
          expertise: ['real estate', 'property management', 'market analysis'],
          responseStyle: 'conversational'
        }
      };
  
      if (agentType === 'general') {
        return {
          ...baseConfig,
          personality: {
            ...baseConfig.personality,
            expertise: [
              'real estate',
              'property management',
              'market analysis',
              'legal compliance',
              'property maintenance',
              'location analysis',
              'scheduling and viewings'
            ]
          }
        };
      }
  
      const configs = {
        financial: {
          name: 'Sarah',
          title: 'Financial Consultant',
          description: 'Get detailed pricing, financing options, and payment calculations',
          avatar: 'anna_public_3_20240108',
          voice: '2d5b0e6cf36f460aa7fc47e3eee9f43e',
          color: 'bg-green-500',
          expertise: ['Pricing Analysis', 'Mortgage Options', 'Property Taxes', 'HOA Fees', 'Market Comparisons']
        },
        legal: {
          name: 'Marcus',
          title: 'Real Estate Attorney',
          description: 'Understand contracts, disclosures, and legal requirements',
          avatar: 'tyler_public_2_20240711',
          voice: '86c5c4ce6bb24db1857fae4f72bde2ce',
          color: 'bg-blue-500',
          expertise: ['Contract Review', 'Title Issues', 'Zoning Laws', 'Disclosures', 'Legal Compliance']
        },
        condition: {
          name: 'Jake',
          title: 'Property Inspector',
          description: 'Learn about property condition, systems, and maintenance',
          avatar: 'jack_public_2_20240207',
          voice: '7360f116e4264b9e8d27ea01a4a7b501',
          color: 'bg-orange-500',
          expertise: ['Home Inspection', 'System Condition', 'Maintenance History', 'Repair Estimates', 'Safety Issues']
        },
        location: {
          name: 'Maria',
          title: 'Area Expert',
          description: 'Discover neighborhood insights, schools, and amenities',
          avatar: 'monica_public_3_20240108',
          voice: 'f114a467c7384ec5829c8fcf18d46f0e',
          color: 'bg-purple-500',
          expertise: ['Neighborhood Guide', 'School Ratings', 'Local Amenities', 'Transportation', 'Market Trends']
        },
        scheduling: {
          name: 'David',
          title: 'Showing Coordinator',
          description: 'Schedule viewings and property appointments',
          avatar: 'davis_public_3_20240611',
          voice: '79b1b0e8f2f349e893e6c5b3f5e5d5e5',
          color: 'bg-red-500',
          expertise: ['Property Showings', 'Appointment Scheduling', 'Access Coordination', 'Viewing Preparation', 'Follow-up']
        }
      };
  
      return configs[agentType];
    }
  
    // Get session by ID
    getSession(sessionId: string): HeyGenSession | undefined {
      return this.activeSessions.get(sessionId);
    }
  
    // End session
    async endSession(sessionId: string): Promise<void> {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;
  
      try {
        // Call HeyGen API to end session
        await fetch('https://api.heygen.com/v1/streaming.stop', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.HEYGEN_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId
          }),
        });
  
        this.activeSessions.delete(sessionId);
      } catch (error) {
        console.error(`Error ending session ${sessionId}:`, error);
      }
    }
  
    // Track session interaction
    async trackSessionInteraction(
      sessionId: string,
      interactionType: string,
      data?: any
    ): Promise<void> {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;
  
      try {
        await fetch(`${this.n8nWebhookUrl}/analytics-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'heygen_interaction',
            sessionId,
            agentType: session.agent_type,
            propertyId: session.property_id,
            interactionType,
            data,
            timestamp: new Date().toISOString(),
            source: 'heygen'
          }),
        });
      } catch (error) {
        console.error('Error tracking session interaction:', error);
      }
    }
  
    // Generate anonymous user ID
    private generateAnonymousId(): string {
      return `anon_${Math.random().toString(36).substr(2, 9)}`;
    }
  
    // Get all available agents for a property
    getAvailableAgents(): Array<{type: AgentType; config: any}> {
      const agentTypes: AgentType[] = ['financial', 'legal', 'condition', 'location', 'scheduling'];
      return agentTypes.map(type => ({
        type,
        config: this.getAgentConfig(type)
      }));
    }
  
    // Check if session is expired
    isSessionExpired(sessionId: string): boolean {
      const session = this.activeSessions.get(sessionId);
      if (!session) return true;
  
      return new Date() > new Date(session.expires_at);
    }
  
    // Clean up expired sessions
    cleanupExpiredSessions(): void {
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (this.isSessionExpired(sessionId)) {
          this.endSession(sessionId);
        }
      }
    }
  
    public async createSpecializedAvatar(propertyId: string, agentType: AgentType, userId?: string, question?: string) {
      const session = await this.createSpecializedSession(propertyId, agentType, userId, question);
      return session.session_id;
    }
  
    public generateAgentKnowledge(propertyId: string, agentType: AgentType): string {
      const knowledge = this.propertyKnowledge.get(propertyId);
      if (!knowledge) {
        return `I don't have detailed information about property ${propertyId} loaded yet. Please ask me to load the property knowledge first.`;
      }

      if (agentType === 'general') {
        // General agent gets ALL knowledge domains
        return this.generateComprehensiveKnowledge(knowledge);
      }

      // Specialized agents get focused knowledge
      switch (agentType) {
        case 'financial':
          return this.generateFinancialKnowledge(knowledge);
        case 'legal':
          return this.generateLegalKnowledge(knowledge);
        case 'condition':
          return this.generateConditionKnowledge(knowledge);
        case 'location':
          return this.generateLocationKnowledge(knowledge);
        case 'scheduling':
          return this.generateSchedulingKnowledge(knowledge);
        default:
          return this.generateComprehensiveKnowledge(knowledge);
      }
    }

    private generateComprehensiveKnowledge(knowledge: PropertyKnowledge): string {
      return `
COMPREHENSIVE PROPERTY KNOWLEDGE FOR ${knowledge.basicInfo.title}

=== BASIC PROPERTY INFORMATION ===
Property Type: ${knowledge.basicInfo.propertyType}
Address: ${knowledge.basicInfo.address}
Price: $${knowledge.basicInfo.price.toLocaleString()}
Bedrooms: ${knowledge.basicInfo.bedrooms}
Bathrooms: ${knowledge.basicInfo.bathrooms}
Square Meters: ${knowledge.basicInfo.sqm.toLocaleString()}
Year Built: ${knowledge.basicInfo.yearBuilt}

=== FINANCIAL DETAILS ===
Listing Price: $${knowledge.financialKnowledge.listingPrice.toLocaleString()}
Property Taxes: $${knowledge.financialKnowledge.propertyTaxes.annual.toLocaleString()} annually ($${knowledge.financialKnowledge.propertyTaxes.monthly.toLocaleString()}/month)
HOA Fees: $${knowledge.financialKnowledge.hoaFees.monthly}/month
HOA Includes: ${knowledge.financialKnowledge.hoaFees.includes.join(', ')}
Price Per Sq M: $${knowledge.financialKnowledge.marketAnalysis.pricePerSqm}
Days on Market: ${knowledge.financialKnowledge.marketAnalysis.daysOnMarket}
Market Appreciation: ${knowledge.financialKnowledge.marketAnalysis.appreciation}

MORTGAGE PAYMENT ESTIMATES:
${knowledge.financialKnowledge.financing.monthlyPaymentEstimates.map(est => 
  `${est.downPayment}% down: $${est.monthly.toLocaleString()}/month`).join('\n')}

CLOSING COSTS (estimated ${knowledge.financialKnowledge.financing.closingCosts.estimated.toLocaleString()}):
${Object.entries(knowledge.financialKnowledge.financing.closingCosts.breakdown).map(([item, cost]) => 
  `${item}: $${cost.toLocaleString()}`).join('\n')}

=== LEGAL INFORMATION ===
Title Status: ${knowledge.legalKnowledge.titleInfo.titleStatus}
Zoning: ${knowledge.legalKnowledge.zoning.currentZoning}
Allowed Uses: ${knowledge.legalKnowledge.zoning.allowedUses.join(', ')}
Pet Policy: ${knowledge.legalKnowledge.associationRules.petPolicy}
Rental Policy: ${knowledge.legalKnowledge.associationRules.rentalPolicy}
Contract Terms: ${knowledge.legalKnowledge.contractTerms.standardContingencies.join(', ')}
Seller Concessions: ${knowledge.legalKnowledge.contractTerms.sellerConcessions.join(', ')}

=== PROPERTY CONDITION ===
Overall Condition: ${knowledge.conditionKnowledge.inspectionReports.overallCondition}
Last Inspection: ${knowledge.conditionKnowledge.inspectionReports.lastInspectionDate}

MAJOR SYSTEMS:
HVAC: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.hvac.status} (${knowledge.conditionKnowledge.inspectionReports.majorSystems.hvac.age} years old)
Plumbing: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.plumbing.status} (${knowledge.conditionKnowledge.inspectionReports.majorSystems.plumbing.age} years old)
Electrical: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.electrical.status} (${knowledge.conditionKnowledge.inspectionReports.majorSystems.electrical.age} years old)
Roofing: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.status} (${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.age} years old, ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.material})

RECENT UPGRADES:
${knowledge.conditionKnowledge.inspectionReports.recentUpgrades.map(upgrade => 
  `${upgrade.item} (${upgrade.date}): $${upgrade.cost.toLocaleString()}`).join('\n')}

=== LOCATION & NEIGHBORHOOD ===
Neighborhood: ${knowledge.locationKnowledge.neighborhood.name}
${knowledge.locationKnowledge.neighborhood.description}
Safety Rating: ${knowledge.locationKnowledge.neighborhood.safetyRating}/10
Walk Score: ${knowledge.locationKnowledge.neighborhood.walkScore}/100
Transit Score: ${knowledge.locationKnowledge.neighborhood.transitScore}/100

NEARBY AMENITIES:
${knowledge.locationKnowledge.amenities.nearby.map(amenity => 
  `${amenity.name} (${amenity.type}): ${amenity.distance} - ${amenity.walkingTime} walk`).join('\n')}

SCHOOLS:
Elementary: ${knowledge.locationKnowledge.schools.elementary.map(school => 
  `${school.name} (Rating: ${school.rating}/10, ${school.distance})`).join(', ')}
Middle: ${knowledge.locationKnowledge.schools.middle.map(school => 
  `${school.name} (Rating: ${school.rating}/10, ${school.distance})`).join(', ')}
High: ${knowledge.locationKnowledge.schools.high.map(school => 
  `${school.name} (Rating: ${school.rating}/10, ${school.distance})`).join(', ')}

TRANSPORTATION:
Public Transit: ${knowledge.locationKnowledge.transportation.publicTransit.join(', ')}
Major Roads: ${knowledge.locationKnowledge.transportation.majorRoads.join(', ')}
Airports: ${knowledge.locationKnowledge.transportation.airports.map(airport => 
  `${airport.name}: ${airport.distance} (${airport.driveTime})`).join(', ')}

=== VIEWING & CONTACT ===
Listing Agent: ${knowledge.schedulingKnowledge.keyContactInfo.listingAgent.name}
Phone: ${knowledge.schedulingKnowledge.keyContactInfo.listingAgent.phone}
Email: ${knowledge.schedulingKnowledge.keyContactInfo.listingAgent.email}

VIEWING AVAILABILITY:
${knowledge.schedulingKnowledge.availableViewings.map(viewing => 
  `${viewing.type}: ${viewing.date} (${viewing.timeSlots.join(', ')}) - ${viewing.duration}`).join('\n')}

Advance Notice Required: ${knowledge.schedulingKnowledge.restrictions.advanceNotice}
Allowed Times: ${knowledge.schedulingKnowledge.restrictions.allowedTimes}
Showing Requirements: ${knowledge.schedulingKnowledge.restrictions.showingRequirements.join(', ')}

=== CONVERSATION GUIDELINES ===
As a professional real estate agent, I can answer questions about:
1. Property details, pricing, and features
2. Financing options and mortgage calculations
3. Legal aspects, contracts, and disclosures
4. Property condition and maintenance
5. Neighborhood information and amenities
6. Scheduling viewings and next steps
7. Market analysis and investment potential
8. Comparable properties and market trends

I aim to be helpful, accurate, and professional while guiding you through your real estate journey.`;
    }

    private generateFinancialKnowledge(knowledge: PropertyKnowledge): string {
      return `FINANCIAL EXPERTISE FOR ${knowledge.basicInfo.title}

I'm Sarah, your financial consultant specializing in property financing and market analysis.

=== PRICING ANALYSIS ===
Listing Price: $${knowledge.financialKnowledge.listingPrice.toLocaleString()}
Price Per Sq M: $${knowledge.financialKnowledge.marketAnalysis.pricePerSqm}
Neighborhood Average: $${knowledge.financialKnowledge.marketAnalysis.neighborhoodAverage.toLocaleString()}
Market Position: ${knowledge.financialKnowledge.listingPrice > knowledge.financialKnowledge.marketAnalysis.neighborhoodAverage ? 'Above' : 'Below'} neighborhood average

=== MONTHLY COSTS ===
Property Taxes: $${knowledge.financialKnowledge.propertyTaxes.monthly.toLocaleString()}/month
HOA Fees: $${knowledge.financialKnowledge.hoaFees.monthly}/month
Total Monthly Carrying Costs: $${knowledge.financialKnowledge.propertyTaxes.monthly + knowledge.financialKnowledge.hoaFees.monthly}/month

=== MORTGAGE OPTIONS ===
Current Rate Estimate: ${knowledge.financialKnowledge.financing.estimatedMortgageRates}%
${knowledge.financialKnowledge.financing.monthlyPaymentEstimates.map(est => 
  `${est.downPayment}% Down Payment: $${est.monthly.toLocaleString()}/month`).join('\n')}

=== CLOSING COSTS ===
Estimated Total: $${knowledge.financialKnowledge.financing.closingCosts.estimated.toLocaleString()}
${Object.entries(knowledge.financialKnowledge.financing.closingCosts.breakdown).map(([item, cost]) => 
  `${item}: $${cost.toLocaleString()}`).join('\n')}

I can help you with financing options, down payment strategies, and total cost of ownership calculations.`;
    }

    private generateLegalKnowledge(knowledge: PropertyKnowledge): string {
      return `LEGAL EXPERTISE FOR ${knowledge.basicInfo.title}

I'm Marcus, your real estate attorney focusing on legal compliance and contract matters.

=== TITLE & OWNERSHIP ===
Title Status: ${knowledge.legalKnowledge.titleInfo.titleStatus}
Known Liens: ${knowledge.legalKnowledge.titleInfo.liens?.length ? knowledge.legalKnowledge.titleInfo.liens.join(', ') : 'None reported'}
Easements: ${knowledge.legalKnowledge.titleInfo.easements?.length ? knowledge.legalKnowledge.titleInfo.easements.join(', ') : 'None reported'}

=== ZONING & USE ===
Current Zoning: ${knowledge.legalKnowledge.zoning.currentZoning}
Allowed Uses: ${knowledge.legalKnowledge.zoning.allowedUses.join(', ')}
Restrictions: ${knowledge.legalKnowledge.zoning.restrictions.join(', ')}

=== ASSOCIATION RULES ===
Pet Policy: ${knowledge.legalKnowledge.associationRules.petPolicy}
Rental Policy: ${knowledge.legalKnowledge.associationRules.rentalPolicy}
Modification Rules: ${knowledge.legalKnowledge.associationRules.modifications.join(', ')}

=== CONTRACT TERMS ===
Standard Contingencies: ${knowledge.legalKnowledge.contractTerms.standardContingencies.join(', ')}
Seller Concessions Available: ${knowledge.legalKnowledge.contractTerms.sellerConcessions.join(', ')}
Possession Date: ${knowledge.legalKnowledge.contractTerms.possessionDate}

=== DISCLOSURES ===
Known Issues: ${knowledge.legalKnowledge.propertyDisclosures.knownIssues.length ? knowledge.legalKnowledge.propertyDisclosures.knownIssues.join(', ') : 'None disclosed'}
Recent Repairs: ${knowledge.legalKnowledge.propertyDisclosures.repairs.length ? knowledge.legalKnowledge.propertyDisclosures.repairs.join(', ') : 'None reported'}

I can help you understand contracts, review legal documents, and ensure compliance with all regulations.`;
    }

    private generateConditionKnowledge(knowledge: PropertyKnowledge): string {
      return `PROPERTY CONDITION EXPERTISE FOR ${knowledge.basicInfo.title}

I'm Jake, your property inspector specializing in home condition and maintenance.

=== OVERALL ASSESSMENT ===
Overall Condition: ${knowledge.conditionKnowledge.inspectionReports.overallCondition}
Last Professional Inspection: ${knowledge.conditionKnowledge.inspectionReports.lastInspectionDate}

=== MAJOR SYSTEMS STATUS ===
🔧 HVAC System: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.hvac.status}
   Age: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.hvac.age} years
   Last Service: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.hvac.lastService}

🚰 Plumbing: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.plumbing.status}
   Age: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.plumbing.age} years
   Upgrades: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.plumbing.upgrades.join(', ')}

⚡ Electrical: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.electrical.status}
   Age: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.electrical.age} years
   Panel Type: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.electrical.panelType}

🏠 Roofing: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.status}
   Age: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.age} years
   Material: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.material}
   ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.warranty ? `Warranty: ${knowledge.conditionKnowledge.inspectionReports.majorSystems.roofing.warranty}` : ''}

=== APPLIANCES ===
${knowledge.conditionKnowledge.inspectionReports.appliances.map(appliance => 
  `${appliance.type}: ${appliance.brand} (${appliance.age} years old, ${appliance.condition} condition)${appliance.warranty ? `, Warranty: ${appliance.warranty}` : ''}`).join('\n')}

=== RECENT IMPROVEMENTS ===
${knowledge.conditionKnowledge.inspectionReports.recentUpgrades.map(upgrade => 
  `${upgrade.item} - Completed: ${upgrade.date} - Investment: $${upgrade.cost.toLocaleString()}${upgrade.warranty ? ` (Warranty: ${upgrade.warranty})` : ''}`).join('\n')}

=== MAINTENANCE SCHEDULE ===
Regular Maintenance: ${knowledge.conditionKnowledge.maintenanceHistory.regularMaintenance.join(', ')}
Upcoming Maintenance: ${knowledge.conditionKnowledge.maintenanceHistory.upcomingMaintenance.join(', ')}

I can help you understand the property's condition, maintenance needs, and long-term care requirements.`;
    }

    private generateLocationKnowledge(knowledge: PropertyKnowledge): string {
      return `LOCATION EXPERTISE FOR ${knowledge.basicInfo.title}

I'm Maria, your neighborhood specialist focusing on location insights and community amenities.

=== NEIGHBORHOOD OVERVIEW ===
📍 ${knowledge.locationKnowledge.neighborhood.name}
${knowledge.locationKnowledge.neighborhood.description}

🏘️ COMMUNITY DEMOGRAPHICS:
Average Income: $${knowledge.locationKnowledge.neighborhood.demographics.averageIncome.toLocaleString()}
Average Age: ${knowledge.locationKnowledge.neighborhood.demographics.averageAge} years
Owner Occupied: ${knowledge.locationKnowledge.neighborhood.demographics.ownerOccupied}

📊 LIVABILITY SCORES:
Safety Rating: ${knowledge.locationKnowledge.neighborhood.safetyRating}/10
Walk Score: ${knowledge.locationKnowledge.neighborhood.walkScore}/100
Transit Score: ${knowledge.locationKnowledge.neighborhood.transitScore}/100

=== NEARBY AMENITIES ===
${knowledge.locationKnowledge.amenities.nearby.map(amenity => 
  `${amenity.name} (${amenity.type}): ${amenity.distance} away - ${amenity.walkingTime} walking time`).join('\n')}

🏪 Shopping: ${knowledge.locationKnowledge.amenities.shopping.join(', ')}
🍽️ Dining: ${knowledge.locationKnowledge.amenities.dining.join(', ')}
🏃 Recreation: ${knowledge.locationKnowledge.amenities.recreation.join(', ')}

=== SCHOOLS ===
🎓 Elementary Schools:
${knowledge.locationKnowledge.schools.elementary.map(school => 
  `${school.name}: ${school.rating}/10 rating, ${school.distance} away`).join('\n')}

🎓 Middle Schools:
${knowledge.locationKnowledge.schools.middle.map(school => 
  `${school.name}: ${school.rating}/10 rating, ${school.distance} away`).join('\n')}

🎓 High Schools:
${knowledge.locationKnowledge.schools.high.map(school => 
  `${school.name}: ${school.rating}/10 rating, ${school.distance} away`).join('\n')}

=== TRANSPORTATION ===
🚌 Public Transit: ${knowledge.locationKnowledge.transportation.publicTransit.join(', ')}
🛣️ Major Roads: ${knowledge.locationKnowledge.transportation.majorRoads.join(', ')}
✈️ Airports: ${knowledge.locationKnowledge.transportation.airports.map(airport => 
  `${airport.name}: ${airport.distance} (${airport.driveTime} drive)`).join(', ')}

🚗 COMMUTE TIMES:
${knowledge.locationKnowledge.transportation.commuteTimes.map(commute => 
  `To ${commute.destination}: ${commute.time} by ${commute.mode}`).join('\n')}

=== MARKET TRENDS ===
📈 Price Appreciation: ${knowledge.locationKnowledge.marketTrends.priceAppreciation}
📅 Average Days on Market: ${knowledge.locationKnowledge.marketTrends.averageDaysOnMarket}
📊 Inventory Levels: ${knowledge.locationKnowledge.marketTrends.inventoryLevels}
🔮 Future Growth: ${knowledge.locationKnowledge.marketTrends.futureGrowth.join(', ')}

I can help you understand the neighborhood dynamics, local amenities, and long-term area prospects.`;
    }

    private generateSchedulingKnowledge(knowledge: PropertyKnowledge): string {
      return `SCHEDULING EXPERTISE FOR ${knowledge.basicInfo.title}

I'm David, your showing coordinator specializing in property viewings and appointments.

=== CONTACT INFORMATION ===
🏠 Listing Agent: ${knowledge.schedulingKnowledge.keyContactInfo.listingAgent.name}
📞 Phone: ${knowledge.schedulingKnowledge.keyContactInfo.listingAgent.phone}
📧 Email: ${knowledge.schedulingKnowledge.keyContactInfo.listingAgent.email}

${knowledge.schedulingKnowledge.keyContactInfo.showingAgent ? `
🔑 Showing Agent: ${knowledge.schedulingKnowledge.keyContactInfo.showingAgent.name}
📞 Phone: ${knowledge.schedulingKnowledge.keyContactInfo.showingAgent.phone}
📧 Email: ${knowledge.schedulingKnowledge.keyContactInfo.showingAgent.email}` : ''}

=== VIEWING AVAILABILITY ===
${knowledge.schedulingKnowledge.availableViewings.map(viewing => 
  `📅 ${viewing.type.toUpperCase()} VIEWING:
   Date: ${viewing.date}
   Time Slots: ${viewing.timeSlots.join(', ')}
   Duration: ${viewing.duration}`).join('\n\n')}

=== SHOWING REQUIREMENTS ===
⏰ Advance Notice: ${knowledge.schedulingKnowledge.restrictions.advanceNotice}
🕐 Allowed Times: ${knowledge.schedulingKnowledge.restrictions.allowedTimes}
📋 Requirements: ${knowledge.schedulingKnowledge.restrictions.showingRequirements.join(', ')}
${knowledge.schedulingKnowledge.restrictions.petRestrictions ? `🐕 Pet Policy: ${knowledge.schedulingKnowledge.restrictions.petRestrictions}` : ''}

=== ACCESS INSTRUCTIONS ===
${knowledge.schedulingKnowledge.accessInstructions.keyLocation ? `🔑 Key Location: ${knowledge.schedulingKnowledge.accessInstructions.keyLocation}` : ''}
${knowledge.schedulingKnowledge.accessInstructions.securityCode ? `🔒 Security Code: ${knowledge.schedulingKnowledge.accessInstructions.securityCode}` : ''}
📝 Special Instructions: ${knowledge.schedulingKnowledge.accessInstructions.specialInstructions.join(', ')}

I can help you schedule viewings, coordinate with all parties, and ensure smooth property access.`;
    }
  }
  
  // Singleton instance
  export const heygenManager = new HeyGenAgentManager();
  
  // Auto cleanup expired sessions every 5 minutes
  if (typeof window !== 'undefined') {
    setInterval(() => {
      heygenManager.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }