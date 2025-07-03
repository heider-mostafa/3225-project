"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, RefreshCw, TrendingUp } from 'lucide-react'

interface ViewStats {
  stats: {
    totalProperties: number
    totalViewsFromTable: number
    totalViewsFromCount: number
    propertiesWithViews: number
    averageViews: string
    maxViews: number
    minViews: number
  }
  topProperties: Array<{
    id: string
    title: string
    view_count: number
    created_at: string
  }>
  noViewsProperties: Array<{
    id: string
    title: string
    created_at: string
  }>
  sampleProperties: Array<{
    id: string
    title: string
    view_count: number
  }>
}

export default function ViewCounterDebugPage() {
  const [viewStats, setViewStats] = useState<ViewStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [testPropertyId, setTestPropertyId] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  const fetchViewStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/properties/view-stats')
      const data = await response.json()
      setViewStats(data)
    } catch (error) {
      console.error('Error fetching view stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const testViewIncrement = async () => {
    if (!testPropertyId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/properties/${testPropertyId}/view`, {
        method: 'POST'
      })
      const data = await response.json()
      setTestResult(data)
      
      // Refresh stats after test
      setTimeout(fetchViewStats, 1000)
    } catch (error) {
      console.error('Error testing view increment:', error)
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchViewStats()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">View Counter Debug Tool</h1>
        <Button onClick={fetchViewStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {viewStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Properties:</span>
                  <Badge variant="outline">{viewStats.stats.totalProperties}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Properties with Views:</span>
                  <Badge variant="outline">{viewStats.stats.propertiesWithViews}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Average Views:</span>
                  <Badge variant="outline">{viewStats.stats.averageViews}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                View Counts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>From property_views:</span>
                  <Badge>{viewStats.stats.totalViewsFromTable}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>From view_count:</span>
                  <Badge>{viewStats.stats.totalViewsFromCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Max Views:</span>
                  <Badge variant="secondary">{viewStats.stats.maxViews}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test View Increment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Property ID"
                  value={testPropertyId}
                  onChange={(e) => setTestPropertyId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <Button onClick={testViewIncrement} disabled={loading || !testPropertyId}>
                  Test View Increment
                </Button>
                {testResult && (
                  <div className={`p-3 rounded-md text-sm ${
                    testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Properties */}
      {viewStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Viewed Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {viewStats.topProperties.map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{property.title}</div>
                      <div className="text-xs text-slate-500">ID: {property.id}</div>
                    </div>
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      {property.view_count} views
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Properties with No Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {viewStats.noViewsProperties.length > 0 ? (
                  viewStats.noViewsProperties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{property.title}</div>
                        <div className="text-xs text-slate-500">ID: {property.id}</div>
                      </div>
                      <Badge variant="outline">0 views</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    🎉 All properties have views!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sample Properties for Testing */}
      {viewStats && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sample Properties for Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewStats.sampleProperties.map((property) => (
                <div key={property.id} className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">{property.title}</div>
                  <div className="text-sm text-slate-500 mb-2">ID: {property.id}</div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{property.view_count} views</Badge>
                    <Button
                      size="sm"
                      onClick={() => setTestPropertyId(property.id)}
                      variant="outline"
                    >
                      Use for Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 