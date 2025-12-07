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
  disabled?: boolean
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
  placeholder?: string
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

interface SelectItemElement {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchable: boolean
  disabled: boolean
}

const SelectContext = React.createContext<SelectContextType | null>(null)

const useSelectContext = () => {
  const context = React.useContext(SelectContext) 
  if (!context) {
    throw new Error("Select components must be used within a Select provider")
  }
  return context
}

const getSelectedChild = (children: React.ReactNode, value: string): React.ReactElement<SelectItemProps> | null => {
  const childArray = React.Children.toArray(children) as React.ReactElement[]
  const selectedChild = childArray.find((child) => {
    return React.isValidElement<SelectItemProps>(child) &&
           'value' in child.props &&
           (child.props as SelectItemProps).value === value
  })
  return selectedChild as React.ReactElement<SelectItemProps> || null
}

const filterChildren = (children: React.ReactNode, searchQuery: string): React.ReactNode[] => {
  if (!searchQuery.trim()) return React.Children.toArray(children)

  return React.Children.toArray(children).filter((child) => {
    if (!React.isValidElement<SelectItemProps>(child) || !('value' in child.props)) {
      return false
    }

    const props = child.props
    if (props.value === "Custom") return false

    const childrenText = React.Children.toArray(props.children)
      .map(child => {
        if (typeof child === 'string') return child
        if (React.isValidElement(child) && child.props && typeof child.props === 'object' && child.props !== null && 'children' in child.props && typeof (child.props as { children: unknown }).children === 'string') {
          return (child.props as { children: string }).children
        }
        return ''
      })
      .join(' ')
      .toLowerCase()

    return childrenText.includes(searchQuery.toLowerCase())
  })
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
  className,
  searchable = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const contextValue: SelectContextType = {
    value,
    onValueChange,
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    searchable,
    disabled
  }

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, placeholder }, ref) => {
    const { isOpen, setIsOpen, value, disabled } = useSelectContext()
    const selectedChild = getSelectedChild(children, value)

    const handleClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
      }
    }

    const displayValue = selectedChild ?
      selectedChild.props.children :
      (value || placeholder || children)

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white whitespace-nowrap ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate flex-1 text-left">
          {displayValue}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform flex-shrink-0",
          isOpen && "rotate-180",
          disabled && "opacity-30"
        )} />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, className }, ref) => {
    const {
      isOpen,
      setIsOpen,
      searchQuery,
      setSearchQuery,
      searchable,
      value,
      onValueChange,
      disabled
    } = useSelectContext()

    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

    const filteredChildren = React.useMemo(() =>
      searchable ? filterChildren(children, searchQuery) : React.Children.toArray(children),
      [children, searchable, searchQuery]
    )

    const selectableItems = React.useMemo(() =>
      filteredChildren.filter((child) =>
        React.isValidElement<SelectItemProps>(child) &&
        'value' in child.props &&
        !child.props.disabled
      ),
      [filteredChildren]
    )

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (contentRef.current && !contentRef.current.contains(target)) {
          setIsOpen(false)
          setSearchQuery("")
          setHighlightedIndex(-1)
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

    React.useEffect(() => {
      setHighlightedIndex(-1)
    }, [isOpen, searchQuery])

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev =>
            prev < selectableItems.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : selectableItems.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
            const selectedItem = selectableItems[highlightedIndex] as React.ReactElement<SelectItemProps>
            onValueChange(selectedItem.props.value)
            setIsOpen(false)
            setSearchQuery("")
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setSearchQuery("")
          setHighlightedIndex(-1)
          break
      }
    }

    if (!isOpen) return null

    return (
      <div
        ref={ref || contentRef}
        className={cn(
          "absolute top-full left-0 z-50 mt-1 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-600 bg-gray-700 text-white shadow-md",
          className
        )}
        data-select-content
        role="listbox"
        onKeyDown={handleKeyDown}
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
          {filteredChildren.map((child, index) => {
            if (!React.isValidElement<SelectItemProps>(child) || !('value' in child.props)) {
              return child
            }

            const childElement = child as React.ReactElement<SelectItemProps>
            const isHighlighted = index === highlightedIndex
            const isSelected = childElement.props.value === value

            return React.cloneElement(childElement, {
              className: cn(
                childElement.props.className,
                isHighlighted && !isSelected && "bg-gray-600",
                isSelected && "bg-gray-600"
              ),
              'aria-selected': isSelected,
              'data-highlighted': isHighlighted
            } as SelectItemProps & { 'aria-selected': boolean; 'data-highlighted': boolean })
          })}
        </div>
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ value, children, className, disabled = false }, ref) => {
    const { onValueChange, setIsOpen, value: selectedValue, setSearchQuery } = useSelectContext()
    const isSelected = selectedValue === value

    const handleClick = () => {
      if (!disabled) {
        onValueChange(value)
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-600",
          isSelected && "bg-gray-600",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        role="option"
        aria-selected={isSelected}
      >
        {children}
      </button>
    )
  }
)
SelectItem.displayName = "SelectItem"

const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({
  placeholder,
  className
}) => {
  const { value } = useSelectContext()

  return (
    <span className={className}>
      {value || placeholder}
    </span>
  )
}
SelectValue.displayName = "SelectValue"

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}