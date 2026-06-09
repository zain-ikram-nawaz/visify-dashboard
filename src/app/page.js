import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">
          VI<span className="text-indigo-500">SI</span>FY
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Give your e-commerce store a 3D product configurator in minutes.
          No coding required.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-semibold transition"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}