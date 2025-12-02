import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'neon' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-display tracking-wide uppercase relative overflow-hidden",
                    {
                        "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]": variant === "default",
                        "border border-input bg-background hover:bg-white/5 hover:text-white": variant === "outline",
                        "hover:bg-white/5 hover:text-white": variant === "ghost",
                        "bg-transparent border border-primary text-primary hover:bg-primary hover:text-black shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]": variant === "neon",
                        "bg-destructive text-white hover:bg-destructive/90 shadow-[0_0_20px_rgba(255,0,85,0.3)]": variant === "destructive",
                        "h-10 px-4 py-2": size === "default",
                        "h-9 rounded-md px-3": size === "sm",
                        "h-11 rounded-md px-8": size === "lg",
                        "h-10 w-10": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
