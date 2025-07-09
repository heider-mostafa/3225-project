'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, HeartOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SavePropertyButtonProps {
  propertyId: string;
  initialSaved?: boolean;
}

export function SavePropertyButton({ propertyId, initialSaved = false }: SavePropertyButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleSave = async () => {
    try {
      setIsLoading(true);
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`/api/properties/${propertyId}/save`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Please sign in to save properties');
        }
        if (response.status === 404) {
          throw new Error('Property not found');
        }
        throw new Error(errorData.error || 'Failed to update saved status');
      }

      setIsSaved(!isSaved);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('savedPropertiesChanged', {
        detail: { propertyId, saved: !isSaved }
      }));
      
      toast({
        title: isSaved ? 'Property removed from saved' : 'Property saved successfully!',
        description: isSaved 
          ? 'The property has been removed from your saved properties.'
          : 'The property has been added to your saved properties. You can view it in your profile.',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error toggling save:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update saved status. Please try again.',
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave();
      }}
      disabled={isLoading}
      className={`px-2 sm:px-4 py-2 ${
        isSaved 
          ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
          : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-300 hover:border-red-400'
      } transition-all duration-200`}
      title={isSaved ? 'Remove from saved' : 'Save property'}
    >
      {isSaved ? (
        <Heart className="h-4 w-4 sm:mr-2 fill-current" />
      ) : (
        <Heart className="h-4 w-4 sm:mr-2" />
      )}
      <span className="hidden sm:inline">
        {isLoading ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}
      </span>
    </Button>
  );
} 