'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { Button } from '@/components/ui/Button';
import { projectsData } from '@/lib/data';
import { Project, ProjectStatus } from '@/lib/types';
import { Plus, Filter, ArrowUpDown } from 'lucide-react';

const statusOptions: ProjectStatus[] = ['Planning', 'Active', 'Paused', 'Completed'];
type SortOption = 'updated' | 'progress';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(projectsData);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (selectedStatus) {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
      return b.progress - a.progress;
    });
  }, [projects, selectedStatus, sortBy]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Projects" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-100">Projects</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Track and manage major initiatives
                </p>
              </div>
              <Button onClick={handleCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">Filter:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedStatus(null)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedStatus === null
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        selectedStatus === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 sm:ml-auto">
                <ArrowUpDown className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="updated">Last Updated</option>
                  <option value="progress">Progress</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No projects found matching your filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
      />
    </div>
  );
}
