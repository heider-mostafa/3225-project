'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Download, Eye, FileText, TrendingUp, Building } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  location: string;
  type: 'individual' | 'compound' | 'custom';
  price: number;
  appraisal_date: string;
  property_type: string;
  area_name: string;
  compound_name?: string;
  pages: number;
  preview_available: boolean;
  download_count: number;
}

// Simulated reports data for testing
const SAMPLE_REPORTS: Report[] = [
  {
    id: '1',
    title: 'Villa Appraisal Report - Madinaty',
    location: 'Madinaty, New Cairo',
    type: 'individual',
    price: 1500,
    appraisal_date: '2024-01-15',
    property_type: 'villa',
    area_name: 'New Cairo',
    compound_name: 'Madinaty',
    pages: 25,
    preview_available: true,
    download_count: 12
  },
  {
    id: '2',
    title: 'Apartment Market Analysis - Rehab City',
    location: 'Rehab City, New Cairo',
    type: 'individual',
    price: 800,
    appraisal_date: '2024-01-20',
    property_type: 'apartment',
    area_name: 'New Cairo',
    compound_name: 'Rehab City',
    pages: 18,
    preview_available: true,
    download_count: 8
  },
  {
    id: '3',
    title: 'New Capital Market Intelligence Report',
    location: 'New Administrative Capital',
    type: 'compound',
    price: 5000,
    appraisal_date: '2024-01-10',
    property_type: 'mixed',
    area_name: 'New Capital',
    pages: 45,
    preview_available: true,
    download_count: 3
  },
  {
    id: '4',
    title: 'Sheikh Zayed Investment Analysis',
    location: 'Sheikh Zayed, Giza',
    type: 'custom',
    price: 12000,
    appraisal_date: '2024-01-05',
    property_type: 'commercial',
    area_name: 'Sheikh Zayed',
    pages: 60,
    preview_available: false,
    download_count: 1
  }
];

