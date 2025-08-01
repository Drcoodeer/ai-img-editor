'use client'
import React from 'react'
import { ProjectCard } from './ProjectCard'
import { useRouter } from 'next/navigation'

const ProjectGrid = ({ projects }) => {
    const router = useRouter()
    const handleEditProject = (projectId) => {
        router.push(`editor/${projectId}`)
    }
    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                    <ProjectCard
                        key={project._id}
                        project={project}
                        onEdit={() => handleEditProject(project._id)}
                    />
                ))}
            </div>
        </>
    )
}

export default ProjectGrid