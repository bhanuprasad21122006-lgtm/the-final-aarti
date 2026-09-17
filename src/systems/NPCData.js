/**
 * NPCData.js
 * Declarative configuration for the 8 festival NPCs:
 * Roles, personalities, time-driven schedules, and context-sensitive dialogues.
 */

export const NPCS_CONFIG = [
  // 1. Electrician
  {
    id: 'electrician',
    name: 'Ramesh',
    role: 'Festival Electrician',
    personality: 'Practical and busy',
    color: '#0284c7',
    skin: '#d97736',
    initialPos: { x: 230, y: 290 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 230, y: 290 },
        activity: 'Inspecting diesel generator',
        status: 'Checking backup power valve and wiring.'
      },
      {
        time: '18:05',
        hour: 18,
        minute: 5,
        targetPos: { x: 440, y: 280 },
        activity: 'Checking Stage Audio Console',
        status: 'Testing microphones and equalizer board.'
      },
      {
        time: '18:10',
        hour: 18,
        minute: 10,
        targetPos: { x: 310, y: 640 },
        activity: 'Grabbing Cutting Chai near stall',
        status: 'Taking a quick tea break before the evening crowd.'
      }
    ],
    dialogue: {
      default: [
        "Aarav! Keep an eye on those heavy power cables near the generator. The rubber insulation is severely cracked from last year's use!",
        "If rainwater pools into that depression, a 415V short circuit will blow the generator! Uncle Sharma keeps a spare heavy cable and waterproof tarp locked in the backstage storage cabinet. Bring it to me before it rains!"
      ],
      stage: [
        "Testing the amplifier... sound is crisp, but keep any water or rain away from the cables!",
        "I'm heading for tea. Remember: if the line trips, the entire pandal goes black."
      ],
      tea: [
        "Ah, ginger tea gives life. Ramesh takes five minutes, then I'll re-check the generator."
      ],
      fixed: [
        "Aarav, excellent work! The fresh three-phase cable is hooked up and the tarpaulin is staked down tight. Even a heavy monsoon shower cannot touch our power now!"
      ],
      blackout: [
        "AARAV! The main 415V line tripped! Rainwater seeped right into that cracked cable by the generator!",
        "The whole breaker is blown! We had no replacement cable in place! The Aarti cannot happen like this!"
      ]
    }
  },

  // 2. Modak / PRASADM Cook
  {
    id: 'cook',
    name: 'Bawarchi Mohan',
    role: 'Modak & PRASADM Cook',
    personality: 'Friendly but stressed',
    color: '#f8fafc',
    skin: '#ca8a04',
    initialPos: { x: 1300, y: 480 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 1300, y: 480 },
        activity: 'Steaming ukadiche modaks in kitchen tent',
        status: 'Preparing fresh coconut and jaggery filling.'
      },
      {
        time: '18:10',
        hour: 18,
        minute: 10,
        targetPos: { x: 1250, y: 650 },
        activity: 'Arranging brass thalis at PRASADM Counter',
        status: 'Setting out the 108 sacred modaks.'
      },
      {
        time: '18:25',
        hour: 18,
        minute: 25,
        targetPos: { x: 880, y: 230 },
        activity: 'Presenting Naivedya to Panditji at Mandap',
        status: 'Delivering the consecrated offering to the altar.'
      }
    ],
    dialogue: {
      default: [
        "Namaste Aarav! Oh dear... catastrophe! I just checked my kitchen crates, and we have NO FRESH GRATED COCONUT left!",
        "Without fresh coconut, I cannot steam the 108 Ukadiche Modaks! Uncle Sharma locked extra coconuts inside the committee storage cabinet backstage. I need fresh coconut before 6:10 PM, or there will be no PRASADM for devotees!"
      ],
      counter: [
        "Aarav, please check with Uncle Sharma for the storage key! I need coconut before 6:10 PM!",
        "The crowd will be furious if PRASADM isn't ready at 6:15 PM!"
      ],
      fixed: [
        "Aarav! The modaks are steaming to divine perfection! The fragrance of jaggery, cardamom, and fresh coconut fills the air. All 108 will be served on time!"
      ],
      mandap: [
        "Panditji was pleased with the aroma of the naivedya! Lord Ganesha shall bless us all."
      ],
      blackout: [
        "The lights suddenly died! I can't even see the modak trays in this darkness!",
        "Without stage lights, how will the priest conduct the sacred worship?"
      ]
    }
  },

  // 3. Flower Vendor
  {
    id: 'flower_seller',
    name: 'Radha',
    role: 'Flower Vendor',
    personality: 'Talkative and cheerful',
    color: '#ec4899',
    skin: '#d97736',
    initialPos: { x: 260, y: 660 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 260, y: 660 },
        activity: 'Stringing marigold garlands at stall',
        status: 'Weaving fresh genda phool and rose petals.'
      },
      {
        time: '18:12',
        hour: 18,
        minute: 12,
        targetPos: { x: 690, y: 880 },
        activity: 'Greeting devotees at the Welcome Gate',
        status: 'Handing out fragrant jasmines to arriving families.'
      },
      {
        time: '18:30',
        hour: 18,
        minute: 30,
        targetPos: { x: 740, y: 220 },
        activity: 'Draping the Grand Aarti Garland on Shri Ganesh',
        status: 'Adorning the deity with an 11-foot garland.'
      }
    ],
    dialogue: {
      default: [
        "Aarav beta! Look at this magnificent 11-foot royal garland woven from fresh Nagpur marigolds and red roses! I have placed it on the preparation stand.",
        "Could you help take it to the Mandap entrance archway and hang it up? It will complete our festival decorations for the evening!"
      ],
      entrance: [
        "Welcome devotees! Take fresh flowers for Lord Vighnaharta's blessings!",
        "The rain is starting to fall! Everyone, step under the canopy!"
      ],
      decorated: [
        "Aarav! Look how radiant the Mandap looks with the royal marigold arch draped! The entire courtyard smells of fresh flowers and devotion!"
      ],
      altar: [
        "Look how radiant Bappa looks wearing this royal garland! Pure joy!"
      ],
      blackout: [
        "Ai ga! All the pretty fairy lights went dark at once!",
        "Someone said sparks flew from the generator area when the rain started!"
      ]
    }
  },

  // 4. Festival Organizer
  {
    id: 'organizer',
    name: 'Uncle Sharma',
    role: 'Festival Committee Head',
    personality: 'Responsible and meticulous',
    color: '#854d0e',
    skin: '#d97736',
    initialPos: { x: 800, y: 720 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 800, y: 720 },
        activity: 'Reviewing evening timetable on Notice Board',
        status: 'Cross-checking volunteer duties and Aarti schedule.'
      },
      {
        time: '18:08',
        hour: 18,
        minute: 8,
        targetPos: { x: 330, y: 660 },
        activity: 'Checking flower bill with Radha',
        status: 'Inspecting garland delivery.'
      },
      {
        time: '18:22',
        hour: 18,
        minute: 22,
        targetPos: { x: 670, y: 180 },
        activity: 'Consulting with Panditji at the Mandap Altar',
        status: 'Confirming timing for the 6:30 PM Final Aarti.'
      }
    ],
    dialogue: {
      default: [
        "Aarav, I have a terrible headache! I was checking the flower delivery near Radha's stall and I must have dropped the brass key to the committee supply cabinet somewhere near her crates!",
        "The backup 415V power cable and Mohan's fresh cooking coconuts are locked inside that cabinet! If you see my brass key near the flower stall, pick it up!"
      ],
      flower_chat: [
        "Radha, did you see my brass key? I had it right here by your marigold crates earlier!",
        "Aarav, search around the flower crates! We need that key to access the spare supplies!"
      ],
      mandap: [
        "Panditji wants everything spotless before 6:30 PM: the sound system, lamps, and PRASADM."
      ],
      blackout: [
        "DISASTER! The entire pandal is in total darkness! The audio system is dead!",
        "Panditji cannot conduct the Aarti in pitch blackness! The festival has failed!"
      ]
    }
  },

  // 5. Elderly Devotee
  {
    id: 'elder',
    name: 'Dada Ramakant',
    role: 'Elderly Devotee',
    personality: 'Calm and wise',
    color: '#f1f5f9',
    skin: '#b45309',
    initialPos: { x: 810, y: 260 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 810, y: 260 },
        activity: 'Quiet meditation before Shri Ganesh',
        status: 'Chanting Atharvashirsha quietly.'
      },
      {
        time: '18:15',
        hour: 18,
        minute: 15,
        targetPos: { x: 550, y: 520 },
        activity: 'Resting on courtyard steps',
        status: 'Enjoying the evening festival ambiance.'
      },
      {
        time: '18:35',
        hour: 18,
        minute: 35,
        targetPos: { x: 670, y: 250 },
        activity: 'Lighting dhoop incense sticks at Left Deepstambh',
        status: 'Offering fragrant camphor and sandalwood.'
      }
    ],
    dialogue: {
      default: [
        "Om Gan Ganapataye Namaha... Aarav son, my knees are very weary this evening from walking to the temple.",
        "Could you gently guide me to the altar courtyard steps for evening darshan? Bless you for looking after an old devotee."
      ],
      helped: [
        "May Lord Ganesha shower you with wisdom and peace, Aarav beta! You have given an old man comfort and peace to witness the divine Aarti."
      ],
      resting: [
        "The gentle rain brings coolness to the soil. But listen closely... do you hear the generator humming?"
      ],
      incense: [
        "The holy smoke cleanses all negative thoughts before the Final Aarti commences."
      ],
      blackout: [
        "The music has ceased, and darkness envelops the pavilion. Truly, an ill omen has transpired.",
        "Only the earthen lamps remain alight now. The electrical grid has completely failed."
      ]
    }
  },

  // 6. Curious Child
  {
    id: 'child',
    name: 'Chintu',
    role: 'Curious Festival Kid',
    personality: 'Playful and hyperactive',
    color: '#10b981',
    skin: '#d97736',
    initialPos: { x: 740, y: 840 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 740, y: 840 },
        activity: 'Spinning paper pinwheel in the street',
        status: 'Running back and forth along the red carpet.'
      },
      {
        time: '18:07',
        hour: 18,
        minute: 7,
        targetPos: { x: 1200, y: 640 },
        activity: 'Eyeing modak trays at PRASADM Counter',
        status: 'Waiting for Mohan uncle to turn his back.'
      },
      {
        time: '18:18',
        hour: 18,
        minute: 18,
        targetPos: { x: 420, y: 290 },
        activity: 'Peeking behind the Sound Mixer table',
        status: 'Curious about the glowing flashing LED lights.'
      }
    ],
    dialogue: {
      default: [
        "Aarav bhaiya! Look how fast my pinwheel spins when I sprint down the carpet!",
        "When does the big drumming start? I want to dance during the Aarti!"
      ],
      sweets: [
        "Mohan uncle's modaks smell so sweet... I tried to take one tiny laddoo!",
        "The rain is coming! My pinwheel is getting wet!"
      ],
      sound_mixer: [
        "Whoa! Look at all these colored dials and switches! What happens if I pull this big blue lever?"
      ],
      blackout: [
        "WHOA! Bhaiya! Did you see that huge blue lightning spark over by the generator?!",
        "It went *BZZZZT-BANG* and then all the colored stage bulbs went completely dead!"
      ]
    }
  },

  // 7. Helpful Volunteer
  {
    id: 'volunteer',
    name: 'Priya',
    role: 'Volunteer Coordinator',
    personality: 'Helpful and organized',
    color: '#eab308',
    skin: '#d97736',
    initialPos: { x: 860, y: 310 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 860, y: 310 },
        activity: 'Polishing brass ritual vessels on Mandap',
        status: 'Wiping aarti thalis and bell stand.'
      },
      {
        time: '18:10',
        hour: 18,
        minute: 10,
        targetPos: { x: 850, y: 880 },
        activity: 'Distributing festival pamphlets at Welcome Gate',
        status: 'Guiding incoming devotees into organized queues.'
      },
      {
        time: '18:28',
        hour: 18,
        minute: 28,
        targetPos: { x: 620, y: 270 },
        activity: 'Checking Diya wicks at Deepstambh',
        status: 'Ensuring cotton wicks have pure sesame oil.'
      }
    ],
    dialogue: {
      default: [
        "Hi Aarav! Urgent issue: someone left heavy cargo crates right across the eastern queue detour by the entrance!",
        "When devotees arrive at 6:00 PM, they won't be able to bypass into the queue and will bottleneck through the narrow mandap aisle! Please push those crates out of the way before 6:00 PM!"
      ],
      gate: [
        "Devotees, please form a single queue for darshan! Family queues to the right."
      ],
      lamps: [
        "I just inspected the deepstambh. The cotton wicks are placed, but we need the stage lights on."
      ],
      cleared: [
        "Thank you Aarav! The entrance pathway is wide open now. Crowds are flowing through the barricades smoothly!"
      ],
      blackout: [
        "Aarav! The whole pandal has lost electricity! The microphones and floods are dead!",
        "The Aarti cannot commence in the dark! What caused this?!"
      ]
    }
  },

  // 8. Festival Musician
  {
    id: 'musician',
    name: 'Sundar',
    role: 'Festival Dholak Player',
    personality: 'Energetic and passionate',
    color: '#8b5cf6',
    skin: '#ca8a04',
    initialPos: { x: 920, y: 290 },
    schedule: [
      {
        time: '17:55',
        hour: 17,
        minute: 55,
        targetPos: { x: 920, y: 290 },
        activity: 'Tuning Dholak and brass cymbals (Manjira)',
        status: 'Tightening leather straps on the dholak drum.'
      },
      {
        time: '18:14',
        hour: 18,
        minute: 14,
        targetPos: { x: 780, y: 600 },
        activity: 'Playing welcoming traditional dhol beats in Street',
        status: 'Elevating festival spirits with festive rhythms.'
      },
      {
        time: '18:30',
        hour: 18,
        minute: 30,
        targetPos: { x: 940, y: 250 },
        activity: 'Taking position on Stage for Grand Aarti',
        status: 'Ready with Shankh (conch) and cymbals.'
      }
    ],
    dialogue: {
      default: [
        "*Dha-thin-thin-ta!* The dholak is tuned to perfection, Aarav!",
        "As long as the electrical amplifier works, our music will echo through the entire city!"
      ],
      street_beats: [
        "*Dhum-taka-dhum!* Feel that sacred energy, Aarav! Everyone is clapping along!"
      ],
      stage_ready: [
        "I'm at my station with the sacred conch. We blow the shankh the second Panditji begins!"
      ],
      blackout: [
        "The sound system just cut out mid-beat! The loudspeakers have zero power!",
        "Without the amplifier, nobody beyond the first row can hear the chants!"
      ]
    }
  }
];
