
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Settings, BarChart3, Shield, Globe, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
  const navigate = useNavigate();

  const cookieTypes = [
    {
      title: "Essential Cookies",
      icon: Shield,
      description: "These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services.",
      examples: "Login authentication, security features, form submissions"
    },
    {
      title: "Performance Cookies",
      icon: BarChart3,
      description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are most popular.",
      examples: "Google Analytics, page load times, error tracking"
    },
    {
      title: "Functional Cookies",
      icon: Settings,
      description: "These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.",
      examples: "Language preferences, theme settings, customization options"
    },
    {
      title: "Targeting Cookies",
      icon: Eye,
      description: "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts.",
      examples: "Advertising preferences, social media integration, remarketing"
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
              Cookie Policy
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <Cookie className="w-16 h-16 text-brand-cyan" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Cookie Policy
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          This policy explains how CreatorHub uses cookies and similar technologies to recognize you when you visit our platform.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: June 15, 2024
        </p>
      </section>

      {/* What are Cookies */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                What are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Cookies set by the website owner (in this case, CreatorHub) are called "first party cookies". Cookies set by parties other than the website owner are called "third party cookies". Third party cookies enable third party features or functionality to be provided on or through the website.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          Types of Cookies We Use
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {cookieTypes.map((type, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-lg">
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  {type.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  <strong>Examples:</strong> {type.examples}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cookie Management */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Settings className="w-6 h-6" />
                <span>Managing Your Cookie Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your browser settings. Most web browsers allow some control of most cookies through the browser settings.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
              </p>
              <div className="pt-4">
                <Button variant="outline">
                  Manage Cookie Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Globe className="w-6 h-6" />
                <span>Third-Party Cookies</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the platform, deliver advertisements on and through the platform, and so on.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Third-party services we use include Google Analytics, social media platforms, and payment processors. Each of these services has their own privacy and cookie policies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Updates and Contact */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                Updates to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
              </p>
              <div className="pt-4 space-y-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Questions about cookies?</strong> Contact us at: cookies@creatorhub.com
                  </p>
                </div>
                <div className="pt-4">
                  <Button onClick={() => navigate("/contact")}>
                    Contact Us
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicy;
