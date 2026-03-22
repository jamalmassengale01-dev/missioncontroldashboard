export const havenConfig = {
  id: 'haven',
  name: 'Haven',
  title: 'Personal Life Executive Assistant',
  description: 'Organizes and supports personal life, routines, family coordination, and life priorities.',
  scope: 'personal',
  priority: 'high',
  visibility: 'active',
  color: 'teal',
  icon: 'Home',
  status: 'idle',
  currentFocus: 'Ready to assist with personal life organization',
  lastActivity: new Date().toISOString(),
  capabilities: [
    'Daily planning',
    'Weekly planning',
    'Personal organization',
    'Habit tracking',
    'Family coordination',
    'Scheduling',
    'Health routines',
    'Education progress tracking',
    'Retirement preparation',
    'Reminders and checklists',
    'Travel preparation',
    'Stress reduction through structure'
  ],
  acceptedJobTypes: [
    'personal',
    'family',
    'health',
    'scheduling',
    'education',
    'travel',
    'routines',
    'life_admin'
  ],
  restrictions: [
    'No business building',
    'No trading',
    'No coding',
    'No automation design',
    'No software projects',
    'No business ideas'
  ]
};
