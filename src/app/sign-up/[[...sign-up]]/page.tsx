import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join AI Career Platform</h1>
          <p className="mt-2 text-gray-600">
            Create your account and start building your career
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border-0 w-full",
            }
          }}
        />
      </div>
    </div>
  )
}