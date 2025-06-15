
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, MessageSquare, Video, DollarSign, Shield, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of using CreatorHub",
      articles: 12
    },
    {
      icon: Video,
      title: "Content Creation",
      description: "Tips for creating engaging content",
      articles: 8
    },
    {
      icon: DollarSign,
      title: "Monetization",
      description: "How to earn money on the platform",
      articles: 15
    },
    {
      icon: Users,
      title: "Community Management",
      description: "Building and managing your audience",
      articles: 10
    },
    {
      icon: Shield,
      title: "Safety & Privacy",
      description: "Keeping your account secure",
      articles: 7
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Managing your profile and preferences",
      articles: 9
    }
  ];

  const popularArticles = [
    "How to set up your creator profile",
    "Understanding subscription tiers",
    "Setting up live streaming",
    "Payment processing and withdrawals",
    "Content moderation guidelines",
    "Two-factor authentication setup",
    "Privacy settings explained",
    "Building your first community"
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
              Help Center
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          How Can We Help You?
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Find answers to your questions and get the support you need to succeed on CreatorHub.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-lg">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs text-brand-cyan font-medium px-2 py-1 bg-brand-cyan/10 rounded-full">
                    {category.articles} articles
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {category.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          Popular Articles
        </h2>
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-4">
                {popularArticles.map((article, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors">
                    <BookOpen className="w-5 h-5 text-brand-cyan" />
                    <span className="text-gray-900 dark:text-gray-100">{article}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Support */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12">
          <MessageSquare className="w-16 h-16 text-brand-cyan mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Still Need Help?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/contact")}>
              Contact Support
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/community")}>
              Join Community
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
