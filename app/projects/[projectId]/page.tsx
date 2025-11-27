import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import ProjectWorkspace from '@/app/components/ProjectWorkspace'
import { getCurrentUser } from '@/lib/supabase/server'
import { getProjectById } from '@/lib/supabase/projects'

interface ProjectPageProps {
  params: { projectId: string }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth')
  }

  const project = await getProjectById(params.projectId)
  if (!project || project.user_id !== user.id) {
    notFound()
  }

  return (
    <AppShell userEmail={user.email}>
      <div className="flex items-center gap-2 text-sm text-white/80">
        <Link href="/projects" className="hover:underline">
          ← Back to Projects
        </Link>
        <span>/</span>
        <span>{project.name}</span>
      </div>
      <ProjectWorkspace project={project} user={{ id: user.id, email: user.email }} />
    </AppShell>
  )
}

