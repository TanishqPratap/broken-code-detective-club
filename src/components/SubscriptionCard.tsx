
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

interface SubscriptionCardProps {
  tier: SubscriptionTier;
  onSubscribe: (tierId: string) => void;
  isSubscribed?: boolean;
}

const SubscriptionCard = ({ tier, onSubscribe, isSubscribed = false }: SubscriptionCardProps) => {
  return (
    <Card className={`relative ${tier.isPopular ? 'ring-2 ring-primary' : ''}`}>
      {tier.isPopular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <Star className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
        <div className="text-3xl font-bold">
          ${tier.price}
          <span className="text-sm font-normal text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full" 
          variant={isSubscribed ? "outline" : "default"}
          onClick={() => onSubscribe(tier.id)}
          disabled={isSubscribed}
        >
          {isSubscribed ? "Current Plan" : "Subscribe Now"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