function ReportCategoryCard({ 
  title, 
  description, 
  count, 
  priceRange, 
  icon 
}: {
  title: string;
  description: string;
  count: number;
  priceRange: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Available Reports:</span>
            <span className="font-semibold">{count}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Price Range:</span>
            <span className="font-semibold text-green-600">{priceRange}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [purchasing, setPurchasing] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'compound': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      
      // For individual reports based on appraisals, we can generate the PDF
      if (report.type === 'individual' && report.related_appraisal_ids?.length > 0) {
        const appraisalId = report.related_appraisal_ids[0];
        
        console.log('🔄 REPORT PURCHASE - Generating PDF for appraisal:', appraisalId);
        
        // Use the same endpoint that the appraiser dashboard uses
        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appraisal_id: appraisalId,
            include_market_analysis: true,
            include_comparable_properties: true,
            report_type: 'comprehensive'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch report data');
        }

        const reportData = await response.json();
        console.log('✅ REPORT PURCHASE - Got report data, using client-side PDF generator');
        
        // Use the same PDF generator that appraiser dashboard uses
        const { PDFReportGenerator } = await import('@/lib/services/pdf-report-generator');
        const pdfGenerator = new PDFReportGenerator();
        
        // Generate PDF using the same system as appraiser dashboard
        const pdfBlob = await pdfGenerator.generateReport(reportData.data);
        
        // Download the PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('Report downloaded successfully! 🎉');
        
      } else {
        // For compound/area/custom reports, show coming soon message
        alert(`${report.type.charAt(0).toUpperCase() + report.type.slice(1)} reports coming soon! This will integrate with our payment system and generate comprehensive market analysis.`);
      }
      
    } catch (error) {
      console.error('Purchase error:', error);
      alert(`Failed to process purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handlePreview = async () => {
    if (report.type === 'individual' && report.related_appraisal_ids?.length > 0) {
      try {
        const appraisalId = report.related_appraisal_ids[0];
        
        // Fetch basic report data for preview
        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appraisal_id: appraisalId,
            include_market_analysis: false,
            include_comparable_properties: false,
            report_type: 'preview'
          })
        });

        if (response.ok) {
          const reportData = await response.json();
          const property = reportData.property;
          const appraisal = reportData.appraisal;
          
          // Show preview modal/alert with actual data
          const previewContent = `
📄 REPORT PREVIEW

🏠 Property: ${property?.title || 'Property in ' + report.location}
📍 Location: ${report.location}
💰 Appraised Value: ${report.property_value ? new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(report.property_value) : 'Available in full report'}
👨‍💼 Appraiser: ${report.appraiser_name}
📅 Date: ${new Date(report.appraisal_date).toLocaleDateString()}

📊 REPORT INCLUDES:
✅ Property Details & Description
✅ Professional Valuation Analysis  
✅ Market Comparison Data
✅ Investment Insights
✅ High-Quality Images
✅ Certified Appraiser Signature

📄 Total Pages: ${report.pages}
💾 Format: PDF with Arabic & English

Full report available after purchase.
          `;
          
          alert(previewContent);
        } else {
          throw new Error('Failed to fetch preview data');
        }
        
      } catch (error) {
        console.error('Preview error:', error);
        // Fallback to basic preview
        alert(`📄 PREVIEW: ${report.title}\n\n🏠 ${report.location}\n💰 ${new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(report.price)}\n👨‍💼 ${report.appraiser_name}\n📄 ${report.pages} pages\n\nFull report includes detailed property analysis, market data, and professional certification.`);
      }
    } else {
      alert(`📄 PREVIEW: ${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report\n\n${report.report_description || 'Comprehensive market analysis with trends and insights.'}\n\n💰 ${new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(report.price)}\n📄 ${report.pages} pages\n\nFull report available after purchase.`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{report.title}</CardTitle>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {report.location}
            </p>
          </div>
          <Badge className={getTypeColor(report.type)}>
            {report.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(report.price)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Appraised:</span>
              <div>{new Date(report.appraisal_date).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="font-medium">Pages:</span>
              <div>{report.pages}</div>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <div className="capitalize">{report.property_type}</div>
            </div>
            <div>
              <span className="font-medium">Downloads:</span>
              <div>{report.download_count}</div>
            </div>
          </div>
          
          {/* Additional info for compound/area reports */}
          {report.data_points && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              Based on {report.data_points} professional appraisals
              {report.compounds_covered && ` across ${report.compounds_covered} compounds`}
            </div>
          )}
          
          <div className="flex gap-2">
            {report.preview_available && (
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
            )}
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={handlePurchase}
              disabled={purchasing}
            >
              <Download className="w-4 h-4 mr-1" />
              {purchasing ? 'Processing...' : 'Purchase'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportMarketplacePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/marketplace');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReports(data.data);
          setFilteredReports(data.data);
          setReportSummary(data.summary);
          console.log('📊 REPORTS DEBUG - Fetched real data:', {
            total: data.data.length,
            summary: data.summary
          });
        }
      } else {
        // Fallback to sample data if API fails
        setReports(SAMPLE_REPORTS);
        setFilteredReports(SAMPLE_REPORTS);
        console.log('📊 REPORTS DEBUG - Using fallback sample data');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Fallback to sample data on error
      setReports(SAMPLE_REPORTS);
      setFilteredReports(SAMPLE_REPORTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.property_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedArea && selectedArea !== 'all') {
      filtered = filtered.filter(report => 
        report.area_name.toLowerCase().includes(selectedArea.toLowerCase())
      );
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(report => report.type === selectedType);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, selectedArea, selectedType]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Professional Appraisal Reports
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access detailed property appraisal reports from certified professionals. 
            Get market insights, property valuations, and investment analysis.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Search by area, compound, or property type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="col-span-1"
          />
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger>
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="new-cairo">New Cairo</SelectItem>
              <SelectItem value="new-capital">New Administrative Capital</SelectItem>
              <SelectItem value="sheikh-zayed">Sheikh Zayed</SelectItem>
              <SelectItem value="6th-october">6th of October</SelectItem>
              <SelectItem value="heliopolis">Heliopolis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="All Report Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual Reports</SelectItem>
              <SelectItem value="compound">Compound Analysis</SelectItem>
              <SelectItem value="custom">Custom Research</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ReportCategoryCard 
            title="Individual Reports"
            description="Detailed appraisal reports for specific properties"
            count={reportSummary?.individual_reports || 0}
            priceRange="500-2,000 EGP"
            icon={<FileText className="w-6 h-6" />}
          />
          <ReportCategoryCard 
            title="Compound Analysis"
            description="Comprehensive market analysis for entire compounds"
            count={reportSummary?.compound_reports || 0}
            priceRange="2,500-7,500 EGP"
            icon={<Building className="w-6 h-6" />}
          />
          <ReportCategoryCard 
            title="Custom Research"
            description="Tailored market research for specific requirements"
            count={reportSummary?.custom_reports || 0}
            priceRange="10,000+ EGP"
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Available Reports
          </h2>
          <div className="text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>

        {/* Available Reports Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600">
                {reports.length === 0 
                  ? 'No appraisals have been completed yet. Complete an appraisal to generate reports.'
                  : 'Try adjusting your search filters to find more reports.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold text-blue-800 mb-4">
                Need a Custom Report?
              </h3>
              <p className="text-blue-600 mb-6 max-w-2xl mx-auto">
                Our certified appraisers can create tailored market research reports 
                for your specific investment or development needs.
              </p>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Request Custom Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}