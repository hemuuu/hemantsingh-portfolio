import React, { useState, useEffect } from 'react';
import Portfolio from './components/Portfolio';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import { Settings } from 'lucide-react';

interface ProjectData {
  id: number;
  name: string;
  description: string;
  link: string;
  thumbnail: string;
  x: number;
  y: number;
  z: number;
}

interface SocialLinks {
  instagram: string;
  linkedin: string;
  youtube: string;
}

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0, z: 0 });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => {
    const savedLinks = localStorage.getItem('socialLinks');
    return savedLinks ? JSON.parse(savedLinks) : {
      instagram: '#',
      linkedin: '#',
      youtube: '#'
    };
  });

  // Initialize projects data
  useEffect(() => {
    const savedProjects = localStorage.getItem('portfolioProjects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      // Generate initial placeholder projects
      const initialProjects: ProjectData[] = [];
      for (let i = 0; i < 50; i++) {
        initialProjects.push({
          id: i + 1,
          name: `Project ${i + 1}`,
          description: `Description for project ${i + 1}`,
          link: '#',
          thumbnail: `https://picsum.photos/1080/1500?random=${i}`,
          x: Math.random() * 4000 - 2000,
          y: Math.random() * 4000 - 2000,
          z: Math.random() * 1000
        });
      }
      setProjects(initialProjects);
      localStorage.setItem('portfolioProjects', JSON.stringify(initialProjects));
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    setIsAdminMode(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdminMode(false);
  };

  const handleProjectUpdate = (updatedProject: ProjectData) => {
    const updatedProjects = projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(updatedProjects);
    localStorage.setItem('portfolioProjects', JSON.stringify(updatedProjects));
  };

  const handleProjectAdd = (newProjectData: Omit<ProjectData, 'id'>) => {
    const newId = Math.max(...projects.map(p => p.id), 0) + 1;
    const newProject: ProjectData = {
      ...newProjectData,
      id: newId
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('portfolioProjects', JSON.stringify(updatedProjects));
  };

  const handleProjectDelete = (id: number) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('portfolioProjects', JSON.stringify(updatedProjects));
  };

  const handleSocialLinksUpdate = (newLinks: SocialLinks) => {
    setSocialLinks(newLinks);
    localStorage.setItem('socialLinks', JSON.stringify(newLinks));
  };

  const handleSettingsClick = () => {
    if (isAuthenticated) {
      setIsAdminMode(!isAdminMode);
    } else {
      setShowLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAdminMode ? (
        <Portfolio 
          projects={projects} 
          onOffsetChange={setOffset}
          socialLinks={socialLinks}
        />
      ) : (
        <AdminPanel 
          projects={projects} 
          onProjectUpdate={handleProjectUpdate}
          onProjectAdd={handleProjectAdd}
          onProjectDelete={handleProjectDelete}
          onLogout={handleLogout}
          socialLinks={socialLinks}
          onSocialLinksUpdate={handleSocialLinksUpdate}
        />
      )}

      {/* Position Display with Admin Toggle */}
      <div 
        onClick={() => {
          if (isAuthenticated) {
            setIsAdminMode(!isAdminMode);
          } else {
            setShowLogin(true);
          }
        }}
        className="fixed bottom-5 right-5 font-mono text-xs text-gray-800 bg-white bg-opacity-80 px-3 py-2 border border-gray-300 z-50 min-w-30 cursor-pointer hover:bg-gray-50 transition-all duration-300"
      >
        {isAdminMode ? 'Exit Admin' : 'X: ' + Math.round(offset.x) + ' Y: ' + Math.round(offset.y) + ' Z: ' + Math.round(offset.z)}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal 
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

export default App;