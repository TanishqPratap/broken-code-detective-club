
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Star, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">CreatorHub</h1>
          <div className="flex gap-4">
            <Button variant="ghost">Sign In</Button>
            <Button>Join Now</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-6">
          The Ultimate Platform for <span className="text-primary">Content Creators</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Connect with your audience, share exclusive content, and build a sustainable income doing what you love.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg">Start Creating</Button>
          <Button size="lg" variant="outline">Browse Creators</Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose CreatorHub?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-4" />
              <CardTitle>Grow Your Audience</CardTitle>
              <CardDescription>
                Connect with fans who truly appreciate your content and build lasting relationships.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Lock className="w-10 h-10 text-primary mb-4" />
              <CardTitle>Exclusive Content</CardTitle>
              <CardDescription>
                Share premium content with your subscribers and offer exclusive perks.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Star className="w-10 h-10 text-primary mb-4" />
              <CardTitle>Earn More</CardTitle>
              <CardDescription>
                Keep up to 90% of your earnings with our creator-friendly revenue model.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <h3 className="text-3xl font-bold text-center mb-12">Featured Creators</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/40"></div>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                  <div>
                    <h4 className="font-semibold">Creator {i}</h4>
                    <p className="text-sm text-muted-foreground">@creator{i}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Creating amazing content for my community. Join for exclusive posts and behind-the-scenes content!
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{Math.floor(Math.random() * 1000) + 100}</span>
                  </div>
                  <Button size="sm">Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 CreatorHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
