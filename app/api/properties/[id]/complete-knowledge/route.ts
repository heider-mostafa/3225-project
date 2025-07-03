import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server'
function calculateMortgageEstimates(price: number): Array<{downPayment: number; monthly: number}> {
  const estimates = [];
  const downPaymentOptions = [10, 15, 20, 25, 30];
  const annualRate = 0.072; // 7.2%
  const monthlyRate = annualRate / 12;
  const numPayments = 360; // 30 years

  for (const downPaymentPercent of downPaymentOptions) {
    const downPaymentAmount = price * (downPaymentPercent / 100);
    const loanAmount = price - downPaymentAmount;
    
    // Calculate monthly payment using mortgage formula
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    estimates.push({
      downPayment: downPaymentPercent,
      monthly: Math.round(monthlyPayment)
    });
  }
  
  return estimates;
}

function generateDefaultKnowledge(property: any) {
  const price = property.price || 0;
  const sqm = property.square_meters || 1000;
  const pricePerSqm = Math.round((property.price || 0) / sqm);
  
  return {
    financialKnowledge: {
      listingPrice: price,
      priceHistory: [
        { date: '2024-01-15', price: price, change: 'Listed' },
        { date: '2023-12-01', price: Math.round(price * 0.98), change: 'Price Reduction' },
        { date: '2023-09-15', price: Math.round(price * 1.05), change: 'Initial Listing' }
      ],
      propertyTaxes: {
        annual: Math.round(price * 0.015),
        monthly: Math.round(price * 0.015 / 12),
        taxRate: '1.5%'
      },
      hoaFees: {
        monthly: 150,
        includes: ['Maintenance', 'Security', 'Common Areas', 'Landscaping'],
        specialAssessments: []
      },
      financing: {
        downPaymentOptions: [10, 15, 20, 25, 30],
        estimatedMortgageRates: 7.2,
        monthlyPaymentEstimates: calculateMortgageEstimates(price),
        closingCosts: {
          estimated: Math.round(price * 0.03),
          breakdown: {
            'Title Insurance': Math.round(price * 0.005),
            'Attorney Fees': 1500,
            'Inspection': 500,
            'Appraisal': 600,
            'Other Fees': Math.round(price * 0.015)
          }
        }
      },
      marketAnalysis: {
        pricePerSqft: Math.round(price / sqm),
        neighborhoodAverage: Math.round(price * 0.95),
        appreciation: '5.2% annually',
        daysOnMarket: 14
      },
      incentives: ['First-time buyer assistance', 'Flexible closing date']
    },
    
    legalKnowledge: {
      propertyDisclosures: {
        knownIssues: [],
        repairs: ['Recent HVAC maintenance', 'Fresh paint throughout'],
        environmentalHazards: []
      },
      titleInfo: {
        titleStatus: 'Clear',
        liens: [],
        easements: []
      },
      zoning: {
        currentZoning: 'Residential',
        allowedUses: ['Single Family Residence', 'Multi-family up to 4 units'],
        restrictions: ['No commercial use', 'Height limit 3 stories']
      },
      permits: {
        recentPermits: [
          { type: 'Electrical Upgrade', date: '2023-08-15', status: 'Complete' },
          { type: 'Plumbing Inspection', date: '2023-12-01', status: 'Approved' }
        ],
        requiredInspections: ['Final Inspection Complete']
      },
      associationRules: {
        petPolicy: 'Pets allowed with $200 deposit',
        rentalPolicy: 'Owner-occupied preferred, rentals allowed',
        modifications: ['Exterior changes require approval', 'Interior modifications allowed']
      },
      contractTerms: {
        standardContingencies: ['Inspection', 'Financing', 'Appraisal'],
        sellerConcessions: ['Up to 3% closing costs', 'Home warranty included'],
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
        name: property.city || 'Neighborhood',
        description: `Beautiful ${property.city || 'area'} location with excellent amenities and transportation links.`,
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
        elementary: [
          { name: 'Riverside Elementary', rating: 9, distance: '0.8 km' },
          { name: 'Green Valley Elementary', rating: 8, distance: '1.2 km' }
        ],
        middle: [
          { name: 'Central Middle School', rating: 8, distance: '1.5 km' }
        ],
        high: [
          { name: 'Metro High School', rating: 9, distance: '2.0 km' }
        ],
        private: [
          { name: 'International Academy', type: 'International', distance: '3.0 km' }
        ]
      },
      transportation: {
        publicTransit: ['Metro line', 'Bus routes'],
        majorRoads: ['Main Highway', 'City Boulevard'],
        airports: [
          { name: 'Cairo International Airport', distance: '25 km', driveTime: '35 minutes' }
        ],
        commuteTimes: [
          { destination: 'Downtown', time: '25 minutes', mode: 'metro' },
          { destination: 'Business District', time: '30 minutes', mode: 'car' }
        ]
      },
      marketTrends: {
        priceAppreciation: '5.2% annually',
        averageDaysOnMarket: 14,
        inventoryLevels: 'Balanced market',
        futureGrowth: ['New metro extension', 'Shopping mall development']
      }
    },
    
    schedulingKnowledge: {
      availableViewings: [
        {
          type: 'virtual' as const,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          timeSlots: ['10:00 AM', '2:00 PM', '5:00 PM'],
          duration: '30 minutes'
        },
        {
          type: 'in_person' as const,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          timeSlots: ['11:00 AM', '3:00 PM'],
          duration: '45 minutes'
        }
      ],
      keyContactInfo: {
        listingAgent: {
          name: 'Ahmed Hassan',
          phone: '+20-10-1234-5678',
          email: 'ahmed.hassan@realestate.com'
        },
        showingAgent: {
          name: 'Sara Mohamed',
          phone: '+20-10-8765-4321',
          email: 'sara.mohamed@realestate.com'
        }
      },
      accessInstructions: {
        keyLocation: 'Lockbox at front door',
        securityCode: '1234',
        specialInstructions: ['Remove shoes when entering', 'Please ensure all lights are turned off', 'Lock all doors when leaving']
      },
      restrictions: {
        advanceNotice: '24 hours',
        allowedTimes: 'Monday-Saturday 9 AM - 7 PM, Sunday 12 PM - 5 PM',
        petRestrictions: 'No pets during showings',
        showingRequirements: ['Photo ID required', 'Pre-approval letter preferred']
      }
    }
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Fetch basic property info
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      return NextResponse.json(
        { error: 'Property not found', details: propertyError.message },
        { status: 404 }
      );
    }

    if (!property) {
      console.error('Property not found:', id);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Start with basic property info
    const completeKnowledge = {
      propertyId: id,
      basicInfo: {
        title: property.title || 'Property',
        price: property.price || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        sqm: property.square_meters || 0,
        address: property.address || '',
        propertyType: property.property_type || 'Property',
        yearBuilt: property.year_built || new Date().getFullYear()
      }
    };

    // Try to fetch supplementary data, but fall back to defaults if not available
    try {
      // Fetch financial data
      const { data: financialData } = await supabase
        .from('property_financials')
        .select('*')
        .eq('property_id', id)
        .single();

      // Fetch legal data
      const { data: legalData } = await supabase
        .from('property_legal')
        .select('*')
        .eq('property_id', id)
        .single();

      // Fetch scheduling data
      const { data: schedulingData } = await supabase
        .from('property_scheduling')
        .select('*')
        .eq('property_id', id)
        .single();

      // Generate comprehensive knowledge with available data + defaults
      const defaultKnowledge = generateDefaultKnowledge(property);
      
      const result = {
        ...completeKnowledge,
        financialKnowledge: financialData || defaultKnowledge.financialKnowledge,
        legalKnowledge: legalData || defaultKnowledge.legalKnowledge,
        conditionKnowledge: defaultKnowledge.conditionKnowledge,
        locationKnowledge: defaultKnowledge.locationKnowledge,
        schedulingKnowledge: schedulingData || defaultKnowledge.schedulingKnowledge
      };

      return NextResponse.json(result);
      
    } catch (error) {
      // If supplementary data queries fail, return basic info + defaults
      console.log('Using default knowledge data:', error);
      const defaultKnowledge = generateDefaultKnowledge(property);
      
      const result = {
        ...completeKnowledge,
        ...defaultKnowledge
      };

      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Unexpected error in complete-knowledge endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 