import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // SafeCircle Custom Variants
        emergency:
          "bg-gradient-to-br from-emergency to-emergency/80 text-emergency-foreground shadow-glow-emergency hover:shadow-xl animate-pulse-glow",
        success:
          "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-glow-success hover:shadow-xl",
        trust:
          "bg-gradient-to-br from-trust to-trust/80 text-trust-foreground shadow-glow-trust hover:shadow-xl",
        silent:
          "bg-gradient-to-br from-silent to-silent/80 text-silent-foreground shadow-lg hover:shadow-xl",
        warning:
          "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground shadow-lg hover:shadow-xl",
        glass:
          "bg-white/20 backdrop-blur-xl border border-white/30 text-foreground hover:bg-white/30 shadow-lg",
        "glass-dark":
          "bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-black/30 shadow-lg",
        premium:
          "bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground shadow-glow-primary hover:shadow-xl",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
