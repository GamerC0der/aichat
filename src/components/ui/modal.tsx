"use client"

import * as React from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={`relative z-10 bg-gray-900 text-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 ${className || ""}`}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className || ""}`} {...props}>
      {children}
    </div>
  )
}

export function ModalBody({
  children,
  className
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className || ""}>
      {children}
    </div>
  )
}

export function ModalFooter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mt-4 flex justify-end space-x-2 ${className || ""}`}>
      {children}
    </div>
  )
}
