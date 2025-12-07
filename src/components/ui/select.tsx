"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
  searchable?: boolean
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
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchable: boolean
} | null>(null)

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className, searchable = false }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, searchQuery, setSearchQuery, searchable }}>
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
          (child) => React.isValidElement(child) && (child.props as any).value === value
        ) || children}
      </span>
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
    </button>
  )
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectContent must be used within Select")

  const { isOpen, setIsOpen, searchQuery, setSearchQuery, searchable } = context
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-select-content]') === null) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }
    if (isOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen, setIsOpen, setSearchQuery])

  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  if (!isOpen) return null

  const filteredChildren = searchable && searchQuery
    ? React.Children.toArray(children).filter((child) => {
        if (React.isValidElement(child)) {
          const props = child.props as any
          if (props.value === "Custom") {
            return false
          }
          if (props.children) {
            return props.children.toString().toLowerCase().includes(searchQuery.toLowerCase())
          }
        }
        return true
      })
    : children

  return (
    <div
      data-select-content
      className={cn(
        "absolute top-full left-0 z-50 mt-1 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-600 bg-gray-700 text-white shadow-md",
        className
      )}
    >
      {searchable && (
        <div className="p-2 border-b border-gray-600">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="max-h-60 overflow-y-auto p-1">
        {filteredChildren}
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