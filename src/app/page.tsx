'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Wand2, 
  Brain,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import problemStatementData from '@/lib/problem-statement.json';

export default function TimetableAceLanding() {
  useEffect(() => {
    // Force dark mode for the entire website
    document.documentElement.classList.add('dark');
    
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    };

    // Add event listeners to all anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });

    return () => {
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll);
      });
    };
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      description: 'Advanced algorithms create conflict-free timetables automatically, considering all constraints and preferences.',
    },
    {
      icon: Calendar,
      title: 'NEP 2020 Compliant',
      description: 'Fully aligned with National Education Policy 2020 requirements for multidisciplinary education structures.',
    },
    {
      icon: Users,
      title: 'Multi-Role Support',
      description: 'Seamless experience for administrators, faculty, and students with role-based access and features.',
    },
    {
      icon: ShieldCheck,
      title: 'Smart Constraints',
      description: 'Handle complex scheduling constraints including faculty availability, room capacity, and program requirements.',
    },
    {
      icon: Wand2,
      title: 'Real-time Simulation',
      description: 'Test different scenarios and constraints before implementing changes to your actual timetable.',
    },
    {
      icon: Clock,
      title: 'Instant Updates',
      description: 'Dynamic editing capabilities with instant conflict detection and resolution suggestions.',
    },
  ];

  const benefits = [
    'Eliminates manual scheduling conflicts',
    'Reduces administrative workload by 80%',
    'Optimizes resource utilization',
    'Supports flexible credit-based programs',
    'Handles complex multidisciplinary structures',
    'Provides exportable formats (PDF, Excel)',
  ];

  return (
    <div className="min-h-screen hero-gradient">
      {/* Enhanced Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 nav-blur-enhanced"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <motion.h1 
                className="text-3xl font-bold text-white relative"
                animate={{
                  textShadow: [
                    '0 0 10px rgba(255,255,255,0.3)',
                    '0 0 20px rgba(255,255,255,0.5)',
                    '0 0 10px rgba(255,255,255,0.3)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Timetable Ace
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-20 blur-lg"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.h1>
            </motion.div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <motion.a 
                  href="#features" 
                  className="nav-link"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Features</span>
                  <motion.div 
                    className="nav-underline"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
                <motion.a 
                  href="#about" 
                  className="nav-link"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>About</span>
                  <motion.div 
                    className="nav-underline"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="nav-button-cool">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: 'easeInOut',
              times: [0, 0.5, 1]
            }}
            className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30 blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, 40, 0],
              x: [0, -15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 2
            }}
            className="absolute bottom-20 right-10 w-36 h-36 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-25 blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              x: [0, 30, 0],
              rotate: [0, -180, 0]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 1
            }}
            className="absolute top-1/2 right-20 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, 25, 0],
              x: [0, -20, 0],
              scale: [0.8, 1.1, 0.8]
            }}
            transition={{ 
              duration: 14, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 3
            }}
            className="absolute top-1/3 left-1/4 w-28 h-28 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-15 blur-2xl"
          />
          <motion.div
            animate={{ 
              y: [0, -35, 0],
              x: [0, 25, 0],
              rotate: [0, 270, 0]
            }}
            transition={{ 
              duration: 16, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 4
            }}
            className="absolute bottom-1/3 left-10 w-32 h-32 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-20 blur-xl"
          />
          
          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.sin(i) * 50, 0],
                opacity: [0.1, 0.6, 0.1]
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeInOut'
              }}
              className={`absolute w-2 h-2 bg-white rounded-full blur-sm`}
              style={{
                left: `${10 + i * 10}%`,
                top: `${20 + Math.sin(i) * 30}%`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <motion.div
              animate={{
                y: [0, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Badge className="mb-4 bg-transparent text-pink-300 border-transparent px-4 py-2 rounded-full backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                </motion.div>
                NEP 2020 Compliant
              </Badge>
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-6 relative"
          >
            <motion.span 
              className="block text-white mb-2"
              animate={{ 
                textShadow: [
                  '0 0 10px rgba(255,255,255,0.5)',
                  '0 0 20px rgba(255,255,255,0.8)',
                  '0 0 10px rgba(255,255,255,0.5)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              AI-Powered
            </motion.span>
            <motion.span 
              className="block text-blue-300 typing-animation relative"
              animate={{
                textShadow: [
                  '0 0 10px rgba(147, 197, 253, 0.5)',
                  '0 0 20px rgba(147, 197, 253, 0.8)',
                  '0 0 30px rgba(147, 197, 253, 0.6)',
                  '0 0 20px rgba(147, 197, 253, 0.8)',
                  '0 0 10px rgba(147, 197, 253, 0.5)'
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              Timetable Generator
              <motion.span
                className="absolute -inset-1 bg-gradient-to-r from-blue-300 via-purple-400 to-cyan-400 opacity-20 blur-lg"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed relative"
          >
            <motion.span
              animate={{
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {problemStatementData.problem_statement.title}
            </motion.span>
          </motion.p>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="hero-button-primary">
                  <Wand2 className="mr-2 h-5 w-5" />
                  Start Generating
                </Button>
              </motion.div>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hero-button-secondary"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="neon-text">Powerful Features</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to create perfect timetables for modern educational institutions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                }}
                className="glass-card p-8 neon-hover group cursor-pointer"
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="text-4xl mb-4 group-hover:drop-shadow-lg"
                >
                  <feature.icon className="h-12 w-12 text-purple-400" />
                </motion.div>

                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  {feature.description}
                </p>

                <motion.div
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  className="h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 mt-4 transition-all duration-300"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                <span className="neon-text">Why Choose Timetable Ace?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Our AI-powered system revolutionizes timetable generation for educational institutions, 
                making complex scheduling simple and efficient.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="glass-card p-8"
            >
              <Card className="bg-transparent border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">
                    Ready to Transform Your Scheduling?
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Join educational institutions already using Timetable Ace to streamline their operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <div className="text-3xl font-bold text-purple-400">500+</div>
                      <div className="text-sm text-gray-300">Institutions</div>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <div className="text-3xl font-bold text-cyan-400">50K+</div>
                      <div className="text-sm text-gray-300">Students Served</div>
                    </div>
                  </div>
                  
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Get Started Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-t from-slate-900 to-transparent border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold neon-text mb-4">
                Timetable Ace
              </h3>
              <p className="text-gray-300 mb-6">
                AI-Powered Timetable Generation for Modern Education
              </p>
              <div className="flex items-center justify-center space-x-6">
                <span className="text-gray-400 text-sm">Made with</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-red-500 text-lg"
                >
                  ❤️
                </motion.span>
                <span className="text-gray-400 text-sm">for Education</span>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                © 2025 Government of Jammu & Kashmir. All rights reserved.
              </p>
            </motion.div>
          </div>
        </div>
      </footer>


    </div>
  );
}
