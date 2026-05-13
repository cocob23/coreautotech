import { Loader } from 'lucide-react'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullscreen?: boolean
}

export const LoadingSpinner = ({ size = 'md', message, fullscreen = false }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const container = fullscreen ? (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="text-center">
        <Loader className={`${sizeClasses[size]} text-brand animate-spin mx-auto mb-2`} />
        {message && <p className="text-neutral-300 text-sm">{message}</p>}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center gap-2">
      <Loader className={`${sizeClasses[size]} text-brand animate-spin`} />
      {message && <p className="text-neutral-300 text-sm">{message}</p>}
    </div>
  )

  return container
}
