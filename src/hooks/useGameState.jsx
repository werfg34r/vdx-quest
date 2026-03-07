import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import weeksData from '../data/weeks.json'

const GameContext = createContext(null)

const STORAGE_KEY = 'vdx_quest_state'

function getDefaultState() {
  return {
    totalXp: 0,
    currentWeek: 1,
    avatarStage: 0,
    stats: { clarte: 0, courage: 0, terrain: 0, structure: 0 },
    questProgress: {},
    reflections: {},
    weekProgress: { 1: { unlocked: true, completed: false } },
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function computeAvatarStage(xp) {
  if (xp >= 4000) return 4
  if (xp >= 2500) return 3
  if (xp >= 1200) return 2
  if (xp >= 400) return 1
  return 0
}

export function GameProvider({ children, userId }) {
  const [state, setState] = useState(getDefaultState)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && supabase) {
      loadFromSupabase(userId).then(s => {
        setState(s || getDefaultState())
        setLoading(false)
      })
    } else {
      const local = loadLocal()
      if (local) setState(local)
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!loading) saveLocal(state)
  }, [state, loading])

  async function loadFromSupabase(uid) {
    try {
      const [profileRes, statsRes, questsRes, reflRes, weeksRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('user_stats').select('*').eq('user_id', uid).single(),
        supabase.from('quest_progress').select('*').eq('user_id', uid),
        supabase.from('reflections').select('*').eq('user_id', uid),
        supabase.from('week_progress').select('*').eq('user_id', uid),
      ])

      const profile = profileRes.data
      const stats = statsRes.data
      if (!profile || !stats) return null

      const questProgress = {}
      for (const q of (questsRes.data || [])) {
        questProgress[q.quest_id] = q.completed
      }

      const reflections = {}
      for (const r of (reflRes.data || [])) {
        reflections[r.reflection_id] = r.answer || ''
      }

      const weekProgress = {}
      for (const w of (weeksRes.data || [])) {
        weekProgress[w.week_id] = { unlocked: w.unlocked, completed: w.completed }
      }

      return {
        totalXp: profile.total_xp || 0,
        currentWeek: profile.current_week || 1,
        avatarStage: profile.avatar_stage || 0,
        stats: {
          clarte: stats.clarte || 0,
          courage: stats.courage || 0,
          terrain: stats.terrain || 0,
          structure: stats.structure || 0,
        },
        questProgress,
        reflections,
        weekProgress,
      }
    } catch {
      return null
    }
  }

  const toggleQuest = useCallback((questId, weekId) => {
    setState(prev => {
      const wasCompleted = prev.questProgress[questId]
      const quest = weeksData.flatMap(w => w.quests).find(q => q.id === questId)
      if (!quest) return prev

      const newQuestProgress = { ...prev.questProgress, [questId]: !wasCompleted }
      const xpDelta = wasCompleted ? -quest.xp : quest.xp
      const newTotalXp = Math.max(0, prev.totalXp + xpDelta)

      const week = weeksData.find(w => w.id === weekId)
      const allQuestsComplete = week
        ? week.quests.every(q => newQuestProgress[q.id])
        : false

      const newWeekProgress = { ...prev.weekProgress }
      newWeekProgress[weekId] = {
        ...newWeekProgress[weekId],
        unlocked: true,
        completed: allQuestsComplete,
      }

      let newStats = { ...prev.stats }
      if (allQuestsComplete && !prev.weekProgress[weekId]?.completed && week) {
        newStats = {
          clarte: newStats.clarte + (week.statsReward.clarte || 0),
          courage: newStats.courage + (week.statsReward.courage || 0),
          terrain: newStats.terrain + (week.statsReward.terrain || 0),
          structure: newStats.structure + (week.statsReward.structure || 0),
        }
        const nextWeek = weekId + 1
        if (nextWeek <= 12) {
          newWeekProgress[nextWeek] = { unlocked: true, completed: false }
        }
      }

      if (!allQuestsComplete && prev.weekProgress[weekId]?.completed && week) {
        newStats = {
          clarte: Math.max(0, newStats.clarte - (week.statsReward.clarte || 0)),
          courage: Math.max(0, newStats.courage - (week.statsReward.courage || 0)),
          terrain: Math.max(0, newStats.terrain - (week.statsReward.terrain || 0)),
          structure: Math.max(0, newStats.structure - (week.statsReward.structure || 0)),
        }
      }

      const newState = {
        ...prev,
        totalXp: newTotalXp,
        avatarStage: computeAvatarStage(newTotalXp),
        questProgress: newQuestProgress,
        weekProgress: newWeekProgress,
        stats: newStats,
      }

      if (userId && supabase) {
        syncToSupabase(userId, questId, weekId, !wasCompleted, newState)
      }

      return newState
    })
  }, [userId])

  const saveReflection = useCallback((reflectionId, weekId, answer) => {
    setState(prev => {
      const newReflections = { ...prev.reflections, [reflectionId]: answer }
      const newState = { ...prev, reflections: newReflections }

      if (userId && supabase) {
        supabase.from('reflections').upsert({
          user_id: userId,
          reflection_id: reflectionId,
          week_id: weekId,
          answer,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,reflection_id' })
      }

      return newState
    })
  }, [userId])

  const selectWeek = useCallback((weekId) => {
    setState(prev => ({ ...prev, currentWeek: weekId }))
  }, [])

  async function syncToSupabase(uid, questId, weekId, completed, newState) {
    try {
      await Promise.all([
        supabase.from('quest_progress').upsert({
          user_id: uid,
          quest_id: questId,
          week_id: weekId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,quest_id' }),
        supabase.from('profiles').update({
          total_xp: newState.totalXp,
          avatar_stage: newState.avatarStage,
          current_week: newState.currentWeek,
          updated_at: new Date().toISOString(),
        }).eq('id', uid),
        supabase.from('user_stats').update({
          clarte: newState.stats.clarte,
          courage: newState.stats.courage,
          terrain: newState.stats.terrain,
          structure: newState.stats.structure,
          updated_at: new Date().toISOString(),
        }).eq('user_id', uid),
        supabase.from('week_progress').upsert({
          user_id: uid,
          week_id: weekId,
          unlocked: true,
          completed: newState.weekProgress[weekId]?.completed || false,
          completed_at: newState.weekProgress[weekId]?.completed ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,week_id' }),
      ])
    } catch (e) {
      console.error('Sync error:', e)
    }
  }

  return (
    <GameContext.Provider value={{
      ...state,
      weeks: weeksData,
      loading,
      toggleQuest,
      saveReflection,
      selectWeek,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameState must be inside GameProvider')
  return ctx
}
