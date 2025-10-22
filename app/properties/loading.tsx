import { Skeleton } from '@/components/ui/skeleton'

export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
        
        {/* Filters Skeleton */}
        <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Results Count and Sort Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        {/* Property Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Property Image Skeleton */}
              <Skeleton className="h-48 w-full" />
              
              {/* Property Content Skeleton */}
              <div className="p-4 space-y-3">
                {/* Price */}
                <Skeleton className="h-6 w-24" />
                
                {/* Title */}
                <Skeleton className="h-5 w-3/4" />
                
                {/* Location */}
                <Skeleton className="h-4 w-1/2" />
                
                {/* Property Details */}
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
