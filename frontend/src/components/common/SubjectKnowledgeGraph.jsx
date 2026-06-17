import { useState, useRef, useEffect } from 'react';

const SUBJECTS = [
  { name: 'Engineering Mathematics', color: '#8B5CF6', z: 50 },
  { name: 'Data Structures', color: '#06B6D4', z: 100 },
  { name: 'Algorithms', color: '#F59E0B', z: 80 },
  { name: 'Operating Systems', color: '#F472B6', z: 120 },
  { name: 'DBMS', color: '#22D3EE', z: 90 },
  { name: 'Computer Networks', color: '#6366F1', z: 110 },
  { name: 'Theory of Computation', color: '#A78BFA', z: 70 },
  { name: 'Compiler Design', color: '#FBBF24', z: 60 },
];

function SubjectNode({ subject, isActive, onHover, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover && onHover(subject.name);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover && onHover(null);
  };

  const handleClick = () => {
    onClick && onClick(subject.name);
  };

  return (
    <div
      ref={nodeRef}
      className="absolute cursor-pointer"
      style={{
        transform: `translateZ(${subject.z}px)`,
        left: '50%',
        bottom: '20%',
        width: isHovered ? '80px' : '60px',
        height: isHovered ? '80px' : '60px',
        marginLeft: `-${isHovered ? 40 : 30}px`,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isHovered ? 100 : 10,
        filter: isHovered ? 'drop-shadow(0 0 20px rgba(255,255,255,0.4))' : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className="w-full h-full rounded-full backdrop-blur-sm border transition-all duration-300"
        style={{
          background: isHovered
            ? `${subject.color}30`
            : `${subject.color}10`,
          border: isHovered
            ? `2px solid ${subject.color}`
            : `1px solid ${subject.color}50`,
          boxShadow: isHovered
            ? `0 0 30px ${subject.color}60, inset 0 0 20px ${subject.color}20`
            : `0 0 10px ${subject.color}30, inset 0 0 10px ${subject.color}10`,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <div className="w-full h-full rounded-full flex items-center justify-center">
          <div className="text-[10px] font-bold" style={{ color: subject.color }}>
            {subject.name}
          </div>
        </div>
      </div>

      {/* Knowledge pulse indicator */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: `${subject.color}40`,
            animationDuration: '2s',
          }}
        />
      )}
    </div>
  );
}

function SubjectKnowledgeGraph({ activeSubject, onSubjectHover, onSubjectClick }) {
  const containerRef = useRef(null);

  const getSubjectPosition = (index) => {
    const angle = (index * (360 / SUBJECTS.length)) - 90;
    const radius = 150;
    const x = 50 + Math.cos(angle * Math.PI / 180) * radius;
    const y = 50 + Math.sin(angle * Math.PI / 180) * radius;
    return {
      x,
      y,
      angle,
    };
  };

  const brainPosition = { x: 50, y: 45 };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {SUBJECTS.map((subject, index) => {
        const pos = getSubjectPosition(index);

        return (
          <SubjectNode
            key={subject.name}
            subject={subject}
            isActive={activeSubject === subject.name}
            onHover={onSubjectHover}
            onClick={onSubjectClick}
          />
        );
      })}
    </div>
  );
}

export default SubjectKnowledgeGraph;