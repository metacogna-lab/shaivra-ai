import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, Plus, Search, Filter, MoreVertical, Clock, User, Star, Trash2 } from 'lucide-react';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState([
    {
      id: 'p1',
      name: 'Project Blue Horizon',
      description: 'Strategic analysis of maritime logistics in the South China Sea.',
      status: 'active',
      lastModified: '2024-03-01T14:30:00Z',
      owner: 'Kalastra',
      tags: ['OSINT', 'Maritime', 'Strategic'],
      isFavorite: false
    },
    {
      id: 'p2',
      name: 'Operation Silver Shield',
      description: 'Monitoring of financial flows related to illicit mining operations.',
      status: 'archived',
      lastModified: '2024-02-15T09:12:00Z',
      owner: 'Kalastra',
      tags: ['Finance', 'Mining', 'Africa'],
      isFavorite: true
    },
    {
      id: 'p3',
      name: 'Narrative Pulse: NGO X',
      description: 'Real-time tracking of disinformation campaigns against humanitarian efforts.',
      status: 'active',
      lastModified: '2024-03-03T18:45:00Z',
      owner: 'Kalastra',
      tags: ['Narrative', 'NGO', 'Disinfo'],
      isFavorite: false
    }
  ]);

  const toggleFavorite = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Projects</h1>
            <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">Strategic Intelligence Workspace</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-purpose-gold text-black font-mono text-xs uppercase font-bold tracking-widest hover:bg-white transition-colors rounded-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-sm text-white focus:border-purpose-gold outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border border-white/10 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors">
              <Clock className="w-4 h-4" /> Recent
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-neutral-900/50 border border-white/5 hover:border-purpose-gold/30 rounded-2xl p-6 transition-all hover:shadow-2xl hover:shadow-purpose-gold/5"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purpose-gold/10 rounded-xl text-purpose-gold">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleFavorite(project.id)} className={`transition-colors ${project.isFavorite ? 'text-purpose-gold' : 'text-neutral-600 hover:text-purpose-gold'}`}>
                    <Star className="w-5 h-5" fill={project.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteProject(project.id)} className="text-neutral-600 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-display font-medium text-white mb-2 group-hover:text-purpose-gold transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-6 line-clamp-2">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-neutral-400 uppercase">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-600 uppercase">
                  <User className="w-3 h-3" />
                  {project.owner}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-600 uppercase">
                  <Clock className="w-3 h-3" />
                  {new Date(project.lastModified).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
