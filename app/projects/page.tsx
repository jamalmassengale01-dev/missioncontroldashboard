'use client';

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create project form state
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'Planning',
    category: '',
  });

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
    setNewProject({
      name: '',
      description: '',
      status: 'Planning',
      category: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveNewProject = () => {
    if (!newProject.name) return;
    
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name || '',
      description: newProject.description || '',
      status: newProject.status || 'Planning',
      category: newProject.category || 'General',
      progress: 0,
      linkedTaskCount: 0,
      linkedDocumentCount: 0,
      milestones: [],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    setProjects(prev => [project, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setIsModalOpen(false);
      setSelectedProject(null);
    }
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
                  onDelete={() => handleDeleteProject(project.id)}
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
        onSave={(updatedProject) => {
          setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
          setSelectedProject(updatedProject);
        }}
        onDelete={handleDeleteProject}
      />

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewProject}>Create Project</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Project Name</label>
            <input
              type="text"
              value={newProject.name || ''}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              placeholder="Enter project name..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              value={newProject.description || ''}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              rows={3}
              placeholder="Enter project description..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Status</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
              <input
                type="text"
                value={newProject.category || ''}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                placeholder="e.g., Trading, Content"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
