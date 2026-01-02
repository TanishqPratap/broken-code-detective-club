import { Clock, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Live = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center animate-fade-in">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8 text-primary" />
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Coming Soon
          </Badge>
          <h1 className="text-2xl font-bold">Live Streams</h1>
          <p className="text-muted-foreground">
            We're working hard to bring you an amazing live streaming experience. 
            Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Live;
