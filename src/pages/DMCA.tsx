
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, FileText, Mail, Scale, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const DMCA = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    copyrightWork: "",
    infringingContent: "",
    goodFaithStatement: false,
    accuracyStatement: false,
    signature: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle DMCA form submission here
    console.log("DMCA Notice submitted:", formData);
  };

  const dmcaSteps = [
    {
      icon: FileText,
      title: "Identify the Work",
      description: "Clearly identify the copyrighted work that you believe has been infringed."
    },
    {
      icon: AlertTriangle,
      title: "Locate the Infringing Content",
      description: "Provide the specific URL or location of the allegedly infringing material."
    },
    {
      icon: Mail,
      title: "Submit Notice",
      description: "Send a complete DMCA takedown notice with all required information."
    },
    {
      icon: CheckCircle,
      title: "Review Process",
      description: "We will review your notice and take appropriate action within 24-48 hours."
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
              DMCA Policy
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <Scale className="w-16 h-16 text-brand-cyan" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          DMCA Copyright Policy
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          CreatorHub respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA).
        </p>
      </section>

      {/* DMCA Process */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          DMCA Takedown Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {dmcaSteps.map((step, index) => (
            <Card key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-brand-light-cyan to-brand-cyan rounded-full">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* DMCA Notice Form */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Shield className="w-6 h-6" />
                <span>File a DMCA Takedown Notice</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Please provide all required information for your DMCA takedown notice. Incomplete notices may not be processed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company/Organization (if applicable)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="copyrightWork">Description of Copyrighted Work *</Label>
                  <Textarea
                    id="copyrightWork"
                    rows={4}
                    placeholder="Describe the copyrighted work that you believe has been infringed..."
                    value={formData.copyrightWork}
                    onChange={(e) => setFormData({...formData, copyrightWork: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="infringingContent">Location of Infringing Content *</Label>
                  <Textarea
                    id="infringingContent"
                    rows={4}
                    placeholder="Provide the specific URL(s) or location of the allegedly infringing material..."
                    value={formData.infringingContent}
                    onChange={(e) => setFormData({...formData, infringingContent: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="goodFaith"
                      checked={formData.goodFaithStatement}
                      onChange={(e) => setFormData({...formData, goodFaithStatement: e.target.checked})}
                      className="mt-1"
                      required
                    />
                    <Label htmlFor="goodFaith" className="text-sm leading-relaxed">
                      I have a good faith belief that use of the copyrighted material is not authorized by the copyright owner, its agent, or the law.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="accuracy"
                      checked={formData.accuracyStatement}
                      onChange={(e) => setFormData({...formData, accuracyStatement: e.target.checked})}
                      className="mt-1"
                      required
                    />
                    <Label htmlFor="accuracy" className="text-sm leading-relaxed">
                      I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner.
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signature">Electronic Signature *</Label>
                  <Input
                    id="signature"
                    placeholder="Type your full legal name"
                    value={formData.signature}
                    onChange={(e) => setFormData({...formData, signature: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    By typing your name, you are providing an electronic signature.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit DMCA Notice
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Information */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Counter-Notification Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                If you believe your content was removed in error due to a DMCA takedown notice, you may file a counter-notification. The counter-notification must include:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                <li>Your contact information</li>
                <li>Identification of the removed content and its location</li>
                <li>A statement of good faith belief that the content was removed in error</li>
                <li>Your consent to jurisdiction and electronic signature</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Repeat Infringer Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                CreatorHub has a policy of terminating the accounts of users who are repeat copyright infringers. We may also disable the accounts of users who receive multiple DMCA takedown notices, even if those notices are later determined to be invalid.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                <strong>DMCA Agent:</strong> CreatorHub Legal Team
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Email:</strong> dmca@creatorhub.com
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Mail:</strong> 123 Creator Street, Tech City, TC 12345
              </p>
              <div className="pt-4">
                <Button onClick={() => navigate("/contact")} variant="outline">
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

export default DMCA;
