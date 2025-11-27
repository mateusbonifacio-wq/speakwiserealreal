import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import ProjectFormDialog from '@/app/components/ProjectFormDialog'
import ProjectCard from '@/app/components/ProjectCard'
import { getCurrentUser } from '@/lib/supabase/server'
import { getUserProjects } from '@/lib/supabase/projects'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth')
  }

  const projects = await getUserProjects()

  return (
    <AppShell userEmail={user.email}>
      <div className="bg-white/90 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Your Projects</h2>
            <p className="text-sm text-gray-600">
              Create a project for each startup, role, or pitch you want to practice.
            </p>
          </div>
          <ProjectFormDialog triggerLabel="New Project" />
        </div>

        {projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Organize each pitch or communication scenario with its own workspace.
            </p>
            <ProjectFormDialog triggerLabel="Create your first project" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/auth"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Need to switch accounts?
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

