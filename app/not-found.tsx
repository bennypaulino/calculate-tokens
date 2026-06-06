import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
        404
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Page Not Found
      </h1>
      <p className="text-gray-600 mb-8 max-w-sm mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <span aria-hidden="true">&larr;</span>
        Back to home
      </Link>
    </div>
  );
}
