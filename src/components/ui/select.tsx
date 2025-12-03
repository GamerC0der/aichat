"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be used within Select")

  const { isOpen, setIsOpen, value } = context

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white whitespace-nowrap ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <span className="truncate flex-1 text-left">
        {React.Children.toArray(children).find(
          (child) => React.isValidElement(child) && child.props.value === value
        ) || children}
      </span>
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
    </button>
  )
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectContent must be used within Select")

  const { isOpen, setIsOpen } = context

  React.useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "absolute top-full left-0 z-50 mt-1 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-600 bg-gray-700 text-white shadow-md",
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be used within Select")

  const { onValueChange, setIsOpen, value: selectedValue } = context

  const handleClick = () => {
    onValueChange(value)
    setIsOpen(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-600",
        selectedValue === value && "bg-gray-600",
        className
      )}
    >
      {selectedValue === value && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      {children}
    </button>
  )
}

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be used within Select")

  return <span>{context.value || placeholder}</span>
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}