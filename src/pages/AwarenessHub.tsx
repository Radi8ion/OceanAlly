import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Video, 
  Download, 
  Globe, 
  AlertTriangle,
  Waves,
  Wind,
  Zap,
  Thermometer,
  Search,
  ExternalLink
} from 'lucide-react';

const AwarenessHub = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const preparednessGuides = [
    {
      id: '1',
      title: 'Tsunami Preparedness Guide',
      description: 'Essential steps to prepare for and respond to tsunami warnings',
      category: 'Tsunami',
      icon: Waves,
      languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
      downloadUrl: '#',
      videoUrl: '#'
    },
    {
      id: '2',
      title: 'Cyclone Safety Protocols',
      description: 'Complete guide for cyclone preparation and emergency response',
      category: 'Cyclone',
      icon: Wind,
      languages: ['English', 'Hindi', 'Bengali', 'Odia'],
      downloadUrl: '#',
      videoUrl: '#'
    },
    {
      id: '3',
      title: 'Marine Pollution Response',
      description: 'How to report and respond to marine pollution incidents',
      category: 'Pollution',
      icon: AlertTriangle,
      languages: ['English', 'Hindi', 'Gujarati', 'Marathi'],
      downloadUrl: '#',
      videoUrl: '#'
    },
    {
      id: '4',
      title: 'Lightning Safety at Sea',
      description: 'Safety measures for marine lightning and electrical hazards',
      category: 'Lightning',
      icon: Zap,
      languages: ['English', 'Hindi', 'Malayalam', 'Kannada'],
      downloadUrl: '#',
      videoUrl: '#'
    }
  ];

  const educationalResources = [
    {
      id: '1',
      title: 'Understanding Ocean Hazards',
      type: 'Interactive Course',
      duration: '2 hours',
      description: 'Comprehensive course on various ocean hazards and their impacts',
      level: 'Beginner'
    },
    {
      id: '2',
      title: 'Climate Change & Coastal Risks',
      type: 'Documentary',
      duration: '45 minutes',
      description: 'Impact of climate change on coastal communities in India',
      level: 'Intermediate'
    },
    {
      id: '3',
      title: 'Emergency Response Training',
      type: 'Simulation',
      duration: '3 hours',
      description: 'Virtual reality training for emergency response scenarios',
      level: 'Advanced'
    }
  ];

  const communityStories = [
    {
      id: '1',
      title: 'How Coastal Communities Prepared for Cyclone Amphan',
      location: 'West Bengal',
      date: '2024-01-10',
      readTime: '5 min read'
    },
    {
      id: '2',
      title: 'Early Warning Systems Saved Lives in Kerala',
      location: 'Kerala',
      date: '2024-01-05',
      readTime: '3 min read'
    },
    {
      id: '3',
      title: 'Community-led Marine Conservation in Gujarat',
      location: 'Gujarat',
      date: '2023-12-28',
      readTime: '7 min read'
    }
  ];

  const filteredGuides = preparednessGuides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-ocean rounded-xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Awareness Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn about ocean hazards, access preparedness guides, and stay informed about marine safety
            </p>
          </div>

          <Tabs defaultValue="guides" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="guides">Preparedness Guides</TabsTrigger>
              <TabsTrigger value="education">Educational Resources</TabsTrigger>
              <TabsTrigger value="community">Community Stories</TabsTrigger>
            </TabsList>

            <TabsContent value="guides" className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search preparedness guides..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Guides Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGuides.map((guide, index) => {
                  const Icon = guide.icon;
                  return (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-elevated transition-shadow">
                        <CardHeader>
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{guide.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {guide.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Badge variant="secondary">{guide.category}</Badge>
                            
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Available in:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {guide.languages.map((lang) => (
                                  <Badge key={lang} variant="outline" className="text-xs">
                                    {lang}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Video className="w-4 h-4 mr-2" />
                                Watch Video
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalResources.map((resource, index) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-elevated transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{resource.type}</Badge>
                          <span className="text-xs text-muted-foreground">{resource.duration}</span>
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{resource.level}</Badge>
                          <Button size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Access
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="community" className="space-y-6">
              <div className="space-y-4">
                {communityStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-elevated transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-foreground mb-2">
                              {story.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{story.location}</span>
                              <span>•</span>
                              <span>{story.date}</span>
                              <span>•</span>
                              <span>{story.readTime}</span>
                            </div>
                          </div>
                          <Button variant="outline">
                            Read Story
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AwarenessHub;