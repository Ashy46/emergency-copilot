"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2, LucideIcon } from "lucide-react";

export type ButtonVariant =
  | "default"
  | "primary"
  | "emergency"
  | "resolve"
  | "ghost"
  | "glass";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Button content */
  children?: ReactNode;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Lucide icon to show before text */
  icon?: LucideIcon;
  /** Lucide icon to show after text */
  iconRight?: LucideIcon;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * ActionButton - Large, high-contrast buttons with technical-glass look
 *
 * Features:
 * - Technical glass effect for ghost/glass variants
 * - Gradient backgrounds for action variants
 * - Glow effects on hover
 * - Minimum 44px touch targets for accessibility
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      children,
      variant = "default",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      btn-action
      focus-ring
      touch-target
      inline-flex
      items-center
      justify-center
      gap-2
      font-medium
      transition-all
      duration-200
      ${fullWidth ? "w-full" : ""}
    `;

    const variantClasses: Record<ButtonVariant, string> = {
      default: `
        bg-surface-elevated
        border-border-default
        text-text-primary
        hover:bg-surface-hover
        hover:border-border-strong
      `,
      primary: `
        btn-action-primary
        bg-gradient-to-r
        from-active-start
        to-active-mid
        border-transparent
        text-white
        hover:from-active-mid
        hover:to-active-end
        hover:shadow-[0_0_20px_var(--status-active-glow)]
      `,
      emergency: `
        btn-action-emergency
        bg-gradient-to-r
        from-emergency-start
        to-emergency-mid
        border-transparent
        text-white
        hover:from-emergency-mid
        hover:to-emergency-end
        hover:shadow-[0_0_20px_var(--status-live-glow)]
      `,
      resolve: `
        btn-action-resolve
        bg-gradient-to-r
        from-resolved-start
        to-resolved-mid
        border-transparent
        text-white
        hover:from-resolved-mid
        hover:to-resolved-end
        hover:shadow-[0_0_20px_var(--status-resolved-glow)]
      `,
      ghost: `
        bg-transparent
        border-transparent
        text-text-secondary
        hover:bg-surface-card
        hover:text-text-primary
        hover:border-border-subtle
      `,
      glass: `
        btn-glass
        bg-white/[0.03]
        backdrop-blur-xl
        border-border-subtle
        text-text-primary
        hover:bg-white/[0.06]
        hover:border-border-default
      `,
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs min-h-[36px]",
      md: "px-4 py-2 text-sm min-h-[44px]",
      lg: "px-6 py-3 text-base min-h-[52px]",
      icon: "p-2 min-h-[44px] min-w-[44px]",
    };

    const iconSizes: Record<ButtonSize, number> = {
      sm: 14,
      md: 16,
      lg: 18,
      icon: 20,
    };

    const isDisabled = disabled || loading;
    const iconSize = iconSizes[size];

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : Icon ? (
          <Icon size={iconSize} strokeWidth={1.5} />
        ) : null}

        {children && size !== "icon" && <span>{children}</span>}

        {IconRight && !loading && size !== "icon" && (
          <IconRight size={iconSize} strokeWidth={1.5} />
        )}
      </button>
    );
  }
);

ActionButton.displayName = "ActionButton";

/**
 * ButtonGroup - Container for grouping buttons
 */
export interface ButtonGroupProps {
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = "horizontal",
  className = "",
}: ButtonGroupProps) {
  const orientationClasses = {
    horizontal: "flex-row gap-2",
    vertical: "flex-col gap-2",
  };

  return (
    <div className={`flex ${orientationClasses[orientation]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * IconButton - Shorthand for icon-only buttons
 */
export interface IconButtonProps
  extends Omit<ActionButtonProps, "children" | "size" | "icon"> {
  icon: LucideIcon;
  label: string; // Required for accessibility
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <ActionButton
      variant={variant}
      size="icon"
      icon={icon}
      aria-label={label}
      title={label}
      {...props}
    />
  );
}

/**
 * Dispatcher Action Buttons - Pre-configured buttons for common dispatcher actions
 */
export function ResolveButton(props: Omit<ActionButtonProps, "variant">) {
  return <ActionButton variant="resolve" {...props} />;
}

export function EscalateButton(props: Omit<ActionButtonProps, "variant">) {
  return <ActionButton variant="emergency" {...props} />;
}

export function DispatchButton(props: Omit<ActionButtonProps, "variant">) {
  return <ActionButton variant="primary" {...props} />;
}
