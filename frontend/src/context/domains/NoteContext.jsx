import { createContext, useContext, useCallback } from 'react';

const NoteContext = createContext(null);
export const useNoteContext = () => { const c = useContext(NoteContext); if (!c) throw new Error('useNoteContext must be within NoteProvider'); return c; };

export function NoteProvider({ data, setData, children }) {
  const notes = data?.notes || [];

  const addNote = useCallback((note) => {
    setData(prev => ({ ...prev, notes: [...(prev.notes || []), note] }));
  }, [setData]);

  const updateNote = useCallback((noteId, updates) => {
    setData(prev => ({ ...prev, notes: (prev.notes || []).map(n => n._id === noteId ? { ...n, ...updates } : n) }));
  }, [setData]);

  const removeNote = useCallback((noteId) => {
    setData(prev => ({ ...prev, notes: (prev.notes || []).filter(n => n._id !== noteId) }));
  }, [setData]);

  return (
    <NoteContext.Provider value={{ notes, addNote, updateNote, removeNote }}>
      {children}
    </NoteContext.Provider>
  );
}