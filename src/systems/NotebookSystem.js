/**
 * NotebookSystem.js
 * Comprehensive persistent knowledge ledger with 6 distinct festival sections:
 * People, Places, Objects, Events, Clues, and Solved Mysteries.
 *
 * Rules:
 * - Persistent between loops.
 * - Automatically records genuinely discovered information upon interaction or observation.
 * - Undiscovered clues remain hidden.
 * - Does not reveal puzzle solutions automatically.
 */
export class NotebookSystem {
  constructor(audioManager = null) {
    this.loopCount = 1;
    this.activeTab = 'clues'; // Default opened tab: 'people' | 'places' | 'objects' | 'events' | 'clues' | 'solved'
    this.isOpen = false;
    this.audioManager = audioManager;
    this.newDiscoveryToast = null;
    this.toastTimer = 0;

    this.sections = {
      people: [
        {
          id: 'electrician',
          title: 'Ramesh (Electrician)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Responsible for power lines and generator maintenance. Keeps tools in Sharma\'s cabinet.',
          notes: []
        },
        {
          id: 'cook',
          title: 'Bawarchi Mohan (Cook)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Prepares 108 ukadiche modaks for Lord Ganesha. Stressed about ingredient timing.',
          notes: []
        },
        {
          id: 'flower_seller',
          title: 'Radha (Flower Vendor)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Weaves fresh marigolds and rose garlands. Chatty and observant of all pandal visitors.',
          notes: []
        },
        {
          id: 'organizer',
          title: 'Uncle Sharma (Organizer)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Pandal committee treasurer. Meticulous about timing, but prone to misplacing keys.',
          notes: []
        },
        {
          id: 'child',
          title: 'Chintu (Curious Kid)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Hyperactive neighborhood kid with a paper pinwheel who wanders near cables and sweets.',
          notes: []
        },
        {
          id: 'elder',
          title: 'Dada Ramakant (Elder Devotee)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Wise senior devotee offering prayers and observing the harmony of the festival.',
          notes: []
        },
        {
          id: 'volunteer',
          title: 'Priya (Volunteer Lead)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Coordinates devotee queues and prepares brass deepstambh lamps for the altar.',
          notes: []
        },
        {
          id: 'musician',
          title: 'Sundar (Dholak Musician)',
          category: 'People',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Plays the festival drums and conch. Relies on the PA system to reach the back rows.',
          notes: []
        }
      ],

      places: [
        {
          id: 'electrical_area',
          title: 'West Wing Electrical Zone',
          category: 'Places',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Low-lying ground behind the stalls housing the 50 KVA diesel generator and conduit pipes.',
          notes: []
        },
        {
          id: 'mandap_altar',
          title: 'Grand Mandap & Altar',
          category: 'Places',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Elevated central pavilion where the 8-foot clay Shri Ganesh idol and deepstambh rest.',
          notes: []
        },
        {
          id: 'PRASADM_counter',
          title: 'MahaPRASADM Counter',
          category: 'Places',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Tiered counter in the eastern plaza displaying modak thalis and naivedya boxes.',
          notes: []
        },
        {
          id: 'flower_stall',
          title: 'Radha Florists Stall',
          category: 'Places',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Corner shop filled with fragrant marigold crates, rose baskets, and durva bundles.',
          notes: []
        },
        {
          id: 'welcome_gate',
          title: 'Grand Welcome Archway',
          category: 'Places',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Main pedestrian entrance draped in torans. Devotee crowd swells here after 6:00 PM.',
          notes: []
        }
      ],

      objects: [
        {
          id: 'damaged_cable',
          title: 'Damaged 415V Power Cable',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Heavy three-phase line with cracked rubber insulation and exposed copper strands.',
          notes: []
        },
        {
          id: 'generator',
          title: '50 KVA Diesel Generator',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Powers the entire pandal. Has a sensitive manual circuit breaker and fuel line.',
          notes: []
        },
        {
          id: 'sound_mixer',
          title: '24-Channel Audio Console',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Mixer board driving stage microphones, conch amplification, and loudspeakers.',
          notes: []
        },
        {
          id: 'notice_board',
          title: 'Schedule Notice Board',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Displays the official evening timeline leading up to the 6:30 PM Grand Aarti.',
          notes: []
        },
        {
          id: 'deepstambh',
          title: 'Brass Deepstambh Lamps',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Ceremonial oil lamps flanking the altar. Must remain continuously burning.',
          notes: []
        },
        {
          id: 'storage_key',
          title: 'Uncle Sharma\'s Brass Storage Key',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Antique stamped brass key lost near the flower stall. Unlocks the backstage committee supply cabinet.',
          notes: []
        },
        {
          id: 'storage_cabinet',
          title: 'Committee Supply Locker',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Heavy steel cabinet backstage containing spare power cables, waterproof tarpaulins, and pantry cooking ingredients.',
          notes: []
        },
        {
          id: 'entrance_obstruction',
          title: 'Unattended Cargo Crates',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Stack of heavy wooden crates blocking the eastern queue bypass route near the entrance.',
          notes: []
        },
        {
          id: 'mandap_garland_rack',
          title: 'Mandap Ceremonial Garland Arch',
          category: 'Objects',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Grand entrance archway before Shri Ganesh altar, awaiting the 11-foot royal marigold garland.',
          notes: []
        }
      ],

      events: [
        {
          id: 'devotees_arrive',
          title: '6:00 PM - Devotees Arrive',
          category: 'Events',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Families and devotees start streaming in through the entrance gate for evening darshan.',
          notes: []
        },
        {
          id: 'electrician_stage',
          title: '6:05 PM - Electrician to Stage',
          category: 'Events',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Ramesh moves to the audio console to test stage microphones and equalizers.',
          notes: []
        },
        {
          id: 'rain_starts',
          title: '6:08 PM - Monsoon Rain Begins',
          category: 'Events',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Cool monsoon drizzle begins falling, wetting walkways and forming ground puddles.',
          notes: []
        },
        {
          id: 'electrician_tea',
          title: '6:10 PM - Electrician Leaves for Tea',
          category: 'Events',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Ramesh walks away from the stage and electrical area to drink cutting chai.',
          notes: []
        },
        {
          id: 'PRASADM_starts',
          title: '6:15 PM - PRASADM Distribution',
          category: 'Events',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Mohan sets out fresh modak thalis at the counter for incoming devotees.',
          notes: []
        }
      ],

      clues: [
        {
          id: 'clue_cable_damaged',
          title: 'The Electrical Cable is Damaged',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'The main cable near the generator has cracked insulation and exposed copper sitting in a low mud ditch.',
          notes: []
        },
        {
          id: 'clue_rain_time',
          title: 'Rain Begins Around 6:08 PM',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Monsoon showers consistently arrive at 6:08 PM, pouring water directly into low ground areas.',
          notes: []
        },
        {
          id: 'clue_electrician_leaves',
          title: 'Electrician Leaves at 6:10 PM',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Ramesh leaves his station unattended for tea at 6:10 PM, right after the rain starts.',
          notes: []
        },
        {
          id: 'clue_cook_coconut',
          title: 'The Cook Needs Coconut Before 6:10 PM',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Mohan mentions he needs fresh grated coconut before 6:10 PM to complete the 108 modak naivedya.',
          notes: []
        },
        {
          id: 'clue_side_entrance',
          title: 'The Entrance Becomes Crowded After 6:05 PM',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Devotee queues build up rapidly at the entrance gate between 6:00 PM and 6:05 PM.',
          notes: []
        },
        {
          id: 'clue_sharma_keys',
          title: 'Storage Keys Dropped Near Flowers',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Uncle Sharma dropped the brass key to the backup cabinet somewhere around Radha\'s flower stall.',
          notes: []
        },
        {
          id: 'clue_obstruction_route',
          title: 'Entrance Queue Detour is Blocked',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Crates at the eastern walkway force incoming crowds into the central mandap aisle, causing dangerous congestion.',
          notes: []
        },
        {
          id: 'clue_replacement_cable',
          title: 'Replacement Cable & Tarp in Cabinet',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'The committee cabinet holds heavy 415V cable and waterproof tarp to shield the generator conduit before the rain.',
          notes: []
        },
        {
          id: 'clue_coconut_storage',
          title: 'Fresh Coconut Stored in Backstage Cabinet',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Fresh grated coconut bowls are kept inside the locked supply locker, ready for Mohan\'s modak preparation.',
          notes: []
        },
        {
          id: 'clue_marigold_garland',
          title: 'Radha Prepared 11-ft Royal Garland',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'An 11-foot marigold and red rose garland is ready at Radha\'s stall, waiting to be hung on the Mandap arch.',
          notes: []
        },
        {
          id: 'clue_elder_assisted',
          title: 'Elder Devotee Needs Assistance to Altar',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Dada Ramakant needs a helping hand to reach the velvet front prayer carpets safely before Aarti starts.',
          notes: []
        },
        {
          id: 'clue_deepstambh_lit',
          title: 'Deepstambh Lamps Must Be Lit with Camphor',
          category: 'Clues',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Both ceremonial brass deepstambh flanking Ganesha\'s throne must be lit with the sacred flame before 6:30 PM.',
          notes: []
        }
      ],

      solved: [
        {
          id: 'solved_crowd',
          title: 'Entrance Queue Route Cleared',
          category: 'Solved Mysteries',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Cargo crates were pushed off the eastern detour walkway before 6:00 PM. Incoming devotees queued peacefully without bottlenecking.',
          notes: []
        },
        {
          id: 'solved_blackout',
          title: 'Electrical System Shielded & Protected',
          category: 'Solved Mysteries',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Provided replacement cable and waterproof tarpaulin to Ramesh before 6:08 PM rain. Prevented short circuit and maintained unbroken power.',
          notes: []
        },
        {
          id: 'solved_modak',
          title: '108 Ukadiche Modaks Steamed on Time',
          category: 'Solved Mysteries',
          unlocked: false,
          discoveryLoop: 0,
          description: 'Retrieved fresh coconut from the supply cabinet and delivered it to Bawarchi Mohan before 6:10 PM. Consecrated PRASADM was ready for all devotees.',
          notes: []
        },
        {
          id: 'solved_readiness',
          title: '100% Festival Readiness Achieved',
          category: 'Solved Mysteries',
          unlocked: false,
          discoveryLoop: 0,
          description: 'All 6 critical festival preparations completed in harmony: Power, Modaks, Crowd, Garland Arch, Elder Devotees, and Deepstambh Lamps!',
          notes: []
        }
      ]
    };
  }

