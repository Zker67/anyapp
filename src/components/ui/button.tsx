import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'group/button inline-flex max-w-full min-w-0 select-none items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap outline-none transition-[background,border-color,color,transform,box-shadow,opacity] duration-150 hover:not-disabled:-translate-y-px active:not-disabled:translate-y-0 active:not-disabled:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: 'border-primary/55 bg-[linear-gradient(180deg,#5f9cff,#2563d8)] text-white shadow-[0_7px_20px_color-mix(in_srgb,var(--primary)_18%,transparent),var(--inner-light)] hover:bg-[linear-gradient(180deg,#71a8ff,#3373e4)]',
        primary: 'border-primary/55 bg-[linear-gradient(180deg,#5f9cff,#2563d8)] text-white shadow-[0_7px_20px_color-mix(in_srgb,var(--primary)_18%,transparent),var(--inner-light)] hover:bg-[linear-gradient(180deg,#71a8ff,#3373e4)]',
        secondary: 'border-border bg-secondary text-secondary-foreground shadow-[var(--inner-light)] hover:border-[var(--border-bright)] hover:bg-[var(--row-hover-background)]',
        outline: 'border-border bg-[var(--row-background)] text-[var(--text-soft)] shadow-[var(--inner-light)] hover:border-[var(--border-bright)] hover:bg-[var(--row-hover-background)] hover:text-foreground',
        ghost: 'border-transparent bg-transparent text-[var(--text-soft)] shadow-none hover:border-border hover:bg-[var(--row-hover-background)] hover:text-foreground',
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
      {children ? <span className="min-w-0 truncate">{children}</span> : null}
      {trailingIcon}
    </ButtonPrimitive>
  )
}
