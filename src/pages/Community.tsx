import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Heart, Star, Zap, Trophy, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Community = () => {
  const navigate = useNavigate();

  const communityStats = [
    { icon: Users, label: "Active Creators", value: "10,000+" },
    { icon: Heart, label: "Monthly Interactions", value: "1M+" },
    { icon: Star, label: "Success Stories", value: "500+" },
    { icon: Globe, label: "Countries", value: "50+" }
  ];

  const communityFeatures = [
    {
      icon: MessageSquare,
      title: "Creator Forums",
      description: "Connect with fellow creators, share tips, and get advice from experienced community members."
    },
    {
      icon: Zap,
      title: "Weekly Challenges",
      description: "Participate in fun challenges to boost engagement and discover new creative ideas."
    },
    {
      icon: Trophy,
      title: "Success Stories",
      description: "Get inspired by stories from creators who have built successful communities and businesses."
    },
    {
      icon: Calendar,
      title: "Virtual Events",
      description: "Join live webinars, workshops, and networking events to learn and connect with others."
    }
  ];

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
              Community
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Join Our Creator Community
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Connect with thousands of creators worldwide. Share experiences, learn from others, and grow together.
        </p>
      </section>

      {/* Community Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {communityStats.map((stat, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-full">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stat.value}</h3>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Community Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          Community Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {communityFeatures.map((feature, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-lg">
                    <feature.icon className="w-6 h-6 text-white" />
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

      {/* Join CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12">
          <Users className="w-16 h-16 text-brand-cyan mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with like-minded creators, share your journey, and grow together in our vibrant community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/")}>
              Join Now
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/help-center")}>
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Community;
