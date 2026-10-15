import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Botões do UI Kit: hierarquia consistente para decisões rápidas e seguras. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-border bg-card text-foreground hover:bg-secondary",
        gold: "border-gold-500/45 bg-gold-100 text-gold-600 hover:bg-gold-400/35 dark:border-gold-500/40 dark:bg-gold-500/15 dark:text-gold-400",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-secondary",
        danger: "border-danger/30 bg-danger-bg text-danger hover:bg-danger/15",
        link: "border-transparent bg-transparent text-info underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-8 px-3 py-1.5 text-[11px]",
        md: "min-h-9 px-3.5 py-2 text-[11px]",
        lg: "min-h-11 px-5 py-2.5 text-[13px]",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  size?: "icon" | "icon-sm";
}

/** Botão quadrado para ações iconográficas (coluna de ações, fechar painel…). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "icon", ...props }, ref) => (
    <Button ref={ref} size={size} {...props} />
  ),
);
IconButton.displayName = "IconButton";
