'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Shield, Info } from 'lucide-react'
import Link from 'next/link'

interface Assignment {
  id: string
  property_id: string
  broker_id: string
  is_primary: boolean
  brokers: {
    full_name: string
    email: string
    phone: string
  }
  properties: {
    title: string
    address: string
  }
}

export default function TestBrokerAssignment() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    property_id: '',
    broker_id: '',
    is_primary: false
  })

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/admin/assign-broker')
      const data = await response.json()
      if (data.assignments) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const assignBroker = async () => {
    if (!formData.property_id || !formData.broker_id) {
      alert('Please fill in both Property ID and Broker ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/assign-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        alert('Broker assigned successfully!')
        setFormData({ property_id: '', broker_id: '', is_primary: false })
        loadAssignments()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error assigning broker:', error)
      alert('Failed to assign broker')
    } finally {
      setLoading(false)
    }
  }

  const grantAdmin = async () => {
    try {
      const response = await fetch('/api/admin/grant-admin', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        alert('Admin access granted! You can now access /admin/users')
      } else {
        alert('Info: ' + result.message)
      }
    } catch (error) {
      alert('Failed to grant admin access')
    }
  }

  const grantSuperadmin = async () => {
    try {
      const response = await fetch('/api/admin/grant-superadmin', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        alert('Superadmin access granted! You can now access /admin/users')
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Failed to grant superadmin access')
    }
  }

  const checkDebugInfo = async () => {
    try {
      const response = await fetch('/api/admin/debug')
      const result = await response.json()
      console.log('Debug info:', result)
      alert('Check console for debug information')
    } catch (error) {
      alert('Failed to get debug info')
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Admin Link Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Admin Interface Available</h3>
            <p className="text-blue-700 text-sm mt-1">
              This is a development/testing page. For a better experience, use the admin interface.
            </p>
            <Link href="/admin/brokers" className="inline-flex items-center space-x-2 mt-3 text-blue-600 hover:text-blue-700 font-medium">
              <Shield className="w-4 h-4" />
              <span>Go to Admin Broker Management</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Broker Assignment Test Page</h1>
        <div className="space-x-2">
          <Button onClick={checkDebugInfo} variant="outline">
            Check Debug Info
          </Button>
          <Button onClick={grantAdmin} variant="outline">
            Grant Admin
          </Button>
          <Button onClick={grantSuperadmin} variant="outline">
            Grant Superadmin
          </Button>
        </div>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Broker to Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="property_id">Property ID</Label>
            <Input
              id="property_id"
              value={formData.property_id}
              onChange={(e) => setFormData({...formData, property_id: e.target.value})}
              placeholder="Enter property ID"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can get property IDs from the properties page or database
            </p>
          </div>

          <div>
            <Label htmlFor="broker_id">Broker ID</Label>
            <Input
              id="broker_id"
              value={formData.broker_id}
              onChange={(e) => setFormData({...formData, broker_id: e.target.value})}
              placeholder="Enter broker ID"
            />
            <p className="text-sm text-gray-500 mt-1">
              Sample broker IDs: broker_1, broker_2, broker_3, broker_4
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary}
              onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
            />
            <Label htmlFor="is_primary">Set as Primary Broker</Label>
          </div>

          <Button onClick={assignBroker} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Broker'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Broker Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-gray-500">No broker assignments found</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border p-4 rounded">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold">Property</h3>
                      <p>{assignment.properties?.title || 'Unknown Property'}</p>
                      <p className="text-sm text-gray-500">{assignment.properties?.address}</p>
                      <p className="text-xs text-gray-400">ID: {assignment.property_id}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Broker</h3>
                      <p>{assignment.brokers?.full_name || 'Unknown Broker'}</p>
                      <p className="text-sm text-gray-500">{assignment.brokers?.email}</p>
                      <p className="text-xs text-gray-400">ID: {assignment.broker_id}</p>
                      {assignment.is_primary && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-2">
            <p><strong>Step 1a:</strong> Click "Grant Admin" to get basic admin access (recommended)</p>
            <p><strong>Step 1b:</strong> Or click "Grant Superadmin" for full superadmin access</p>
            <p><strong>Step 2:</strong> Use sample broker IDs (broker_1, broker_2, etc.) from the migration</p>
            <p><strong>Step 3:</strong> Use any property ID from your properties table</p>
            <p><strong>Step 4:</strong> Test the broker calendar on property pages</p>
            <p><strong>Debug:</strong> Click "Check Debug Info" to see your current role status</p>
            <p className="text-gray-600 italic">Note: Any admin role can now access /admin/users - no more restrictions!</p>
            <p className="text-blue-600 font-medium">
              💡 Tip: For better UI experience, use the <Link href="/admin/brokers" className="underline">Admin Broker Management</Link> page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 