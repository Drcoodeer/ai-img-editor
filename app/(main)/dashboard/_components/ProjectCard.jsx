'use client'
import React from 'react'
import { motion } from "framer-motion";
import Link from 'next/link';
import { Edit3, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';

export const ProjectCard = ({ project, onEdit }) => {

    const { mutate: deleteProject, isLoading } = useConvexMutation(
        api.projects.deleteProject
    );

    const lastUpdated = formatDistanceToNow(new Date(project.updatedAt), {
        addSuffix: false,
    });

    const handleDelete = async (project) => {
        const confirmed = confirm(
            `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
        );

        if (confirmed) {
            try {
                await deleteProject({ projectId: project._id });
                toast.success("Project deleted successfully");
            } catch (error) {
                console.error("Error deleting project:", error);
                toast.error("Failed to delete project. Please try again.");
            }
        }
    };
    return (
        <motion.div
            key={project._id}
            className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-violet-400/50 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
        >
            <div className="aspect-video bg-slate-800 relative overflow-hidden">
                <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                        <Link href={`/editor/${project._id}`}>
                            <button
                                onClick={() => onEdit(project._id)}
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                            </button>
                        </Link>
                        <button
                            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                            onClick={() => handleDelete(project)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 space-y-1">
                <h3 className="text-white font-semibold truncate">
                    {project.title || "Untitled Project"}
                </h3>
                <p className="text-slate-400 text-sm">Updated {lastUpdated}</p>
                <p className="text-slate-500 text-xs">
                    {project.width}×{project.height}px
                </p>
            </div>
        </motion.div>
    )
}
