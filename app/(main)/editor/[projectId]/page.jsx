'use client'
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { useScroll, useTransform } from "framer-motion";
import { Monitor } from "lucide-react";
import { useParams } from "next/navigation";
import { BarLoader, RingLoader } from "react-spinners";
import CanvasEditor from "./_components/Canvas";
import EditorTopBar from "./_components/EditorTopBar";
import EditorSidebar from "./_components/EditorSidebar";
import { useCallback, useEffect } from "react";

const Editor = () => {
    const params = useParams();
    const projectId = params?.projectId;
    const { data: project, isLoading, error } = useConvexQuery(api.projects.getProject, { projectId })
    const { processingMessage, canvasEditor } = useCanvas()
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const { mutate: updateProject } = useConvexMutation(
        api.projects.updateProject
    );

    useEffect(() => {
        return async () => {
            if (!canvasEditor || !project) return;

            await updateProject({
                projectId: project._id,
                canvasState: canvasEditor.toJSON(),
            });
        };
    }, []);

    if (isLoading) {
        return (
            <div className="mb-4">
                <BarLoader
                    color="#7C3AED"
                    height={4}
                    width="100%"
                    speedMultiplier={1}
                />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Project Not Found
                    </h1>
                    <p className="text-white/70">
                        The project you're looking for doesn't exist or you don't have
                        access to it.
                    </p>
                </div>
            </div>
        );
    }


    return (
        <>
            {/* FallBack screen for Mobile Devices */}
            <div className="lg:hidden min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <Monitor className="w-16 h-16 text-cyan-300 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-white mb-4">Desktop Required</h1>
                    <p className="text-white/70 text-lg mb-2">
                        This editor is only usable on desktop.
                    </p>
                    <p className="text-white/50 text-sm">
                        Please use a larger screen to access the full editing experience.
                    </p>
                </div>
            </div>

            {/* Desktop Editor - Show on lg screens and above */}
            <div className="hidden lg:block min-h-screen bg-slate-900">
                <div className="flex flex-col h-screen">
                    {processingMessage && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center">
                            <div className="rounded-lg p-6 flex flex-col items-center gap-4">
                                <RingLoader color="#fff" />
                                <div className="text-center">
                                    <p className="text-white font-medium">{processingMessage}</p>
                                    <p className="text-white/70 text-sm mt-1">
                                        Please wait, do not switch tabs or navigate away
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Bar */}
                    <EditorTopBar project={project} />

                    {/* Main Editor Layout */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar */}
                        <EditorSidebar project={project} />

                        {/* Canvas Area */}
                        <div className="flex-1 bg-slate-800">
                            <CanvasEditor project={project} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export default Editor