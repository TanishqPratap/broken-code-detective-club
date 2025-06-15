
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Shield, DollarSign, AlertTriangle, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Acceptance of Terms",
      icon: FileText,
      content: "By accessing and using CreatorHub, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all users of the platform, including creators, subscribers, and visitors."
    },
    {
      title: "User Accounts",
      icon: Users,
      content: "To access certain features of the platform, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
    },
    {
      title: "Content and Conduct",
      icon: Shield,
      content: "Users are responsible for all content they upload or share on the platform. Content must comply with our community guidelines and applicable laws. We reserve the right to remove content that violates our terms or policies."
    },
    {
      title: "Payment Terms",
      icon: DollarSign,
      content: "Creator earnings are subject to our fee structure as outlined in your creator agreement. Payments are processed according to our payment schedule. All transactions are subject to applicable taxes and fees."
    },
    {
      title: "Prohibited Activities",
      icon: AlertTriangle,
      content: "Users may not engage in activities that violate laws, infringe on others' rights, harm the platform, or violate these terms. This includes but is not limited to fraud, harassment, spam, or unauthorized access attempts."
    },
    {
      title: "Intellectual Property",
      icon: Scale,
      content: "Users retain ownership of their original content but grant CreatorHub certain rights to host, display, and distribute content on the platform. Users must respect the intellectual property rights of others."
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
              Terms of Service
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Please read these terms carefully before using CreatorHub. By using our platform, you agree to these terms.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: June 15, 2024
        </p>
      </section>

      {/* Terms Sections */}
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

      {/* Additional Terms */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                CreatorHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the platform.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Termination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may terminate or suspend your account and bar access to the platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the State of California, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                Questions About These Terms?
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                If you have any questions about these Terms of Service, please contact us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> legal@creatorhub.com
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Address:</strong> Near Acharya Institutes, New Delhi Mart, Soladevanahalli, Bangalore, Karnataka, 560107
                </p>
              </div>
              <div className="pt-4">
                <Button onClick={() => navigate("/contact")}>
                  Contact Legal Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;

