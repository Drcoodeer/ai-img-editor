"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Wand2, Scissors, Sparkles, ImageIcon,
  ArrowRight, Crown, Check
} from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import StatsCounter from '@/components/StatsCounter';
import Link from 'next/link';
import FeatureCard from '@/components/FeatureCard';
import { UserButton } from '@clerk/nextjs';
import { Authenticated, Unauthenticated } from 'convex/react';
import PricingSection from '@/components/Pricing';
import Image from 'next/image';

export default function LandingPage() {

  const [isDarkMode, setIsDarkMode] = useState(true);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  return (
    <>
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} relative overflow-hidden`}>
        <ParticleBackground />

        {/* Header */}
        <motion.header
          className="relative z-20 flex items-center justify-between p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-2">
            {/* Logo image container */}
            <div className="w-8 h-8 relative">
              <Image
                src='/images/logo-main.png'
                alt="PixelForge AI Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority // Important for above-the-fold images
              />
            </div>

            {/* Text with gradient - kept as is or can be modified */}
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              PixelForge AI
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Features
            </button>

            <button
              onClick={() => {
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-300 hover:text-white transition-colors"
            >
              pricing
            </button>
            <Link href="/dashboard">
              <button
                className="bg-gradient-to-r from-violet-600 to-cyan-400 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
              >
                Get Started
              </button>
            </Link>
          </nav>

          <div className="flex items-center justify-center gap-3">
            <Unauthenticated>
              <Link href="/sign-in">
                <button className="text-white hover:text-cyan-400 transition-colors text-sm">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="bg-white text-sm text-violet-600 px-4 py-2 rounded-md hover:bg-slate-100 transition">
                  Sign Up
                </button>
              </Link>
            </Unauthenticated>

            <Authenticated>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9",
                  },
                }}
              />
            </Authenticated>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="relative z-10 text-center py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-br from-violet-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Design Like
              </span>
              <br />
              <span className="bg-gradient-to-br from-cyan-400 to-violet-600 bg-clip-text text-transparent">
                Never Before
              </span>
            </h1>

            <motion.p
              className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Powerful AI meets intuitive design. Transform your images with cutting-edge artificial intelligence and real-time creative control.
            </motion.p>

            <motion.button
              className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-cyan-400 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:scale-105 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link href="/dashboard">
                <span className="relative z-10 flex items-center">
                  Start Creating Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex justify-center space-x-12 mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <StatsCounter end={100000} label="Images Enhanced" />
            <StatsCounter end={50000} label="Happy Users" />
            <StatsCounter end={99} label="AI Accuracy %" />
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="relative z-10 py-20 px-6">
          <motion.div
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-semibold text-center mb-4">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                AI-Powered Features
              </span>
            </h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
              Experience the future of image editing with our revolutionary AI tools
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

              <FeatureCard
                icon={Scissors}
                title="Smart Background"
                description="Remove or replace backgrounds with AI precision in seconds"
                index={0}
              />
              <FeatureCard
                icon={Sparkles}
                title="AI Generation"
                description="Create stunning backgrounds from simple text descriptions"
                index={1}
              />
              <FeatureCard
                icon={ImageIcon}
                title="Image Extension"
                description="Expand your images beyond borders with intelligent outpainting"
                index={2}
              />
              <FeatureCard
                icon={Wand2}
                title="Retouch & Upscale"
                description="Professional retouching and AI-powered upscaling technology"
                index={3}
              />
            </div>
          </motion.div>
        </section>

        {/* Pricing */}
        <PricingSection />

      </div>
    </>
  );
}
