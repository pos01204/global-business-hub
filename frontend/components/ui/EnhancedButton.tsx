'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { Button, ButtonProps } from './Button'
import { Tooltip } from './Tooltip'

export interface EnhancedButtonProps extends ButtonProps {
  tooltip?: string
  tooltipDelay?: number
}

export const EnhancedButton = memo(function EnhancedButton({
  tooltip,
  tooltipDelay = 300,
  ...props
}: EnhancedButtonProps) {
  const button = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Button {...props} />
    </motion.div>
  )

  if (tooltip) {
    return (
      <Tooltip content={tooltip} delay={tooltipDelay}>
        {button}
      </Tooltip>
    )
  }

  return button
})
