import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Globe, 
  Smartphone,
  Database,
  Brain,
  Award,
  CheckCircle,
  Target
} from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Smartphone,
      title: 'Mobile-First Reporting',
      description: 'Easy-to-use mobile interface for quick hazard reporting with photo/video upload capabilities.',
    },
    {
      icon: Database,
      title: 'Real-time Analytics',
      description: 'Advanced data processing and visualization of crowdsourced reports and social media trends.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Machine learning algorithms analyze patterns and predict potential hazard hotspots.',
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Platform available in multiple Indian languages for inclusive community participation.',
    },
  ];

  const objectives = [
    'Enable real-time crowdsourced reporting of ocean hazards by coastal communities',
    'Integrate social media analytics for comprehensive hazard monitoring',
    'Provide government agencies with actionable insights for rapid response',
    'Create a unified platform for marine safety and environmental protection',
    'Foster community engagement in ocean conservation and safety initiatives',
  ];

  const technologies = [
    { name: 'React.js', type: 'Frontend Framework' },
    { name: 'Tailwind CSS', type: 'Styling' },
    { name: 'Framer Motion', type: 'Animations' },
    { name: 'TypeScript', type: 'Language' },
    { name: 'Geolocation API', type: 'Location Services' },
    { name: 'WebRTC', type: 'Media Capture' },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-ocean rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Ocean Hazard Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            An innovative solution developed for Smart India Hackathon, combining citizen science 
            with advanced analytics to protect India's coastal communities from ocean hazards.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <Card className="shadow-card border-border">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                  To create a comprehensive, community-driven platform that leverages crowdsourced data 
                  and social media analytics to enhance marine safety, environmental protection, and 
                  disaster preparedness along India's extensive coastline.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground">
              Advanced capabilities for comprehensive ocean hazard monitoring
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
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full shadow-card hover:shadow-elevated transition-smooth border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Project Objectives</h2>
              <div className="space-y-4">
                {objectives.map((objective, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{objective}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <Card className="shadow-card border-border">
              <CardContent className="p-8">
                <div className="text-center">
                  <Target className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-foreground mb-4">Impact Goals</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-primary">7,500 km</div>
                      <div className="text-sm text-muted-foreground">Coastline Coverage</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">50M+</div>
                      <div className="text-sm text-muted-foreground">Coastal Population Served</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">24/7</div>
                      <div className="text-sm text-muted-foreground">Real-time Monitoring</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Technology Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Card className="shadow-card border-border">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Technology Stack</h2>
                <p className="text-muted-foreground">
                  Built with modern, scalable technologies for optimal performance
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {technologies.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-smooth"
                  >
                    <div className="font-semibold text-foreground text-sm mb-1">{tech.name}</div>
                    <div className="text-xs text-muted-foreground">{tech.type}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Government Partnership */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <Card className="shadow-card border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-2">
                  <Award className="w-4 h-4 mr-2" />
                  Government Initiative
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ministry of Earth Sciences Partnership
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                This platform is developed in collaboration with the Ministry of Earth Sciences, 
                Government of India, as part of the Smart India Hackathon initiative to leverage 
                technology for national development and citizen welfare.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Government Verified</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Community Driven</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span>Data-Powered Insights</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default About;