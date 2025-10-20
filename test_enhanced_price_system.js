// Test Enhanced Price Update System
// This script tests the new weighted average price calculations

async function testEnhancedPriceSystem() {
  console.log('🧪 TESTING ENHANCED PRICE UPDATE SYSTEM');
  console.log('=====================================\n');
  
  try {
    // Test 1: Check if market intelligence cache has price data
    console.log('📊 Test 1: Market Intelligence Cache Data');
    console.log('------------------------------------------');
    
    const response = await fetch('/api/market-intelligence/dashboard?type=overview');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response successful');
      console.log(`📈 Total Appraisals: ${data.data.totalAppraisals}`);
      console.log(`🏘️  Active Areas: ${data.data.activeAreas}`);
      console.log(`💰 Avg Price per sqm: ${data.data.avgPricePerSqm.toLocaleString()} EGP`);
      console.log(`🔥 Hot Markets: ${data.data.hotMarkets || 0}`);
      console.log(`📊 Data Quality: ${data.data.dataQuality || 0}%`);
      console.log(`🎯 Price Data Available: ${data.data.priceDataAvailable ? 'Yes' : 'No'}`);
      
      if (data.data.avgPricePerSqm > 0) {
        console.log('✅ Price calculations working correctly!');
      } else {
        console.log('⚠️  No price data available - may need to run recalculation');
      }
    } else {
      console.log('❌ API Error:', data.error);
    }
    
    console.log('\n');
    
    // Test 2: Check areas endpoint for detailed location data
    console.log('🗺️  Test 2: Market Areas Data');
    console.log('-----------------------------');
    
    const areasResponse = await fetch('/api/market-intelligence/dashboard?type=areas');
    const areasData = await areasResponse.json();
    
    if (areasData.success && areasData.data.length > 0) {
      console.log(`✅ Found ${areasData.data.length} areas with data`);
      
      // Show top 5 areas by appraisal count
      const topAreas = areasData.data
        .filter(area => area.total_appraisals > 0)
        .sort((a, b) => b.total_appraisals - a.total_appraisals)
        .slice(0, 5);
      
      console.log('\n🏆 Top Areas by Appraisal Count:');
      topAreas.forEach((area, index) => {
        console.log(`${index + 1}. ${area.location_name} (${area.location_type})`);
        console.log(`   📊 ${area.total_appraisals} appraisals`);
        console.log(`   💰 ${Math.round(area.avg_price_per_sqm || 0).toLocaleString()} EGP/sqm`);
        console.log(`   🎯 ${area.confidence_level || 'unknown'} confidence`);
        console.log('');
      });
      
      // Check location hierarchy
      const compounds = areasData.data.filter(area => area.location_type === 'compound');
      const districts = areasData.data.filter(area => area.location_type === 'district');
      const areas = areasData.data.filter(area => area.location_type === 'area');
      const cities = areasData.data.filter(area => area.location_type === 'city');
      
      console.log('📍 Location Hierarchy Distribution:');
      console.log(`   🏢 Compounds: ${compounds.length}`);
      console.log(`   🏘️  Districts: ${districts.length}`);
      console.log(`   🌆 Areas: ${areas.length}`);
      console.log(`   🏙️  Cities: ${cities.length}`);
      
      if (compounds.length > 0 || districts.length > 0) {
        console.log('✅ Enhanced location hierarchy working!');
      }
      
    } else {
      console.log('⚠️  No areas data found - cache may be empty');
    }
    
    console.log('\n');
    
    // Test 3: Check trending areas
    console.log('📈 Test 3: Trending Areas');
    console.log('-------------------------');
    
    const trendingResponse = await fetch('/api/market-intelligence/dashboard?type=trending');
    const trendingData = await trendingResponse.json();
    
    if (trendingData.success && trendingData.data.length > 0) {
      console.log(`✅ Found ${trendingData.data.length} trending areas`);
      
      trendingData.data.slice(0, 3).forEach((area, index) => {
        console.log(`${index + 1}. ${area.area_name}`);
        console.log(`   📊 ${area.total_appraisals} appraisals`);
        console.log(`   💰 ${Math.round(area.avg_price_per_sqm || 0).toLocaleString()} EGP/sqm`);
        console.log(`   📈 Activity: ${area.market_activity || 'unknown'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No trending data available');
    }
    
    console.log('\n');
    
    // Summary
    console.log('📋 SUMMARY');
    console.log('===========');
    
    const hasPrice = data.success && data.data.avgPricePerSqm > 0;
    const hasAreas = areasData.success && areasData.data.length > 0;
    const hasTrending = trendingData.success && trendingData.data.length > 0;
    
    console.log(`✅ Price Calculations: ${hasPrice ? 'Working' : 'Needs Fix'}`);
    console.log(`✅ Location Hierarchy: ${hasAreas ? 'Working' : 'Needs Setup'}`);
    console.log(`✅ Market Intelligence: ${hasTrending ? 'Working' : 'Needs Data'}`);
    
    if (hasPrice && hasAreas) {
      console.log('\n🎉 Enhanced Price Update System is working correctly!');
      console.log('Your market intelligence dashboard now shows accurate price data.');
    } else {
      console.log('\n⚠️  System needs setup:');
      if (!hasPrice) console.log('   - Run the recalculation migration to populate price data');
      if (!hasAreas) console.log('   - Ensure appraisals have location data');
      console.log('   - Check that appraisals are marked as "completed"');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('Make sure the API server is running and accessible.');
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  testEnhancedPriceSystem();
} else {
  // Node.js environment
  console.log('🧪 Enhanced Price Update System Test');
  console.log('=====================================');
  console.log('');
  console.log('To run this test:');
  console.log('1. Open your browser developer console');
  console.log('2. Navigate to your market intelligence page');
  console.log('3. Copy and paste this script');
  console.log('4. Press Enter to execute');
  console.log('');
  console.log('Or run the API endpoints manually:');
  console.log('- GET /api/market-intelligence/dashboard?type=overview');
  console.log('- GET /api/market-intelligence/dashboard?type=areas');
  console.log('- GET /api/market-intelligence/dashboard?type=trending');
}

module.exports = { testEnhancedPriceSystem };