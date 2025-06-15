
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/auth/AuthModal";
import MerchandiseList from "@/components/MerchandiseList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Shop = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Creator Merchandise</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover amazing products from your favorite creators. From digital downloads to physical merchandise, 
            support creators while getting exclusive items.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Featured Products</CardTitle>
          </CardHeader>
          <CardContent>
            <MerchandiseList />
          </CardContent>
        </Card>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Shop;
