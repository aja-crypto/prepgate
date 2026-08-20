import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuthData } from './AuthContext';

const PROFILE_KEY = 'gatenexa_ai_profile';

const DEFAULT_PROFILE = {
  onboardingCompleted: false,
  gateExamYear: 2027,
  firstAttempt: true,
  previousGateScore: null,
  dailyStudyHours: 4,
  completedSubjects: [],
  weakestSubject: '',
  strongestSubject: '',
  targetAIR: null,
  dreamCollege: '',
  confidenceLevel: 5,
  preparationStage: 'beginner',
  currentSubject: '',
  currentTopic: '',
  dailyGoals: [],
  createdAt: null,
  updatedAt: null,
};

const DEFAULT_AI_STATE = {
  engineState: null,
  unifiedState: null,
  recommendations: [],
  roadmap: null,
  notifications: [],
};

const AiMentorContext = createContext(null);

export function useAiMentor() {
  const ctx = useContext(AiMentorContext);
  if (!ctx) throw new Error('useAiMentor must be within AiMentorProvider');
  return ctx;
}

function loadProfile(userId) {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${userId}`);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PROFILE };
}

function saveProfile(userId, profile) {
  try {
    localStorage.setItem(`${PROFILE_KEY}_${userId}`, JSON.stringify(profile));
  } catch {}
}

export function AiMentorProvider({ children }) {
  const { user } = useAuthData();
  const userId = user?.id || user?._id || 'guest';
  const [profile, setProfileState] = useState(() => loadProfile(userId));
  const [aiState, setAiState] = useState(DEFAULT_AI_STATE);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    setProfileState(loadProfile(userId));
  }, [userId]);

  useEffect(() => {
    saveProfile(userId, profile);
  }, [userId, profile]);

  const updateProfile = useCallback((updates) => {
    setProfileState(prev => {
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setProfileState(prev => ({
      ...prev,
      onboardingCompleted: true,
      createdAt: prev.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setProfileState({ ...DEFAULT_PROFILE, createdAt: new Date().toISOString() });
  }, []);

  const setUnifiedAiState = useCallback((orchestratorState) => {
    setAiState({
      engineState: orchestratorState.engineState,
      unifiedState: orchestratorState.unifiedState,
      recommendations: orchestratorState.recommendations,
      roadmap: orchestratorState.roadmap,
      notifications: orchestratorState.notifications,
    });
  }, []);

  const value = {
    profile,
    updateProfile,
    completeOnboarding,
    resetOnboarding,
    unifiedState: aiState.unifiedState,
    recommendations: aiState.recommendations,
    roadmap: aiState.roadmap,
    notifications: aiState.notifications,
    engineState: aiState.engineState,
    setUnifiedAiState,
  };

  return (
    <AiMentorContext.Provider value={value}>
      {children}
    </AiMentorContext.Provider>
  );
}
