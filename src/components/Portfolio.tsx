import React, { useState, useEffect, useRef } from 'react';
import Preloader from './Preloader';

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

interface PortfolioProps {
  projects: ProjectData[];
  onOffsetChange?: (offset: { x: number; y: number; z: number }) => void;
  socialLinks?: SocialLinks;
}

const Portfolio: React.FC<PortfolioProps> = ({ projects: initialProjects, onOffsetChange, socialLinks = {
  instagram: '#',
  linkedin: '#',
  youtube: '#'
} }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0, z: 0 });
  const [blurFlash, setBlurFlash] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPanningDisabled, setIsPanningDisabled] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectData | null>(null);
  const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; time: number }>>([]);
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);

  const worldSize = 4000;
  const mapWidth = 180;
  const mapHeight = 120;
  const mapScaleX = mapWidth / worldSize;
  const mapScaleY = mapHeight / worldSize;

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Update cursor trail
      const now = Date.now();
      setCursorTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, time: now }];
        return newTrail.filter(point => now - point.time < 200);
      });

      // Handle dragging
      if (isDragging && !isDraggingMinimap) {
        setOffset(prev => ({
          ...prev,
          x: prev.x + (e.clientX - startPos.x) * 2,
          y: prev.y + (e.clientY - startPos.y) * 2
        }));
        setStartPos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Enhanced edge panning with continuous movement
      if (!isPanningDisabled && !isDragging) {
        const edgeBuffer = 200;
        const moveSpeed = 50;

        let newX = offset.x;
        let newY = offset.y;

        // Check if cursor is in edge zones
        const isLeftEdge = e.clientX < edgeBuffer;
        const isRightEdge = e.clientX > window.innerWidth - edgeBuffer;
        const isTopEdge = e.clientY < edgeBuffer;
        const isBottomEdge = e.clientY > window.innerHeight - edgeBuffer;

        // Calculate movement intensity based on distance from edge
        const getIntensity = (distance: number) => {
          const normalized = Math.max(0, 1 - distance / edgeBuffer);
          return normalized * moveSpeed;
        };

        // Apply continuous movement based on edge detection
        if (isLeftEdge) {
          const intensity = getIntensity(e.clientX);
          newX += intensity;
        }
        if (isRightEdge) {
          const intensity = getIntensity(window.innerWidth - e.clientX);
          newX -= intensity;
        }
        if (isTopEdge) {
          const intensity = getIntensity(e.clientY);
          newY += intensity;
        }
        if (isBottomEdge) {
          const intensity = getIntensity(window.innerHeight - e.clientY);
          newY -= intensity;
        }

        // Apply movement
        setOffset(prev => ({
          ...prev,
          x: newX,
          y: newY
        }));

        // Clamp offset
        const maxOffset = worldSize / 2 - 200;
        setOffset(prev => ({
          ...prev,
          x: Math.max(-maxOffset, Math.min(maxOffset, prev.x)),
          y: Math.max(-maxOffset, Math.min(maxOffset, prev.y))
        }));
      }

      if (isDraggingMinimap && minimapRef.current) {
        const rect = minimapRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setOffset(prev => ({
          ...prev,
          x: Math.max(-worldSize / 2, Math.min(worldSize / 2, mx / mapScaleX - worldSize / 2 - window.innerWidth / 2)),
          y: Math.max(-worldSize / 2, Math.min(worldSize / 2, my / mapScaleY - worldSize / 2 - window.innerHeight / 2))
        }));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Check if middle mouse button is pressed (button 1)
      if (e.button === 1 || e.buttons === 4) {
        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        e.preventDefault(); // Prevent default middle-click behavior
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingMinimap(false);
    };

    const handleWheel = (e: WheelEvent) => {
      setOffset(prev => ({
        ...prev,
        z: prev.z + e.deltaY * 0.4
      }));
      setBlurFlash(1);
    };

    // Add middle mouse button event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('wheel', handleWheel);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, isDraggingMinimap, startPos, isPanningDisabled, offset]);

  useEffect(() => {
    // Auto-update blur flash
    const interval = setInterval(() => {
      setBlurFlash(prev => prev * 0.9);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update projects when initialProjects changes
    setProjects(initialProjects);
  }, [initialProjects]);

  // Update parent component when offset changes
  useEffect(() => {
    onOffsetChange?.(offset);
  }, [offset, onOffsetChange]);

  const handleShuffle = () => {
    // Randomize project positions with more spread
    const updatedProjects = projects.map(project => ({
      ...project,
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      z: Math.random() * 1000
    }));
    
    // Update projects in state and localStorage
    setProjects(updatedProjects);
    localStorage.setItem('portfolioProjects', JSON.stringify(updatedProjects));
    
    // Reset view position with animation
    setOffset({ x: 0, y: 0, z: 0 });
    setBlurFlash(2);
    
    setTimeout(() => {
      setBlurFlash(0);
    }, 300);
  };

  const handleProjectClick = (project: ProjectData) => {
    if (project.link && project.link !== '#') {
      window.open(project.link, '_blank');
    }
  };

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100" style={{ cursor: 'none' }}>
      {/* Social Icons */}
      <div className="fixed top-3 left-5 flex gap-3 z-[60]">
        <a 
          href={socialLinks.youtube} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-6 h-6 bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors"
          onMouseEnter={() => setIsPanningDisabled(true)}
          onMouseLeave={() => setIsPanningDisabled(false)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
            <rect width="24" height="24" rx="4" fill="white" fillOpacity="0"/>
            <path d="M10 15.5V8.5L16 12L10 15.5Z" fill="white"/>
          </svg>
        </a>
        <a 
          href={socialLinks.instagram} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-6 h-6 bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors"
          onMouseEnter={() => setIsPanningDisabled(true)}
          onMouseLeave={() => setIsPanningDisabled(false)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" fill="#18181b"/>
            <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm6.5-1.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="white"/>
          </svg>
        </a>
        <a 
          href={socialLinks.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-6 h-6 bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors"
          onMouseEnter={() => setIsPanningDisabled(true)}
          onMouseLeave={() => setIsPanningDisabled(false)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" fill="#18181b"/>
            <path d="M6.94 19V9.75H4.25V19h2.69ZM5.6 8.56c.86 0 1.39-.57 1.39-1.28-.02-.73-.53-1.28-1.37-1.28-.84 0-1.39.55-1.39 1.28 0 .71.53 1.28 1.36 1.28h.01ZM8.98 19h2.69v-5.13c0-.27.02-.54.1-.73.22-.54.72-1.1 1.56-1.1 1.1 0 1.54.83 1.54 2.05V19h2.69v-5.5c0-2.95-1.57-4.32-3.67-4.32-1.7 0-2.45.94-2.87 1.6h.02V9.75H8.98c.04.86 0 9.25 0 9.25Z" fill="white"/>
          </svg>
        </a>
      </div>

      {/* Header */}
      <div className="fixed top-3 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-[60]">
        <span className="font-mono text-base text-gray-900">Hemantsingh Panwar</span>
      </div>

      {/* Center Buttons */}
      <div id="center-buttons" className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-5 z-50 pointer-events-auto">
        <button
          id="showreel-btn"
          className="px-6 py-3 bg-blue-500 text-white border-none font-mono text-sm font-bold cursor-pointer transition-all duration-300 tracking-wider hover:bg-blue-700 hover:-translate-y-0.5"
        >
          SHOW REEL
        </button>
        <button
          id="download-btn"
          className="w-12 h-12 bg-white border-2 border-gray-800 cursor-pointer transition-all duration-300 flex items-center justify-center text-xl text-gray-800 font-bold hover:bg-gray-800 hover:text-white hover:-translate-y-0.5"
        >
          ↓
        </button>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-3 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-600 z-50">
        2025 Hemantsinghpanwar. All rights reserved.
      </footer>

      {/* Shuffle Button */}
      <button
        id="shuffle-btn"
        onClick={handleShuffle}
        onMouseEnter={() => setIsPanningDisabled(true)}
        onMouseLeave={() => setIsPanningDisabled(false)}
        className="fixed bottom-5 left-5 px-3 py-2 bg-white border border-gray-800 font-mono text-xs text-gray-800 cursor-pointer transition-all duration-300 flex items-center gap-1.5 z-[60] hover:bg-gray-50 hover:-translate-y-0.5"
        style={{ pointerEvents: 'auto' }}
      >
        <span>⚂</span>
        <span>SHUFFLE</span>
      </button>

      {/* Position Display */}
      <div className="fixed bottom-5 right-5 font-mono text-xs text-gray-800 bg-white bg-opacity-80 px-3 py-2 border border-gray-300 z-50 min-w-30">
        X: {Math.round(offset.x)} Y: {Math.round(offset.y)} Z: {Math.round(offset.z)}
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="w-full h-full relative overflow-hidden">
        {/* Minimap */}
        <div
          id="minimap"
          ref={minimapRef}
          className="absolute top-3 right-3 bg-white bg-opacity-90 border border-gray-300 z-[60] overflow-hidden cursor-crosshair"
          style={{ width: '180px', height: '120px' }}
        >
          <div
            id="viewportBox"
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-15 pointer-events-none"
            style={{
              width: `${window.innerWidth * mapScaleX}px`,
              height: `${window.innerHeight * mapScaleY}px`,
              left: `${(offset.x + worldSize / 2) * mapScaleX}px`,
              top: `${(offset.y + worldSize / 2) * mapScaleY}px`
            }}
          />
          {projects.map((project) => (
            <div
              key={project.id}
              className="absolute w-1 h-1 bg-black"
              style={{
                left: `${(project.x + worldSize / 2) * mapScaleX}px`,
                top: `${(project.y + worldSize / 2) * mapScaleY}px`
              }}
            />
          ))}
        </div>

        {/* Projects */}
        {projects.map((project) => {
          const z = project.z + offset.z;
          const scaleZ = 1 - z / 3000;
          const px = (project.x + offset.x) * scaleZ + window.innerWidth / 2;
          const py = (project.y + offset.y) * scaleZ + window.innerHeight / 2;

          const dx = mousePos.x - (px + 180);
          const dy = mousePos.y - (py + 250);
          const dist = Math.hypot(dx, dy);

          let scale = 0.5;
          if (dist < 100) scale = 2.0;
          else if (dist < 200) scale = 1.4;
          else if (dist < 350) scale = 0.9;

          const isHovered = dist < 180;

          return (
            <div
              key={project.id}
              className="absolute bg-gray-800 flex justify-center transition-all duration-400 cursor-pointer group"
              style={{
                width: '280px',
                height: '380px',
                transform: `translate(${px}px, ${py}px) scale(${scaleZ * scale})`,
                zIndex: scale > 0.7 ? 20 : 1,
                filter: `blur(${blurFlash * 4}px)`,
                willChange: 'transform'
              }}
              onClick={() => handleProjectClick(project)}
              onMouseEnter={() => setHoveredProject(project)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <img
                src={project.thumbnail}
                alt={project.name}
                className={`w-full h-full object-cover transition-all duration-200 ${
                  isHovered ? 'grayscale-0' : 'grayscale'
                }`}
                style={{ imageRendering: 'crisp-edges' }}
              />
              {/* Project Description Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-4">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center transform translate-y-4 group-hover:translate-y-0 max-h-[80%] overflow-y-auto">
                  <p className="text-[7px] leading-relaxed font-mono tracking-wide">{project.description}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Custom Cursor */}
        <div
          className="fixed z-50 pointer-events-none flex items-center gap-1.5 text-xs font-bold"
          style={{
            left: `${mousePos.x + 10}px`,
            top: `${mousePos.y + 10}px`,
            display: mousePos.x === 0 && mousePos.y === 0 ? 'none' : 'flex',
            color: hoveredProject ? 'white' : 'black'
          }}
        >
          <div className="text-xl">+</div>
          {hoveredProject && (
            <div className="text-sm">{hoveredProject.name}</div>
          )}
        </div>

        {/* Cursor Trail */}
        {cursorTrail.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = cursorTrail[index - 1];
          const dx = point.x - prevPoint.x;
          const dy = point.y - prevPoint.y;
          const length = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;

          return (
            <div
              key={`${point.x}-${point.y}-${point.time}`}
              className="absolute w-px bg-gray-600 z-5"
              style={{
                width: `${length}px`,
                height: '1px',
                left: `${prevPoint.x}px`,
                top: `${prevPoint.y}px`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'top left'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Portfolio;