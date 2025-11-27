'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/supabase/projects'

interface ProjectFormDialogProps {
  triggerLabel: string
  variant?: 'primary' | 'ghost'
  project?: Project | null
}

const PROJECT_TYPE_OPTIONS = [
  'Startup pitch',
  'Job interview',
  'Sales pitch',
  'Personal intro',
  'Investor update',
  'Custom',
]

export default function ProjectFormDialog({
  triggerLabel,
  variant = 'primary',
  project,
}: ProjectFormDialogProps) {
  const isEdit = Boolean(project)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formValues, setFormValues] = useState({
    name: project?.name || '',
    project_type: project?.project_type || '',
    description: project?.description || '',
    default_audience: project?.default_audience || '',
    default_goal: project?.default_goal || '',
    default_duration: project?.default_duration || '',
    default_scenario: project?.default_scenario || '',
  })

  const resetState = () => {
    if (!isEdit) {
      setFormValues({
        name: '',
        project_type: '',
        description: '',
        default_audience: '',
        default_goal: '',
        default_duration: '',
        default_scenario: '',
      })
    } else if (project) {
      setFormValues({
        name: project.name,
        project_type: project.project_type || '',
        description: project.description || '',
        default_audience: project.default_audience || '',
        default_goal: project.default_goal || '',
        default_duration: project.default_duration || '',
        default_scenario: project.default_scenario || '',
      })
    }
    setError(null)
  }

  const closeDialog = () => {
    setIsOpen(false)
    resetState()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        isEdit ? `/api/projects/${project?.id}` : '/api/projects',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save project')
      }

      const data = await response.json()

      if (isEdit) {
        closeDialog()
        router.refresh()
      } else {
        router.push(`/projects/${data.project.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    const confirmed = window.confirm(
      `Delete project "${project.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete project')
      }
      closeDialog()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete project')
    } finally {
      setLoading(false)
    }
  }

  const triggerClasses =
    variant === 'primary'
      ? 'px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-colors'
      : 'text-sm text-indigo-600 underline-offset-2 hover:underline'

  return (
    <>
      <button className={triggerClasses} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEdit ? 'Edit Project' : 'Create Project'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEdit
                    ? 'Update project details and defaults'
                    : 'Organize each pitch or scenario with its own context'}
                </p>
              </div>
              <button
                onClick={closeDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Project Type
                </label>
                <select
                  value={formValues.project_type}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      project_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select type</option>
                  {PROJECT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="What is this project about?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Default Audience
                  </label>
                  <input
                    type="text"
                    value={formValues.default_audience}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        default_audience: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Investors, Hiring panel..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Default Goal
                  </label>
                  <input
                    type="text"
                    value={formValues.default_goal}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        default_goal: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Secure funding, close deal..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Default Duration
                  </label>
                  <input
                    type="text"
                    value={formValues.default_duration}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        default_duration: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 3 minutes"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Default Scenario
                  </label>
                  <input
                    type="text"
                    value={formValues.default_scenario}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        default_scenario: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Demo day, interview, sales call..."
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  {isEdit && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

