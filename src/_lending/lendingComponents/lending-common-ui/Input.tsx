import React, { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/_aaa_sheetChat/_utils/lending-utils/lending-utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    startIcon,
    endIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseStyles = "flex w-full rounded-lg border bg-white px-3 py-2.5 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
    
    const variantStyles = error 
      ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"

    const iconPadding = {
      left: startIcon ? "pl-10" : "",
      right: endIcon ? "pr-10" : ""
    }

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {startIcon}
              </div>
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              baseStyles,
              variantStyles,
              iconPadding.left,
              iconPadding.right,
              className
            )}
            ref={ref}
            id={inputId}
            {...props}
          />
          
          {endIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {endIcon}
              </div>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <p className="text-red-600 flex items-center gap-1">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            ) : (
              <p className="text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }