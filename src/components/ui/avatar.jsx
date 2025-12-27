import { forwardRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

const Avatar = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

const AvatarImage = forwardRef(({ className, src, alt, ...props }, ref) => (
  <Image
    ref={ref}
    src={src}
    alt={alt || ''}
    fill
    sizes="(max-width: 768px) 40px, 48px"
    className={cn('object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
AvatarFallback.displayName = 'AvatarFallback'

// Convenience component for user avatars
function UserAvatar({ user, className, size = 'default' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {user?.avatar_url ? (
        <AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
      ) : (
        <AvatarFallback>
          {getInitials(user?.full_name || user?.email)}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar }
