import React from 'react'

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="skeleton h-6 w-2/3 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-5/6 rounded" />
      <div className="skeleton h-4 w-4/6 rounded" />
      <div className="mt-6 skeleton h-6 w-1/2 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-20 w-full rounded" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-20 w-full rounded" />
        </div>
      </div>
    </div>
  )
}
