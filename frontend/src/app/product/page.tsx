import { Suspense } from "react";
import { ProductScreen } from "@/components/mantis/Screens";

export default function PublicProductPage() {
  return (
    <main className="min-h-screen bg-grid-pattern p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<div className="p-6">Loading product...</div>}>
          <ProductScreen />
        </Suspense>
      </div>
    </main>
  );
}
