export type BadgeKey =
  | 'first_steps'
  | 'perfectionist'
  | 'comeback'
  | 'completionist'
  | 'on_a_roll'
  | 'dedicated'
  | 'no_weak_spots'
  | 'early_bird'
  | 'ace_performer'

export const BADGE_DEFS: Record<BadgeKey, { name: string; description: string; emoji: string }> = {
  first_steps: { name: 'First Steps', description: 'Completed your first quiz', emoji: '🌱' },
  perfectionist: { name: 'Perfectionist', description: 'Scored 100% on a chapter', emoji: '💯' },
  comeback: { name: 'Comeback', description: 'Improved a retake score by 20+ points', emoji: '📈' },
  completionist: { name: 'Completionist', description: 'Attempted every published chapter', emoji: '🏆' },
  on_a_roll: { name: 'On a Roll', description: '3-day practice streak', emoji: '🔥' },
  dedicated: { name: 'Dedicated', description: '7-day practice streak', emoji: '🥇' },
  no_weak_spots: { name: 'No Weak Spots', description: 'Cleared every question in a weak-spots practice round', emoji: '🛡️' },
  early_bird: { name: 'Early Bird', description: 'Completed a chapter within 48 hours of it going live', emoji: '🐦' },
  ace_performer: { name: 'Ace Performer', description: 'Scored 90%+ on three different chapters', emoji: '🎯' },
}
