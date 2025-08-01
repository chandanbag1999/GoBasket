import { cva, type VariantProps } from "class-variance-authority"

/**
 * Button variants for consistent styling across the app
 * Inspired by Blinkit's button design system
 */
export const buttonVariants = cva(
  // Base styles - mobile-first approach
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-md hover:bg-primary-600 active:bg-primary-700",
        destructive: "bg-error-500 text-white shadow-md hover:bg-error-600 active:bg-error-700",
        outline: "border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:bg-gray-100",
        secondary: "bg-secondary-500 text-white shadow-md hover:bg-secondary-600 active:bg-secondary-700",
        ghost: "text-gray-900 hover:bg-gray-100 active:bg-gray-200",
        link: "text-primary-500 underline-offset-4 hover:underline active:text-primary-600",
        success: "bg-success-500 text-white shadow-md hover:bg-success-600 active:bg-success-700",
        warning: "bg-warning-500 text-white shadow-md hover:bg-warning-600 active:bg-warning-700",
      },
      size: {
        default: "h-11 px-4 py-2 min-w-[44px]", // 44px minimum for touch targets
        sm: "h-9 px-3 text-xs min-w-[36px]",
        lg: "h-12 px-6 text-base min-w-[48px]",
        xl: "h-14 px-8 text-lg min-w-[56px]",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Input variants for form elements
 */
export const inputVariants = cva(
  "flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      size: {
        default: "h-11 text-base", // Larger for mobile
        sm: "h-9 text-sm",
        lg: "h-12 text-lg",
      },
      variant: {
        default: "",
        error: "border-error-500 focus:border-error-500 focus:ring-error-500/20",
        success: "border-success-500 focus:border-success-500 focus:ring-success-500/20",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

/**
 * Card variants for content containers
 */
export const cardVariants = cva(
  "rounded-lg border bg-white shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-gray-200",
        elevated: "border-gray-200 shadow-medium",
        outlined: "border-2 border-gray-300",
        ghost: "border-transparent shadow-none",
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-4",
        md: "p-5",
        lg: "p-6",
        xl: "p-8",
      },
      hover: {
        true: "hover:shadow-medium hover:border-gray-300 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      hover: false,
    },
  }
)

/**
 * Badge variants for status indicators
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        primary: "bg-primary-100 text-primary-800",
        secondary: "bg-secondary-100 text-secondary-800",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        error: "bg-error-100 text-error-800",
        outline: "border border-gray-300 text-gray-700",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-xs px-2 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Avatar variants for user profile images
 */
export const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/**
 * Alert variants for notifications
 */
export const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-gray-50 border-gray-200 text-gray-800",
        success: "bg-success-50 border-success-200 text-success-800",
        warning: "bg-warning-50 border-warning-200 text-warning-800",
        error: "bg-error-50 border-error-200 text-error-800",
        info: "bg-primary-50 border-primary-200 text-primary-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Skeleton variants for loading states
 */
export const skeletonVariants = cva(
  "animate-pulse rounded-md bg-gray-200",
  {
    variants: {
      variant: {
        default: "",
        text: "h-4",
        avatar: "rounded-full",
        button: "h-11",
        card: "h-32",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Spinner variants for loading indicators
 */
export const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-gray-600",
        primary: "text-primary-500",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

/**
 * Container variants for layout
 */
export const containerVariants = cva(
  "mx-auto w-full",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        full: "max-w-full",
      },
      padding: {
        none: "",
        sm: "px-4",
        default: "px-4 sm:px-6",
        lg: "px-4 sm:px-6 lg:px-8",
      },
    },
    defaultVariants: {
      size: "7xl",
      padding: "default",
    },
  }
)

// Export types for TypeScript
export type ButtonVariants = VariantProps<typeof buttonVariants>
export type InputVariants = VariantProps<typeof inputVariants>
export type CardVariants = VariantProps<typeof cardVariants>
export type BadgeVariants = VariantProps<typeof badgeVariants>
export type AvatarVariants = VariantProps<typeof avatarVariants>
export type AlertVariants = VariantProps<typeof alertVariants>
export type SkeletonVariants = VariantProps<typeof skeletonVariants>
export type SpinnerVariants = VariantProps<typeof spinnerVariants>
export type ContainerVariants = VariantProps<typeof containerVariants>
