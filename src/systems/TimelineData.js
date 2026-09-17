/**
 * TimelineData.js
 * Declarative timeline configuration for The Final Aarti.
 * Defines all scheduled events between 05:55 PM and 06:30 PM.
 */
export const TIMELINE_EVENTS = [
  {
    id: 'evt_start',
    hour: 17,
    minute: 55,
    title: 'Pandal Doors Open',
    category: 'Festival',
    description: 'Volunteers and organizers make preliminary arrangements before the evening crowd gathers.',
    actionType: 'NOTIFICATION'
  },
  {
    id: 'evt_devotees_arrive',
    hour: 18,
    minute: 0,
    title: 'Devotees Begin Arriving',
    category: 'Community',
    description: 'Devotees and families begin entering through the welcome gate for evening darshan.',
    actionType: 'DEVOTEES_ARRIVE'
  },
  {
    id: 'evt_electrician_stage',
    hour: 18,
    minute: 5,
    title: 'Electrician Moves to Stage',
    category: 'Logistics',
    description: 'Ramesh walks to the stage console to test the PA system and sound mixer.',
    actionType: 'MOVE_NPC',
    targetNpc: 'electrician'
  },
  {
    id: 'evt_rain_begins',
    hour: 18,
    minute: 8,
    title: 'Light Monsoon Rain Begins',
    category: 'Weather',
    description: 'Dark clouds gather and a cool drizzle begins falling over the pandal street.',
    actionType: 'START_RAIN'
  },
  {
    id: 'evt_electrician_leaves',
    hour: 18,
    minute: 10,
    title: 'Electrician Leaves for Tea',
    category: 'Logistics',
    description: 'Ramesh leaves the stage and walks to the tea stall for cutting chai.',
    actionType: 'MOVE_NPC',
    targetNpc: 'electrician'
  },
  {
    id: 'evt_PRASADM_starts',
    hour: 18,
    minute: 15,
    title: 'PRASADM Distribution Begins',
    category: 'Ritual',
    description: 'Bawarchi Mohan places 108 freshly steamed modaks at the counter.',
    actionType: 'PRASADM_BEGINS'
  },
  {
    id: 'evt_aarti_prep',
    hour: 18,
    minute: 25,
    title: 'Final Aarti Preparation',
    category: 'Ritual',
    description: 'Panditji inspects the altar; temple bells chime and devotees assemble.',
    actionType: 'AARTI_PREP'
  },
  {
    id: 'evt_aarti_begins',
    hour: 18,
    minute: 30,
    title: 'Grand Aarti Begins',
    category: 'Culmination',
    description: 'The auspicious hour of 6:30 PM arrives. The Grand Aarti is called!',
    actionType: 'AARTI_START'
  }
];
