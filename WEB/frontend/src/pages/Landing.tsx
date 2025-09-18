import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  BarChart3, 
  Users, 
  Globe, 
  Waves,
  Shield,
  TrendingUp,
  MapPin,
  ShieldCheck 
} from 'lucide-react';
import apiClient from '@/lib/api';

// User interface to match your backend
interface User {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'citizen' | 'official' | 'admin';
}

const Landing = () => {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  
  // Get user data from react-query cache (populated by AuthSync)
  const { data: user } = useQuery<User>({
    queryKey: ['me'],
    enabled: isSignedIn,
  });

  const features = [
    {
      icon: AlertTriangle,
      title: 'Real-time Reporting',
      description: 'Citizens can instantly report ocean hazards with photo/video evidence and location data.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics combining crowdsourced reports with social media insights.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Harness the power of collective intelligence for better ocean monitoring.',
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Platform available in multiple Indian languages for broader accessibility.',
    },
  ];

  const [stats, setStats] = useState([
    { number: '2,800+', label: 'Active Reports', icon: MapPin },
    { number: '15,000+', label: 'Community Members', icon: Users },
    { number: '98.5%', label: 'Response Rate', icon: Shield },
    { number: '24/7', label: 'Monitoring', icon: TrendingUp },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/api/v1/dashboard/stats');
        const data = response.data;
        
        const formatNumber = (num: number) => {
          if (typeof num !== 'number') return '0';
          return new Intl.NumberFormat('en-IN').format(num);
        }

        const responseRate = typeof data.responseRate === 'number' 
          ? `${data.responseRate}%` 
          : data.responseRate || 'N/A';

        setStats([
          { number: formatNumber(data.activeHazards), label: 'Active Hazards', icon: MapPin },
          { number: formatNumber(data.communityMembers), label: 'Community Members', icon: Users },
          { number: responseRate, label: 'Response Rate', icon: Shield },
          { number: '24/7', label: 'Monitoring', icon: TrendingUp },
        ]);
      } catch (error) {
        console.warn('Could not fetch live stats for landing page. Using default values.');
      }
    };

    fetchStats();
  }, []);

  const isOfficial = user && (user.role === 'official' || user.role === 'admin');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=2070&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-dark/80" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {isOfficial ? 'Welcome, Official' : 'Ocean Hazard Reporting'}
              <span className="block text-primary-light">
                {isOfficial ? 'Verification & Analytics Portal' : '& Analytics Platform'}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              {isOfficial
                ? 'Review, verify, and manage community-submitted hazard reports to coordinate effective responses.'
                : 'Empowering citizens to report and analyze ocean hazards in real-time through crowdsourced data and social media analytics.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isOfficial ? (
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  <Link to="/admin/verify">
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Go to Verification Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  {isSignedIn ? (
                    <>
                      <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                        <Link to="/report">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Report Hazard
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white text-primary">
                        <Link to="/dashboard">
                          <BarChart3 className="w-5 h-5 mr-2" />
                          View Dashboard
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                        <Link to="/login">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Get Started
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white text-primary">
                        <Link to="/about">
                          Learn More
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Waves className="w-8 h-8 text-white/60" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced capabilities for comprehensive ocean hazard monitoring and analysis
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full shadow-card hover:shadow-elevated transition-smooth border-border">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join the Ocean Safety Community
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Be part of India's first crowdsourced ocean hazard reporting system. 
              Your contribution helps protect our coastal communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isSignedIn ? (
                <Button asChild size="lg" variant="secondary">
                  <Link to="/dashboard">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary">
                  <Link to="/register">
                    <Users className="w-5 h-5 mr-2" />
                    Register Now
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white text-primary">
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;