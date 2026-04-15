import { ArrowRight, BarChart3, BookOpen, Brain, Calendar, Database, GraduationCap, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
// import logo from '../assets/logo.png'

// Reusable Components
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{children}</h2>
);

const SectionSubtitle = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 text-lg text-slate-600">{children}</p>
);

// Hero Section Component
const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-20">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-800/30 to-transparent"></div>
    <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* <img
            src="/logo.png"
            alt="AI EduPredict logo"
            className="h-12 w-12 rounded-xl shadow-lg ring-2 ring-white/30 bg-white/10 backdrop-blur"
          /> */}
          <div className="text-2xl font-bold text-white">AI EduPredict</div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="bg-transparent border-white/40 text-white hover:-translate-y-0.5 hover:bg-white/10 transition-all duration-200"
          >
            <Link to="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            className="bg-white text-blue-900 hover:-translate-y-0.5 hover:bg-blue-50 transition-all duration-200 shadow-lg shadow-blue-900/20"
          >
            <Link to="/register-user">Sign Up</Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left Content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="inline-block rounded-full bg-blue-500/20 px-4 py-1 text-sm font-medium text-blue-200 backdrop-blur-sm">
              AI-Powered Analytics
            </div>
            <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Predict Student Performance Before It's Too Late
            </h1>
            <p className="text-xl text-blue-100 md:text-2xl">
              Our AI identifies at-risk students early, enabling timely interventions that improve academic outcomes.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              className="bg-white text-blue-900 hover:bg-blue-50 transition-all duration-300 group"
            >
              <Link to="/predict">
                Request Demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* Right Dashboard Preview */}
        <div className="relative z-10 flex justify-center">
          <div className="relative rounded-2xl bg-white/10 backdrop-blur-md p-6 border border-white/20 shadow-2xl w-full max-w-lg">
            <div className="rounded-xl bg-white p-4 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Student Performance Overview</h3>
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium text-slate-700">Sarah Johnson</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    Low Risk
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-yellow-600" />
                    </div>
                    <span className="font-medium text-slate-700">Michael Chen</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                    Medium Risk
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium text-slate-700">Emma Rodriguez</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                    High Risk
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Performance Trends</span>
                  <span>+12%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Problem Section Component
const ProblemSection = () => {
  const problems = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Students Fall Behind Unnoticed",
      description: "Without early warning systems, struggling students often go undetected until it's too late to help them succeed.",
    },
    {
      icon: <Database className="h-8 w-8 text-purple-600" />,
      title: "Data Without Insights",
      description: "Schools collect vast amounts of student data but lack the tools to extract meaningful insights for intervention.",
    },
    {
      icon: <Calendar className="h-8 w-8 text-indigo-600" />,
      title: "Late Interventions",
      description: "By the time educators identify at-risk students, valuable time for meaningful intervention has been lost.",
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionTitle>Colleges Struggle to Identify At-Risk Students Early</SectionTitle>
          <SectionSubtitle>
            Traditional approaches fail to leverage data for proactive student support.
          </SectionSubtitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 border-slate-200">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                {problem.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{problem.title}</h3>
              <p className="text-slate-600">{problem.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section Component
const HowItWorksSection = () => {
  const steps = [
    {
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      title: "Collect Student Data",
      description: "Gather academic records, attendance, engagement metrics, and behavioral data.",
    },
    {
      icon: <Brain className="h-6 w-6 text-purple-600" />,
      title: "AI Analyzes Patterns",
      description: "Our machine learning algorithms identify patterns indicating potential academic struggles.",
    },
    {
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: "Predict & Alert Educators",
      description: "Receive real-time alerts when students are identified as at-risk for intervention.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionTitle>How It Works</SectionTitle>
          <SectionSubtitle>
            Our AI-powered system transforms student data into actionable insights.
          </SectionSubtitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      title: "Early Risk Detection",
      description: "Identify students who may struggle before academic performance declines significantly.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      title: "Smart Insights Dashboard",
      description: "Visualize student performance trends and risk factors in an intuitive dashboard.",
    },
    {
      icon: <Brain className="h-6 w-6 text-indigo-600" />,
      title: "Performance Forecasting",
      description: "Predict future academic outcomes based on current performance indicators.",
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-600" />,
      title: "Intervention Recommendations",
      description: "Get personalized recommendations for supporting at-risk students.",
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionTitle>Powerful Features</SectionTitle>
          <SectionSubtitle>
            Everything you need to support student success with AI-powered insights.
          </SectionSubtitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 border-slate-200 hover:-translate-y-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Dashboard Preview Section Component
const DashboardPreviewSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <SectionTitle>Dashboard Preview</SectionTitle>
        <SectionSubtitle>
          Real-time insights at your fingertips to monitor and support student success.
        </SectionSubtitle>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-w-6xl mx-auto">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Student Performance Analytics</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Last 7 Days</Button>
              <Button size="sm" variant="outline">Last 30 Days</Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">87%</div>
              <div className="text-slate-600 mt-2">Student Retention Rate</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">12</div>
              <div className="text-slate-600 mt-2">At-Risk Students Identified</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">92%</div>
              <div className="text-slate-600 mt-2">Intervention Success Rate</div>
            </Card>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">Low Risk</span>
                  <span className="text-sm text-slate-600">65%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">Medium Risk</span>
                  <span className="text-sm text-slate-600">23%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">High Risk</span>
                  <span className="text-sm text-slate-600">12%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Performance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">James Wilson</div>
                        <div className="text-sm text-slate-500">Computer Science</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">A-</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                      Low Risk
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Button size="sm" variant="outline">View Profile</Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <GraduationCap className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">Sophia Martinez</div>
                        <div className="text-sm text-slate-500">Mathematics</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">C+</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                      Medium Risk
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Button size="sm" variant="outline">View Profile</Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <GraduationCap className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">David Kim</div>
                        <div className="text-sm text-slate-500">Physics</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">D+</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                      High Risk
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Button size="sm" variant="outline">View Profile</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// CTA Section Component
const CTASection = () => (
  <section className="py-20 bg-gradient-to-r from-blue-800 to-purple-800">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          Start Predicting Academic Success Today
        </h2>
        <p className="mt-4 text-xl text-blue-100">
          Join hundreds of educational institutions transforming student outcomes with AI.
        </p>
        <div className="mt-8">
          <Link to="/predict">
            <Button className="bg-white text-blue-900 text-lg px-8 py-4 hover:bg-blue-50 transition-all duration-300">
              Book a Free Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// Footer Component
const Footer = () => (
  <footer className="bg-slate-900 text-white py-12">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="text-2xl font-bold text-white mb-4">AI EduPredict</div>
          <p className="text-slate-400">
            AI-powered student performance prediction for educational institutions.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Product</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/predict" className="hover:text-white transition-colors">Predictor</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            <li><Link to="/students" className="hover:text-white transition-colors">Students</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Company</h3>
          <ul className="space-y-2 text-slate-400">
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Legal</h3>
          <ul className="space-y-2 text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
        <p>&copy; 2024 AI EduPredict. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <DashboardPreviewSection />
      <CTASection />
      <Footer />
    </div>
  );
}
