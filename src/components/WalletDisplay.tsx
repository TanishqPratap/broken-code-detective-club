import { useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import WalletModal from "./WalletModal";

interface WalletDisplayProps {
  variant?: "navbar" | "compact" | "full";
}

const WalletDisplay = ({ variant = "navbar" }: WalletDisplayProps) => {
  const { user } = useAuth();
  const { balance, loading } = useWallet();
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  if (variant === "compact") {
    return (
      <>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5"
        >
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold">
            {loading ? "..." : balance}
          </span>
        </Button>
        <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30"
      >
        <Coins className="w-5 h-5 text-yellow-500" />
        <span className="font-bold text-yellow-700 dark:text-yellow-400">
          {loading ? "..." : balance}
        </span>
        <span className="text-sm text-muted-foreground">Coins</span>
      </Button>
      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default WalletDisplay;
