'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const OKRMountainsVisualization = dynamic(
  () => import('@/components/visualizations/OKRMountainsVisualization'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading OKR visualization...</div>
  }
);

export default function OKRMountainsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/visualization" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to visualizations
        </Link>
      </div>

      <Card className="h-[800px]">
        <CardHeader>
          <CardTitle>OKR Progress Mountains</CardTitle>
          <CardDescription>
            Your objectives and key results visualized as mountain peaks. 
            Height represents progress, with key results orbiting each objective.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-120px)]">
          <Suspense fallback={<div>Loading...</div>}>
            <OKRMountainsVisualization />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}