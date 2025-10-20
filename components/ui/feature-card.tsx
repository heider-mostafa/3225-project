'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  badge?: string;
  gradient?: string;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  badge,
  gradient = 'from-blue-50 to-blue-100',
  className,
  delay = 0,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 10
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Background Gradient on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Badge */}
      {badge && (
        <motion.div 
          className="absolute top-4 right-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          <Badge 
            variant="secondary" 
            className="text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-purple-100"
          >
            {badge}
          </Badge>
        </motion.div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div 
          className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300`}
          whileHover={{ rotate: 5 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
        
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 text-lg group-hover:text-blue-900 transition-colors duration-300">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
        
        {/* Hover Arrow */}
        <motion.div 
          className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
        >
          <span className="text-blue-600 text-sm font-medium mr-1">Learn more</span>
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </motion.div>
      </div>
      
      {/* Subtle Border Glow on Hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
           style={{ 
             background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
             filter: 'blur(0.5px)'
           }} 
      />
    </motion.div>
  );
};

export default FeatureCard;