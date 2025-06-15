
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes your name, email address, payment information, and content you upload to our platform."
    },
    {
      title: "How We Use Your Information",
      icon: UserCheck,
      content: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotional offers."
    },
    {
      title: "Information Sharing",
      icon: Globe,
      content: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information with service providers who assist us in operating our platform."
    },
    {
      title: "Data Security",
      icon: Lock,
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure."
    },
    {
      title: "Your Privacy Rights",
      icon: Eye,
      content: "You have the right to access, update, or delete your personal information. You can also object to or restrict certain processing of your data. To exercise these rights, please contact us using the information provided below."
    },
    {
      title: "Data Retention",
      icon: Shield,
      content: "We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law."
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
              Privacy Policy
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Your privacy is important to us. This policy explains how we collect, use, and protect your information.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: June 15, 2024
        </p>
      </section>

      {/* Policy Sections */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-lg">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Information */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                Contact Us About Privacy
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                If you have any questions about this Privacy Policy, please contact us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> privacy@creatorhub.com
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Address:</strong> 123 Creator Street, Tech City, TC 12345
                </p>
              </div>
              <div className="pt-4">
                <Button onClick={() => navigate("/contact")}>
                  Contact Privacy Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Policy Updates */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
