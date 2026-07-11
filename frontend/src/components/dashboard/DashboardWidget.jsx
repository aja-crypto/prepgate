// Draggable dashboard widget wrapper
import { memo, useCallback } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Icon from '../ui/Icon';

function DashboardWidget({ id, children, className = '', span = '' }) {
  const { editMode, dragId, setDragId, reorderWidgets } = useDashboard();

  const handleDragStart = useCallback((e) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, [id, setDragId]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    if (fromId) reorderWidgets(fromId, id);
    setDragId(null);
  }, [id, reorderWidgets, setDragId]);

  const handleDragEnd = useCallback(() => setDragId(null), [setDragId]);

  return (
    <div
      draggable={editMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`relative transition-all duration-200 ${span} ${className} ${
        editMode ? 'cursor-grab active:cursor-grabbing' : ''
      } ${dragId === id ? 'opacity-50 scale-[0.98]' : ''} ${
        editMode ? 'ring-1 ring-dashed ring-primary/30 rounded-2xl' : ''
      }`}
    >
      {editMode && (
        <div className="absolute -top-2 left-3 z-10 flex items-center gap-1.5 bg-primary text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg">
          <Icon name="drag" />
          Drag to reorder
        </div>
      )}
      {children}
    </div>
  );
}

export default memo(DashboardWidget);
