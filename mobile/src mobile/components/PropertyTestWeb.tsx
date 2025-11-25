import React, { useState, useEffect } from 'react';

// Simple web-compatible styles (inline)
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  propertyCard: {
    backgroundColor: 'white',
    padding: '16px',
    marginBottom: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  propertyTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
  },
  propertyPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: '8px',
  },
  propertyLocation: {
    color: '#6b7280',
    marginBottom: '12px',
  },
  propertyDetails: {
    display: 'flex',
    gap: '20px',
    marginBottom: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280',
  },
  error: {
    color: 'red',
    textAlign: 'center' as const,
    padding: '20px',
  },
};

// Types based on your working API
interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters: number;
  address: string;
  city: string;
  property_type: string;
  status: string;
  virtual_tour_url?: string;
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
}

const PropertyTestWeb: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format EGP currency like your web app
  const formatEGP = (price: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Test API call to your working backend
  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct fetch to your working API
      const response = await fetch('http://localhost:3000/api/properties?limit=10');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.properties && Array.isArray(data.properties)) {
        setProperties(data.properties);
        console.log(`📱 Loaded ${data.properties.length} properties for mobile`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ API Error:', err);
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadProperties();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          🔄 جاري تحميل العقارات المصرية...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          ❌ خطأ: {error}
          <br />
          <button onClick={loadProperties} style={{marginTop: '10px', padding: '8px 16px'}}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>🏠 العقارات المصرية - اختبار الموبايل</h1>
        <p>{properties.length} عقار متاح</p>
      </div>

      {/* Properties List */}
      {properties.map((property) => (
        <div key={property.id} style={styles.propertyCard}>
          <div style={styles.propertyTitle}>
            {property.title}
          </div>
          
          <div style={styles.propertyPrice}>
            {formatEGP(property.price)}
          </div>
          
          <div style={styles.propertyLocation}>
            📍 {property.address}, {property.city}
          </div>
          
          <div style={styles.propertyDetails}>
            <span>🛏️ {property.bedrooms} غرف</span>
            <span>🚿 {property.bathrooms} حمام</span>
            <span>📐 {property.square_meters}م²</span>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '6px'
            }}>
              {property.property_type}
            </span>
            <span style={{fontSize: '12px', color: '#059669', fontWeight: '600'}}>
              {property.status}
            </span>
            {property.virtual_tour_url && (
              <span style={{fontSize: '12px', color: '#2563eb'}}>
                🏠 جولة افتراضية
              </span>
            )}
          </div>
        </div>
      ))}

      {/* API Test Info */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#e0f2fe',
        borderRadius: '8px',
        fontSize: '14px',
      }}>
        <h3>📊 اختبار API النجح!</h3>
        <p>✅ تم تحميل البيانات من: <code>http://localhost:3000/api/properties</code></p>
        <p>✅ تم عرض {properties.length} عقار مصري</p>
        <p>✅ تنسيق العملة المصرية: EGP</p>
        <p>✅ النص العربي يعمل بشكل صحيح</p>
        <p>🚀 جاهز للتطبيق على الموبايل!</p>
      </div>
    </div>
  );
};

export default PropertyTestWeb; 