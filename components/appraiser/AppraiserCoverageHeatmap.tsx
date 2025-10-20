'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Activity, 
  TrendingUp, 
  Building2,
  Home,
  Factory,
  TreePine
} from 'lucide-react';

// Egyptian market areas with coordinates for coverage visualization
const EGYPTIAN_COVERAGE_AREAS = [
  { name: 'New Cairo', lat: 30.0330, lng: 31.4913, type: 'area' },
  { name: 'Madinaty', lat: 30.1019, lng: 31.6440, type: 'compound' },
  { name: 'Rehab City', lat: 30.0561, lng: 31.4913, type: 'compound' },
  { name: 'New Capital', lat: 30.3572, lng: 31.6857, type: 'area' },
  { name: '6th of October', lat: 29.9668, lng: 30.9876, type: 'area' },
  { name: 'Sheikh Zayed', lat: 30.0081, lng: 30.9757, type: 'area' },
  { name: 'Heliopolis', lat: 30.0808, lng: 31.3131, type: 'area' },
  { name: 'Zamalek', lat: 30.0616, lng: 31.2194, type: 'area' },
  { name: 'Nasr City', lat: 30.0626, lng: 31.3549, type: 'area' },
  { name: 'Maadi', lat: 29.9602, lng: 31.2569, type: 'area' },
  { name: 'Fifth Settlement', lat: 30.0131, lng: 31.4289, type: 'area' },
  { name: 'Mostakbal City', lat: 30.0289, lng: 31.5456, type: 'compound' }
];

interface CoverageArea {
  area_name: string;
  area_type: 'compound' | 'district' | 'governorate' | 'area';
  appraisals_completed: number;
  coverage_strength: 'high' | 'medium' | 'low';
  last_activity: string;
}

interface AppraiserCoverageHeatmapProps {
  appraiser_id: string;
  property_statistics: Array<{
    property_type: string;
    properties_appraised: number;
    total_value_appraised: number;
    average_accuracy_percentage: number;
  }>;
}

export function AppraiserCoverageHeatmap({ 
  appraiser_id, 
  property_statistics 
}: AppraiserCoverageHeatmapProps) {
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCoverage, setTotalCoverage] = useState(0);
  const [strongCoverageAreas, setStrongCoverageAreas] = useState(0);

  const propertyTypeIcons = {
    residential: Home,
    apartment: Home,
    villa: Home,
    townhouse: Home,
    duplex: Home,
    penthouse: Home,
    commercial: Building2,
    industrial: Factory,
    land: TreePine,
    agricultural: TreePine,
  };

  useEffect(() => {
    fetchCoverageData();
  }, [appraiser_id]);

  const fetchCoverageData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from the appraiser_coverage_areas table
      // For now, we'll simulate coverage data based on Egyptian market areas
      const simulatedCoverage: CoverageArea[] = EGYPTIAN_COVERAGE_AREAS
        .filter(() => Math.random() > 0.4) // Randomly show 60% coverage
        .map(area => ({
          area_name: area.name,
          area_type: area.type as 'compound' | 'district' | 'governorate' | 'area',
          appraisals_completed: Math.floor(Math.random() * 15) + 1,
          coverage_strength: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          last_activity: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
        }));

      setCoverageAreas(simulatedCoverage);
      setTotalCoverage(simulatedCoverage.length);
      setStrongCoverageAreas(simulatedCoverage.filter(area => area.coverage_strength === 'high').length);
      
    } catch (error) {
      console.error('Error fetching coverage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCoverageColor = (strength: string) => {
    switch (strength) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getCoverageStrengthBadge = (strength: string) => {
    const colors = {
      high: 'bg-green-500',
      medium: 'bg-yellow-500', 
      low: 'bg-gray-400'
    };
    return colors[strength as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Statistics Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Professional Coverage & Expertise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {property_statistics.map((stat) => {
            const IconComponent = propertyTypeIcons[stat.property_type as keyof typeof propertyTypeIcons] || Building2;
            
            return (
              <Card key={stat.property_type} className="text-center border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stat.properties_appraised}</div>
                      <div className="text-sm text-gray-600 capitalize font-medium">
                        {stat.property_type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(stat.total_value_appraised)} total
                      </div>
                      {stat.average_accuracy_percentage && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          {stat.average_accuracy_percentage.toFixed(1)}% accuracy
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Coverage Overview Metrics */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <MapPin className="h-5 w-5" />
            Market Coverage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{totalCoverage}</div>
              <div className="text-sm text-gray-600">Areas Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{strongCoverageAreas}</div>
              <div className="text-sm text-gray-600">Strong Coverage</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {property_statistics.reduce((sum, stat) => sum + stat.properties_appraised, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Appraisals</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(property_statistics.reduce((sum, stat) => sum + stat.total_value_appraised, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Areas Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Coverage Areas & Strength
          </h3>
          <div className="text-sm text-gray-600">
            {coverageAreas.length} areas with active coverage
          </div>
        </div>

        {coverageAreas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Coverage Data</h3>
              <p className="text-gray-600">
                This appraiser hasn't established coverage areas yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverageAreas.map((area, index) => (
              <Card key={index} className={`hover:shadow-md transition-shadow ${getCoverageColor(area.coverage_strength)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{area.area_name}</h4>
                      <p className="text-sm capitalize text-gray-600">
                        {area.area_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCoverageStrengthBadge(area.coverage_strength)}`}></div>
                      <Badge variant="secondary" className="text-xs">
                        {area.coverage_strength}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Appraisals:</span>
                      <span className="font-semibold">{area.appraisals_completed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Activity:</span>
                      <span className="text-sm">
                        {new Date(area.last_activity).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>Market coverage zone</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Professional Recognition Section */}
      {strongCoverageAreas > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Market Leadership</h3>
                <p className="text-green-700">
                  Established strong presence in {strongCoverageAreas} key areas
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">{strongCoverageAreas}</div>
                <div className="text-green-600">Strong Areas</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {Math.round((strongCoverageAreas / totalCoverage) * 100)}%
                </div>
                <div className="text-green-600">Coverage Quality</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {coverageAreas.filter(area => area.area_type === 'compound').length}
                </div>
                <div className="text-green-600">Compounds</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {coverageAreas.filter(area => area.area_type === 'area').length}
                </div>
                <div className="text-green-600">Districts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}