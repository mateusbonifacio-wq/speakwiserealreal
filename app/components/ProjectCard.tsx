'use client'

import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/supabase/projects'
import ProjectFormDialog from './ProjectFormDialog'

interface ProjectCardProps {
  project: Project
  lastActivity?: string | null
}

export default function ProjectCard({ project, lastActivity }: ProjectCardProps) {
  const router = useRouter()

  const handleOpen = () => {
    router.push(`/projects/${project.id}`)
  }

  const infoBadges = [
    project.default_audience && { label: 'Audience', value: project.default_audience },
    project.default_goal && { label: 'Goal', value: project.default_goal },
    project.default_duration && { label: 'Duration', value: project.default_duration },
    project.default_scenario && { label: 'Scenario', value: project.default_scenario },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            onClick={handleOpen}
            className="text-left text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
          >
            {project.name}
          </button>
          {project.project_type && (
            <p className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
              {project.project_type}
            </p>
          )}
        </div>
        <ProjectFormDialog triggerLabel="Edit" variant="ghost" project={project} />
      </div>

      {project.description && (
        <p className="mt-3 text-sm text-gray-600">{project.description}</p>
      )}

      {infoBadges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {infoBadges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-0.5 text-xs text-gray-700"
            >
              <span className="font-medium mr-1">{badge.label}:</span> {badge.value}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          Last activity:{' '}
          {lastActivity
            ? new Date(lastActivity).toLocaleDateString()
            : '—'}
        </span>
        <button
          onClick={handleOpen}
          className="text-indigo-600 font-medium hover:underline"
        >
          Open
        </button>
      </div>
    </div>
  )
}

