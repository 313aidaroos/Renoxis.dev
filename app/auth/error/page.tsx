import Link from "next/link";
export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Error</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Something went wrong. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 text-blue-600 hover:text-blue-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
