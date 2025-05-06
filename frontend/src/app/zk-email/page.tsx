import { Suspense } from 'react';
import InboxPage from './client';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InboxPage />
    </Suspense>
  );
}

