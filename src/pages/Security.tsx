
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Key, Server, FileCheck, AlertTriangle, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Security = () => {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "All your communications and sensitive data are protected with military-grade encryption."
    },
    {
      icon: Lock,
      title: "Secure Payment Processing",
      description: "PCI-compliant payment processing ensures your financial transactions are always secure."
    },
    {
      icon: Eye,
      title: "Privacy Controls",
      description: "Granular privacy settings give you complete control over who can see your content."
    },
    {
      icon: Key,
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account with 2FA protection."
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Our platform runs on enterprise-grade servers with 99.9% uptime guarantee."
    },
    {
      icon: FileCheck,
      title: "Content Protection",
      description: "Advanced DRM and watermarking technology protects your exclusive content."
    },
    {
      icon: AlertTriangle,
      title: "Fraud Detection",
      description: "AI-powered fraud detection systems monitor and prevent suspicious activities."
    },
    {
      icon: UserCheck,
      title: "Identity Verification",
      description: "Robust identity verification ensures a safe environment for all users."
    }
  ];

  const certifications = [
    "SOC 2 Type II Certified",
    "GDPR Compliant",
    "PCI DSS Level 1",
    "ISO 27001 Certified"
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
              Security
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Your Security is Our Priority
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          We implement industry-leading security measures to protect your content, data, and earnings.
        </p>
      </section>

      {/* Security Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
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

      {/* Certifications */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Industry Certifications
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We maintain the highest security standards and are certified by leading industry organizations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Shield className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{cert}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Security Questions?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Our security team is here to answer any questions about how we protect your data and content.
          </p>
          <Button size="lg" onClick={() => navigate("/contact")}>
            Contact Security Team
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Security;
