'use client'
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useScroll, useTransform } from "framer-motion";
import { Home, ImageIcon, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BarLoader } from "react-spinners";
import { NewProjectModal } from "./_components/NewProjectModal";
import { Button } from "@/components/ui/button";
import ProjectGrid from "./_components/ProjectGrid";
import Image from "next/image";

const Dashboard = () => {
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    // Get user's projects
    const { data: projects, isLoading } = useConvexQuery(
        api.projects.getUserProjects
    );

    const [isDarkMode, setIsDarkMode] = useState(true);
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            {/* Header */}
            <header className="border-b border-slate-800 p-6">
                <div className="flex items-center justify-between">
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
                            Your Projects
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-6 py-2 flex items-center"
                            variant="gradient"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                        <Link href={`/`} >
                            <button
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <Home className="w-6 h-6" />
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Projects Grid */}
            <>
                {isLoading && (
                    <div className="mb-4">
                        <BarLoader
                            color="#7C3AED"
                            height={4}
                            width="100%"
                            speedMultiplier={1}
                        />
                    </div>
                )}
                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center text-slate-400 py-12">Loading your projects...</div>
                    ) : projects?.length > 0 ? (
                        <ProjectGrid projects={projects} />
                    ) : (
                        // No projects fallback
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <ImageIcon className="w-12 h-12 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-4">No projects yet</h2>
                            <p className="text-slate-400 mb-8">Create your first AI-powered image project</p>
                            <Button variant="gradient"
                                onClick={() => setShowNewProjectModal(true)}
                            >
                                Create Your First Project
                            </Button>
                        </div>
                    )}
                </div>
            </>

            <NewProjectModal
                isOpen={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
            />

        </div>
    );
}

export default Dashboard