  setAudioManager(audioManager) {
    this.audioManager = audioManager;
  }

  unlock(sectionName, entryId, note = null) {
    const list = this.sections[sectionName];
    if (!list) return false;

    const entry = list.find(item => item.id === entryId);
    if (!entry) return false;

    let isNew = false;
    if (!entry.unlocked) {
      entry.unlocked = true;
      entry.discoveryLoop = this.loopCount;
      isNew = true;

      this.newDiscoveryToast = `📖 Notebook: "${entry.title}"`;
      this.toastTimer = 4.0;
      if (this.audioManager) {
        this.audioManager.playClueDiscovered();
      }
      console.log(`[Notebook] Logged discovery: [${sectionName}] ${entry.title} (Loop #${this.loopCount})`);
    }

    if (note && !entry.notes.includes(note)) {
      entry.notes.push(note);
    }

    return isNew;
  }

  isUnlocked(sectionName, entryId) {
    const list = this.sections[sectionName];
    if (!list) return false;
    const entry = list.find(item => item.id === entryId);
    return entry ? entry.unlocked : false;
  }

  getSectionEntries(sectionName) {
    return this.sections[sectionName] || [];
  }

  getStats() {
    let total = 0;
    let unlocked = 0;
    const keys = Object.keys(this.sections);
    for (let k = 0; k < keys.length; k++) {
      const list = this.sections[keys[k]];
      total += list.length;
      unlocked += list.filter(item => item.unlocked).length;
    }
    return { total, unlocked };
  }

  incrementLoop() {
    this.loopCount++;
    console.log(`[Notebook] Advanced to Loop #${this.loopCount}. Preserving all discovered entries.`);
  }

  update(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.newDiscoveryToast = null;
      }
    }
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    return this.isOpen;
  }
}
