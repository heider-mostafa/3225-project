'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase,
  Calendar,
  DollarSign,
  Search,
  Plus,
  Check,
  X,
  AlertCircle,
  Users,
  Award
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Broker {
  id: string
  user_id: string
  license_number: string
  experience_years: number
  specializations: string[]
  availability_status: string
  rating: number
  total_properties: number
  commission_rate: number
  user_profiles: {
    full_name: string
    phone: string
    email?: string
    profile_photo_url?: string
  }
}

interface RentalListing {
  id: string
  property_id: string
  assigned_broker_id?: string
  properties: {
    title: string
    city: string
    property_type: string
  }
  assigned_broker?: {
    id: string
    user_profiles: {
      full_name: string
      phone: string
    }
  }
}

export default function RentalBrokerAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const [rental, setRental] = useState<RentalListing | null>(null)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUnassignModal, setShowUnassignModal] = useState(false)

  const rentalId = params.id as string

  useEffect(() => {
    if (rentalId) {
      fetchRentalData()
      fetchBrokers()
    }
  }, [rentalId])

  const fetchRentalData = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('rental_listings')
        .select(`
          id,
          property_id,
          assigned_broker_id,
          properties (
            title,
            city,
            property_type
          ),
          assigned_broker:brokers!rental_listings_assigned_broker_id_fkey (
            id,
            user_profiles (
              full_name,
              phone
            )
          )
        `)
        .eq('id', rentalId)
        .single()

      if (error) throw error
      setRental(data)
      setSelectedBroker(data.assigned_broker_id)
    } catch (err) {
      console.error('Error fetching rental data:', err)
      setError('Failed to load rental information')
    }
  }

  const fetchBrokers = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('brokers')
        .select(`
          id,
          user_id,
          license_number,
          experience_years,
          specializations,
          availability_status,
          rating,
          total_properties,
          commission_rate,
          user_profiles (
            full_name,
            phone,
            profile_photo_url
          )
        `)
        .eq('availability_status', 'available')
        .order('rating', { ascending: false })

      if (error) throw error
      setBrokers(data || [])
    } catch (err) {
      console.error('Error fetching brokers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignBroker = async (brokerId: string) => {
    try {
      setSaving(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('rental_listings')
        .update({ assigned_broker_id: brokerId })
        .eq('id', rentalId)

      if (error) throw error

      // Refresh rental data
      await fetchRentalData()
      
    } catch (err) {
      console.error('Error assigning broker:', err)
      setError('Failed to assign broker. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUnassignBroker = async () => {
    try {
      setSaving(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('rental_listings')
        .update({ assigned_broker_id: null })
        .eq('id', rentalId)

      if (error) throw error

      // Refresh rental data
      await fetchRentalData()
      setShowUnassignModal(false)
      
    } catch (err) {
      console.error('Error unassigning broker:', err)
      setError('Failed to unassign broker. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filteredBrokers = brokers.filter(broker =>
    broker.user_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getSpecializationBadgeColor = (specialization: string) => {
    const colors: Record<string, string> = {
      'short_term_rentals': 'bg-blue-100 text-blue-800',
      'luxury_properties': 'bg-purple-100 text-purple-800',
      'coastal_properties': 'bg-cyan-100 text-cyan-800',
      'residential': 'bg-green-100 text-green-800',
      'commercial': 'bg-orange-100 text-orange-800'
    }
    return colors[specialization] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading broker information...</p>
        </div>
      </div>
    )
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error || 'Could not load rental information'}</p>
          <Link href={`/admin/rentals/${rentalId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Rental Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/admin/rentals/${rentalId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Broker Assignment
                </h1>
                <p className="text-sm text-gray-500">
                  {rental.properties?.title} • {rental.properties?.city}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Assignment */}
        {rental.assigned_broker ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Currently Assigned Broker</h2>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {rental.assigned_broker.user_profiles.full_name}
                    </h3>
                    <p className="text-gray-600">
                      {rental.assigned_broker.user_profiles.phone}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowUnassignModal(true)}
                disabled={saving}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                Unassign Broker
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                This rental property does not have an assigned broker. Select a broker below to assign.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Available Brokers */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Search Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Available Brokers</h2>
                  <span className="text-sm text-gray-500">
                    {filteredBrokers.length} brokers found
                  </span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by name, license, or specialization..."
                  />
                </div>
              </div>

              {/* Brokers List */}
              <div className="divide-y divide-gray-200">
                {filteredBrokers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Brokers Found</h3>
                    <p className="text-gray-600">
                      {searchTerm ? 'Try adjusting your search criteria' : 'No available brokers at the moment'}
                    </p>
                  </div>
                ) : (
                  filteredBrokers.map((broker) => (
                    <div key={broker.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {broker.user_profiles.profile_photo_url ? (
                              <img
                                src={broker.user_profiles.profile_photo_url}
                                alt={broker.user_profiles.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-blue-600" />
                            )}
                          </div>

                          {/* Broker Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {broker.user_profiles.full_name}
                              </h3>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm text-gray-600">{broker.rating.toFixed(1)}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Briefcase className="w-4 h-4 mr-1" />
                                {broker.experience_years} years exp.
                              </div>
                              <div className="flex items-center">
                                <Award className="w-4 h-4 mr-1" />
                                License: {broker.license_number}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {broker.commission_rate}% commission
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 mb-3">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{broker.user_profiles.phone}</span>
                            </div>

                            {/* Specializations */}
                            <div className="flex flex-wrap gap-2">
                              {broker.specializations.map((spec) => (
                                <span
                                  key={spec}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationBadgeColor(spec)}`}
                                >
                                  {spec.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="ml-4 flex-shrink-0">
                          {rental.assigned_broker_id === broker.id ? (
                            <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                              <Check className="w-4 h-4 mr-1" />
                              Assigned
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAssignBroker(broker.id)}
                              disabled={saving}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {saving ? 'Assigning...' : 'Assign'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{broker.total_properties}</div>
                          <div className="text-xs text-gray-500">Properties Managed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {broker.availability_status === 'available' ? 'Available' : 'Busy'}
                          </div>
                          <div className="text-xs text-gray-500">Status</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{broker.rating.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Property Info */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Property Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Property</p>
                  <p className="font-medium text-gray-900">{rental.properties?.title}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{rental.properties?.city}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{rental.properties?.property_type}</p>
                </div>
              </div>
            </div>

            {/* Assignment Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-medium text-blue-900 mb-2">💡 Assignment Tips</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Choose brokers with rental experience</p>
                <p>• Consider location specialization</p>
                <p>• Check availability status</p>
                <p>• Review commission rates</p>
                <p>• Look at performance ratings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unassign Confirmation Modal */}
      {showUnassignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Unassign Broker
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to unassign the current broker from this rental property? 
                      This action will remove their access to manage this listing.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleUnassignBroker}
                  disabled={saving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {saving ? 'Unassigning...' : 'Unassign'}
                </button>
                <button
                  onClick={() => setShowUnassignModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}