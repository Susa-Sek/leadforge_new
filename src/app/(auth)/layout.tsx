export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-scale-in">
        {children}
      </div>
    </div>
  )
}
