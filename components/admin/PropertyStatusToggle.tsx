'use client';
import React, { useState } from 'react';
import { Check, ChevronDown, AlertCircle, Eye, EyeOff, DollarSign, Home, Clock, XCircle } from 'lucide-react';

interface PropertyStatusToggleProps {
  propertyId: string;
  currentStatus: string;
  propertyTitle: string;
  onStatusChange?: (newStatus: string) => void;
  disabled?: boolean;
}

// Status configuration with icons and colors
const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: Eye,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Visible to public, actively marketed'
  },
  available: {
    label: 'Available',
    icon: Home,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Ready for viewing and offers'
  },
  for_sale: {
    label: 'For Sale',
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Listed for purchase'
  },
  for_rent: {
    label: 'For Rent',
    icon: Home,
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Available for rental'
  },
  'For Sale': {
    label: 'For Sale (Legacy)',
    icon: DollarSign,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Legacy format - consider updating to "for_sale"'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Under review or processing'
  },
  sold: {
    label: 'Sold',
    icon: Check,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Transaction completed'
  },
  rented: {
    label: 'Rented',
    icon: Check,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Currently rented'
  },
  draft: {
    label: 'Draft',
    icon: EyeOff,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Not yet published'
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Hidden from public view'
  }
} as const;

const PUBLIC_VISIBLE_STATUSES = ['active', 'available', 'for_sale', 'for_rent', 'For Sale'];

export default function PropertyStatusToggle({
  propertyId,
  currentStatus,
  propertyTitle,
  onStatusChange,
  disabled = false
}: PropertyStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || {
    label: currentStatus,
    icon: AlertCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Unknown status'
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Call parent callback
      onStatusChange?.(newStatus);
      
      // Close dropdown
      setIsOpen(false);
      
      // Show success message briefly
      setTimeout(() => {
        // Could add a toast notification here
      }, 100);

    } catch (error) {
      console.error('Error updating property status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const isPublicVisible = PUBLIC_VISIBLE_STATUSES.includes(currentStatus);
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="relative">
      {/* Current Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium
          transition-all duration-200 min-w-[120px] justify-between
          ${currentConfig.color}
          ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
          ${isOpen ? 'ring-2 ring-blue-200' : ''}
        `}
        title={currentConfig.description}
      >
        <div className="flex items-center gap-1.5">
          <CurrentIcon className="w-3.5 h-3.5" />
          <span>{currentConfig.label}</span>
          {!isPublicVisible && (
            <EyeOff className="w-3 h-3 opacity-60" title="Hidden from public" />
          )}
        </div>
        {!disabled && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Status Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              Update Status for "{propertyTitle.slice(0, 30)}..."
            </div>
            
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const StatusIcon = config.icon;
              const isSelected = status === currentStatus;
              const willBeVisible = PUBLIC_VISIBLE_STATUSES.includes(status);
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-md text-sm
                    transition-colors duration-150
                    ${isSelected 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'hover:bg-gray-50 text-gray-700'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="font-medium">{config.label}</span>
                    {willBeVisible ? (
                      <Eye className="w-3 h-3 text-green-500" title="Visible to public" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" title="Hidden from public" />
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="border-t border-gray-100 p-2 bg-gray-50 rounded-b-lg">
            <div className="text-xs text-gray-600 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-green-500" />
                <span>Public visible</span>
              </div>
              <div className="flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-gray-400" />
                <span>Hidden</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-red-50 border border-red-200 rounded-lg p-2 z-50">
          <div className="flex items-center gap-2 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}