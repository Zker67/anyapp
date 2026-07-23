import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'group/button inline-flex max-w-full min-w-0 select-none items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap outline-none transition-[background,border-color,color,transform,box-shadow,opacity] duration-150 active:not-disabled:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'border-primary/40 bg-primary text-primary-foreground shadow-[0_4px_14px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary)_92%,white)]',
        primary: 'border-primary/40 bg-primary text-primary-foreground shadow-[0_4px_14px_color-mix(in_srgb,var(--primary)_20%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary)_92%,white)]',
        secondary: 'border-border bg-secondary text-secondary-foreground hover:border-[var(--border-bright)] hover:bg-[var(--row-hover-background)]',
        outline: 'border-border bg-transparent text-[var(--text-soft)] hover:border-[var(--border-bright)] hover:bg-[var(--row-hover-background)] hover:text-foreground',
        ghost: 'border-transparent bg-transparent text-[var(--text-soft)] shadow-none hover:bg-[var(--row-hover-background)] hover:text-foreground',
        destructive: 'border-destructive/34 bg-destructive/12 text-destructive shadow-[var(--inner-light)] hover:border-destructive/55 hover:bg-destructive/20 hover:text-red-100',
        danger: 'border-destructive/34 bg-destructive/12 text-destructive shadow-[var(--inner-light)] hover:border-destructive/55 hover:bg-destructive/20 hover:text-red-100',
      },
      size: {
        default: 'h-9 px-3.5',
        md: 'h-9 px-3.5',
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-2.5 text-xs',
        lg: 'h-11 px-5',
        icon: 'size-9 p-0',
        'icon-sm': 'size-8 p-0',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'default', size: 'md', fullWidth: false },
  },
)

export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
  icon?: ReactNode
  trailingIcon?: ReactNode
}

export function Button({ children, className, variant, size, fullWidth, icon, trailingIcon, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive className={cn(buttonVariants({ variant, size, fullWidth }), className)} data-slot="button" {...props}>
      {icon}
      {children}
      {trailingIcon}
    </ButtonPrimitive>
  )
}
