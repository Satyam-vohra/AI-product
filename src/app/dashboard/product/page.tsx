import { Suspense } from "react";
import { ProductScreen } from "@/components/mantis/Screens";

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading product...</div>}>
      <ProductScreen />
    </Suspense>
  );
}
