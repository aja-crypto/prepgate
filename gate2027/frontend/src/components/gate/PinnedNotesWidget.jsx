import React, { useState, useEffect } from 'react';
import { noteService } from '../../services/api';
import Icon from '../ui/Icon';
import GlassCard from '../ui/GlassCard';
import { formatDistanceToNow } from 'date-fns';

export default function PinnedNotesWidget() {
  const [pinned, setPinned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPinned = async () => {
      try {
        const res = await noteService.getAll({ pinned: true });
        setPinned(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPinned();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      <div className="h-32 bg-surface rounded-2xl border border-border" />
      <div className="h-32 bg-surface rounded-2xl border border-border" />
    </div>
  );

  if (pinned.length === 0) return (
    <GlassCard className="flex flex-col items-center justify-center py-8 text-text3">
      <Icon name="star" className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-xs font-medium">No pinned resources yet</p>
      <p className="text-[10px] mt-1">Pin important formulas or notes to see them here</p>
    </GlassCard>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pinned.map(note => (
        <GlassCard key={note._id} className="group relative overflow-hidden" padding="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon name={note.type === 'formula_sheet' ? 'star' : 'note'} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-text truncate">{note.title}</div>
              <div className="text-[10px] text-text3 uppercase font-black tracking-widest">{note.subject}</div>
            </div>
          </div>
          
          {note.fileUrl ? (
            <div className="w-full aspect-video rounded-lg bg-bg-3 border border-border overflow-hidden relative">
              {note.fileType?.includes('pdf') ? (
                <div className="flex flex-col items-center justify-center h-full text-text3">
                  <Icon name="note" className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[9px] font-black">PDF DOC</span>
                </div>
              ) : (
                <img src={note.fileUrl} alt={note.title} className="w-full h-full object-cover" />
              )}
              <a 
                href={note.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Icon name="search" className="text-white w-5 h-5" />
              </a>
            </div>
          ) : (
            <div className="text-[11px] text-text2 line-clamp-3 bg-bg-3 p-3 rounded-lg border border-border font-mono italic">
              {note.content}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
            <span className="text-[9px] text-text3 font-bold uppercase tracking-widest">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>
            <Icon name="arrow-right" className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
