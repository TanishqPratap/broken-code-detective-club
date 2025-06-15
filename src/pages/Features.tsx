
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Shield, Video, MessageSquare, Heart, Zap, Globe, Lock, DollarSign, BarChart3, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: "Live Streaming",
      description: "High-quality live streaming with interactive chat and real-time engagement tools.",
      category: "Content Creation"
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Build and manage your community with subscriber tiers and exclusive content access.",
      category: "Community"
    },
    {
      icon: DollarSign,
      title: "Multiple Revenue Streams",
      description: "Earn through subscriptions, tips, exclusive content, and live streaming monetization.",
      category: "Monetization"
    },
    {
      icon: MessageSquare,
      title: "Paid Direct Messages",
      description: "Monetize one-on-one interactions with your fans through paid messaging system.",
      category: "Monetization"
    },
    {
      icon: Shield,
      title: "Content Protection",
      description: "Advanced security features to protect your content from unauthorized access and piracy.",
      category: "Security"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics to track your performance, earnings, and audience engagement.",
      category: "Analytics"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Fully responsive design that works seamlessly across all devices and platforms.",
      category: "Platform"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Reach audiences worldwide with multi-currency support and localization features.",
      category: "Platform"
    },
    {
      icon: Lock,
      title: "Privacy Controls",
      description: "Granular privacy settings to control who can see your content and interact with you.",
      category: "Privacy"
    },
    {
      icon: Heart,
      title: "Fan Engagement",
      description: "Interactive features like stories, polls, and exclusive content to engage your audience.",
      category: "Engagement"
    },
    {
      icon: Zap,
      title: "Real-time Notifications",
      description: "Stay connected with instant notifications for tips, messages, and subscriber activities.",
      category: "Communication"
    },
    {
      icon: TrendingUp,
      title: "Growth Tools",
      description: "Built-in marketing tools and discovery features to help grow your audience organically.",
      category: "Growth"
    }
  ];

  const categories = ["All", "Content Creation", "Monetization", "Security", "Platform", "Community", "Analytics", "Privacy", "Engagement", "Communication", "Growth"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/")} className="text-brand-cyan hover:text-brand-light-cyan">
                ← Back to Home
              </Button>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-light-cyan to-brand-cyan bg-clip-text text-transparent">
              Features
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Everything You Need to Succeed
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          CreatorHub provides all the tools and features you need to build, grow, and monetize your community effectively.
        </p>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs text-brand-cyan font-medium px-2 py-1 bg-brand-cyan/10 rounded-full">
                    {feature.category}
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using CreatorHub to build their communities and earn from their passion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/")}>
              Start Creating
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/discover")}>
              Explore Creators
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
