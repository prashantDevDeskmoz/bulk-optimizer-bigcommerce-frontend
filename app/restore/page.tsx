import { Suspense } from 'react'
import RestoreClient from './RestoreClient'

export default function page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RestoreClient />
    </Suspense>
  )
}
