'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Grid } from './Grid'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface CardGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export function CardGrid({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'lg',
}: CardGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <Grid cols={cols} gap={gap}>
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={fadeInUp}>
            {child}
          </motion.div>
        ))}
      </Grid>
    </motion.div>
  )
}

