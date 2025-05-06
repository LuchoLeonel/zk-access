import { Suspense } from 'react';
import InboxPage from './client';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center text-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-300 border-t-transparent"></div>
        <p className="mt-4 text-lg font-medium">Loading...</p>
      </div>
    }>
      <InboxPage />
    </Suspense>
  );
}

