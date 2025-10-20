'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, HeartOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import type { ButtonProps } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SavePropertyButtonProps {
  propertyId: string;
  initialSaved?: boolean;
  className?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

export function SavePropertyButton({ 
  propertyId, 
  initialSaved = false, 
  className,
  variant = "outline",
  size = "default"
}: SavePropertyButtonProps) {
  const { t } = useTranslation();
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
          throw new Error(t('properties.signInToSave'));
        }
        if (response.status === 404) {
          throw new Error(t('properties.propertyNotFound'));
        }
        throw new Error(errorData.error || t('properties.failedToUpdateSavedStatus'));
      }

      setIsSaved(!isSaved);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('savedPropertiesChanged', {
        detail: { propertyId, saved: !isSaved }
      }));
      
      toast({
        title: isSaved ? t('properties.propertyRemovedFromSaved') : t('properties.propertySavedSuccessfully'),
        description: isSaved 
          ? t('properties.propertyRemovedDescription')
          : t('properties.propertySavedDescription'),
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error toggling save:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('properties.failedToUpdateSavedStatusRetry'),
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isSaved ? "default" : variant}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave();
      }}
      disabled={isLoading}
      className={cn(
        `px-2 sm:px-4 py-2 ${
          isSaved 
            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
            : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-300 hover:border-red-400'
        } transition-all duration-200`,
        className
      )}
      title={isSaved ? t('properties.removeFromSaved') : t('properties.saveProperty')}
    >
      {isSaved ? (
        <Heart className="h-4 w-4 sm:mr-2 fill-current" />
      ) : (
        <Heart className="h-4 w-4 sm:mr-2" />
      )}
      <span className="hidden sm:inline">
        {isLoading ? t('properties.saving') : (isSaved ? t('properties.saved') : t('properties.save'))}
      </span>
    </Button>
  );
} 