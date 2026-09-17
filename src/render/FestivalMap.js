import { InteractiveObject } from '../entities/InteractiveObject.js';

/**
 * FestivalMap.js
 * Builds and manages the festival environment:
 * - World geometry & zones
 * - Static collision obstacles (barriers, walls, stall counters)
 * - Decorative elements (rangoli, fairy lights, marigolds, diyas)
 * - Interactable world objects including the Damaged Power Cable
 */
export class FestivalMap {
  constructor() {
    this.width = 1600;
    this.height = 1100;

    this.obstacles = [];
    this.interactables = [];
    this.decorations = {
      diyas: [],
      rangolis: [],
      fairyLights: [],
      torans: []
    };

    this._buildEnvironment();
  }

  _buildEnvironment() {
    // -------------------------------------------------------------
    // 1. WORLD BOUNDARIES
    // -------------------------------------------------------------
    this.obstacles.push({ left: 0, right: this.width, top: 0, bottom: 90, solid: true });
    this.obstacles.push({ left: 0, right: this.width, top: this.height - 40, bottom: this.height, solid: true });
    this.obstacles.push({ left: 0, right: 60, top: 0, bottom: this.height, solid: true });
    this.obstacles.push({ left: this.width - 60, right: this.width, top: 0, bottom: this.height, solid: true });

    // -------------------------------------------------------------
    // 2. ENTRANCE GATE & ARCHWAY
    // -------------------------------------------------------------
    const entranceToran = new InteractiveObject({
      id: 'entrance_arch',
      name: 'Grand Pandal Welcome Gate',
      x: 680,
      y: 930,
      width: 240,
      height: 70,
      solid: false,
      interactRadius: 80,
      prompt: 'Inspect Welcome Arch',
      category: 'Entrance',
      description: 'A grand arched gateway draped in fresh yellow-orange marigold torans and fragrant mango leaves. A glowing marquee reads: "75th Sarvajanik Ganesh Mahotsav - Welcome Devotees".',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);

        // 1. Carved Wooden Pillars with stone plinths
        ctx.fillStyle = '#451a03';
        ctx.fillRect(s.x, s.y + 10, 26, 60);
        ctx.fillRect(s.x + obj.width - 26, s.y + 10, 26, 60);

        // Ornate pillar capitals and golden bands
        ctx.fillStyle = '#b45309';
        ctx.fillRect(s.x + 3, s.y + 14, 20, 52);
        ctx.fillRect(s.x + obj.width - 23, s.y + 14, 20, 52);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(s.x + 1, s.y + 24, 24, 4);
        ctx.fillRect(s.x + 1, s.y + 46, 24, 4);
        ctx.fillRect(s.x + obj.width - 25, s.y + 24, 24, 4);
        ctx.fillRect(s.x + obj.width - 25, s.y + 46, 24, 4);

        // Stone plinth bases
        ctx.fillStyle = '#78350f';
        ctx.fillRect(s.x - 3, s.y + 60, 32, 10);
        ctx.fillRect(s.x + obj.width - 29, s.y + 60, 32, 10);

        // 2. Grand Archway Transom Beam
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(s.x - 6, s.y - 18, obj.width + 12, 26);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(s.x - 2, s.y - 14, obj.width + 4, 18);

        // Gold trim borders on transom
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(s.x - 6, s.y - 18, obj.width + 12, 3);
        ctx.fillRect(s.x - 6, s.y + 5, obj.width + 12, 3);

        // Auspicious Marquee Text
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10.5px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('॥ 75th SARVAJANIK GANESHOTSAV ॥', s.x + obj.width / 2, s.y - 5);

        // 3. Fresh Mango Leaves (Aam ke Patte) Toran
        ctx.fillStyle = '#15803d';
        for (let mx = s.x + 10; mx < s.x + obj.width - 10; mx += 14) {
          ctx.beginPath();
          ctx.moveTo(mx, s.y + 8);
          ctx.lineTo(mx + 6, s.y + 20);
          ctx.lineTo(mx + 12, s.y + 8);
          ctx.closePath();
          ctx.fill();
        }

        // 4. Lush Marigold Flower Garland (Genda Phool Toran)
        for (let gx = s.x + 8; gx < s.x + obj.width - 8; gx += 13) {
          // Alternating saffron and bright gold blossoms
          ctx.fillStyle = (gx % 26 === 0) ? '#ea580c' : '#facc15';
          ctx.beginPath();
          ctx.arc(gx + 5, s.y + 11, 5.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(gx + 5, s.y + 11, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Hanging brass temple bells at gate corners
        [s.x + 8, s.x + obj.width - 8].forEach(bx => {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(bx, s.y + 24, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(bx - 3, s.y + 24, 6, 5);
          ctx.fillRect(bx - 1, s.y + 29, 2, 3);
        });
      }
    });
    this.interactables.push(entranceToran);

    this.obstacles.push({ left: 60, right: 670, top: 970, bottom: 1040, solid: true });
    this.obstacles.push({ left: 930, right: this.width - 60, top: 970, bottom: 1040, solid: true });

    // -------------------------------------------------------------
    // 3. FLOWER STALL
    // -------------------------------------------------------------
    const flowerStall = new InteractiveObject({
      id: 'flower_stall',
      name: 'Radha Florists & Garlands',
      x: 200,
      y: 600,
      width: 170,
      height: 90,
      solid: true,
      collider: { offsetX: 0, offsetY: 25, width: 170, height: 65 },
      interactRadius: 85,
      prompt: 'Browse Flower Stall',
      category: 'Market Stall',
      description: 'Heaps of fresh fragrant orange marigolds, red roses, and tender durva grass bundles. Uncle Sharma was seen chatting here earlier.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);

        // 1. Stall counter body with dark teakwood texture
        ctx.fillStyle = '#5c2d16';
        ctx.fillRect(s.x, s.y + 20, obj.width, obj.height - 20);

        // Woven bamboo slats texture on counter front
        ctx.strokeStyle = '#3d1d0e';
        ctx.lineWidth = 1;
        for (let bx = s.x + 8; bx < s.x + obj.width - 8; bx += 10) {
          ctx.beginPath();
          ctx.moveTo(bx, s.y + 22);
          ctx.lineTo(bx, s.y + obj.height);
          ctx.stroke();
        }

        // 2. Festive Scalloped Awning / Canopy (Crimson & Cream stripes)
        const stripeW = 17;
        for (let i = 0; i < obj.width; i += stripeW) {
          const isRed = (Math.floor(i / stripeW) % 2 === 0);
          ctx.fillStyle = isRed ? '#be123c' : '#fef3c7';
          ctx.fillRect(s.x + i, s.y - 2, stripeW, 24);

          // Scalloped fringe
          ctx.beginPath();
          ctx.arc(s.x + i + stripeW / 2, s.y + 22, stripeW / 2, 0, Math.PI);
          ctx.fill();
        }

        // Awning shadow
        ctx.fillStyle = 'rgba(15, 8, 4, 0.4)';
        ctx.fillRect(s.x, s.y + 22, obj.width, 6);

        // 3. Flower Baskets & Trays (Wicker Baskets)
        const baskets = [
          { x: s.x + 24, y: s.y + 36, flowerColor: '#ea580c', centerColor: '#fef08a', name: 'Marigolds' },
          { x: s.x + 64, y: s.y + 36, flowerColor: '#e11d48', centerColor: '#ffe4e6', name: 'Roses' },
          { x: s.x + 106, y: s.y + 36, flowerColor: '#facc15', centerColor: '#ffffff', name: 'Genda' },
          { x: s.x + 146, y: s.y + 36, flowerColor: '#16a34a', centerColor: '#86efac', name: 'Durva' }
        ];

        baskets.forEach(b => {
          // Woven wicker basket rim
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(b.x, b.y + 2, 17, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#9a3412';
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, 15, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Overflowing blossoms
          for (let petal = 0; petal < 6; petal++) {
            const pa = (petal / 6) * Math.PI * 2;
            const px = b.x + Math.cos(pa) * 7;
            const py = b.y - 3 + Math.sin(pa) * 5;
            ctx.fillStyle = b.flowerColor;
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Center blossom
          ctx.fillStyle = b.centerColor;
          ctx.beginPath();
          ctx.arc(b.x, b.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // 4. Hanging Flower Garlands Draping From Counter
        ctx.fillStyle = '#ea580c';
        for (let gx = s.x + 30; gx <= s.x + obj.width - 30; gx += 28) {
          for (let gy = 0; gy < 4; gy++) {
            ctx.beginPath();
            ctx.arc(gx, s.y + 54 + gy * 7, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 5. Stall Placard
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.roundRect(s.x + 22, s.y + 68, obj.width - 44, 17, 4);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌸 RADHA FLORISTS & GARLANDS', s.x + obj.width / 2, s.y + 76);
      }
    });
    this.interactables.push(flowerStall);
    this.obstacles.push(flowerStall);

    // -------------------------------------------------------------
    // 4. MODAK / PRASADM STALL
    // -------------------------------------------------------------
    const PRASADMStall = new InteractiveObject({
      id: 'PRASADM_stall',
      name: 'MahaPRASADM & Modak Counter',
      x: 1220,
      y: 600,
      width: 180,
      height: 90,
      solid: true,
      collider: { offsetX: 0, offsetY: 25, width: 180, height: 65 },
      interactRadius: 85,
      prompt: 'Inspect PRASADM Counter',
      category: 'Food Stall',
      description: 'Tiered brass thalis filled with 108 authentic Ukadiche Modaks, motichoor laddoos, and cardamom-scented panchamrit prepared for Lord Ganesh.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);

        // 1. Stall counter body with teak finish
        ctx.fillStyle = '#5c2d16';
        ctx.fillRect(s.x, s.y + 20, obj.width, obj.height - 20);

        // Counter front carving details
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x + 8, s.y + 26, obj.width - 16, obj.height - 32);

        // 2. Festive Saffron & Cream Striped Canopy
        const stripeW = 18;
        for (let i = 0; i < obj.width; i += stripeW) {
          const isSaffron = (Math.floor(i / stripeW) % 2 === 0);
          ctx.fillStyle = isSaffron ? '#ea580c' : '#fffbeb';
          ctx.fillRect(s.x + i, s.y - 2, stripeW, 24);

          // Scalloped fringe
          ctx.beginPath();
          ctx.arc(s.x + i + stripeW / 2, s.y + 22, stripeW / 2, 0, Math.PI);
          ctx.fill();
        }

        // Canopy shadow
        ctx.fillStyle = 'rgba(15, 8, 4, 0.4)';
        ctx.fillRect(s.x, s.y + 22, obj.width, 6);

        // 3. Gleaming Tiered Brass Thalis
        const thalis = [
          { x: s.x + 32, type: 'modak' },
          { x: s.x + 78, type: 'laddoo' },
          { x: s.x + 122, type: 'modak' },
          { x: s.x + 156, type: 'panchamrit' }
        ];

        thalis.forEach(t => {
          // Brass Thali Base & Rim
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(t.x, s.y + 38, 18, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(t.x, s.y + 36, 16, 8.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.ellipse(t.x, s.y + 35, 13, 6.5, 0, 0, Math.PI * 2);
          ctx.fill();

          if (t.type === 'modak') {
            // Steamed Ukadiche Modak (Pleated conical dumplings with saffron strands)
            ctx.fillStyle = '#fffbeb';
            ctx.beginPath();
            ctx.moveTo(t.x, s.y + 23);
            ctx.quadraticCurveTo(t.x - 9, s.y + 34, t.x - 8, s.y + 36);
            ctx.quadraticCurveTo(t.x, s.y + 38, t.x + 8, s.y + 36);
            ctx.quadraticCurveTo(t.x + 9, s.y + 34, t.x, s.y + 23);
            ctx.closePath();
            ctx.fill();

            // Saffron tip strand
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(t.x - 0.5, s.y + 22, 1.5, 3);

            // Flanking smaller modaks
            ctx.fillStyle = '#fef3c7';
            [-5, 5].forEach(dx => {
              ctx.beginPath();
              ctx.arc(t.x + dx, s.y + 33, 3, 0, Math.PI * 2);
              ctx.fill();
            });
          } else if (t.type === 'laddoo') {
            // Motichoor Laddoos (Golden yellow boondi pearls)
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(t.x, s.y + 29, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(t.x, s.y + 28, 5, 0, Math.PI * 2);
            ctx.fill();
            // Pistachio speckles
            ctx.fillStyle = '#15803d';
            ctx.fillRect(t.x - 1.5, s.y + 27, 2, 2);
          } else {
            // Panchamrit Brass Katori
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.ellipse(t.x, s.y + 33, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(t.x, s.y + 32, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 4. Stall Placard
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.roundRect(s.x + 22, s.y + 68, obj.width - 44, 17, 4);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍯 MAHAPRASAD & MODAK COUNTER', s.x + obj.width / 2, s.y + 76);
      }
    });
    this.interactables.push(PRASADMStall);
    this.obstacles.push(PRASADMStall);

    // -------------------------------------------------------------
    // 5. ELECTRICAL AREA & BACKUP GENERATOR
    // -------------------------------------------------------------
    const generator = new InteractiveObject({
      id: 'generator',
      name: 'Diesel Backup Generator (50 KVA)',
      x: 160,
      y: 240,
      width: 140,
      height: 100,
      solid: true,
      collider: { offsetX: 0, offsetY: 20, width: 140, height: 80 },
      interactRadius: 85,
      prompt: 'Inspect Generator',
      category: 'Electrical Area',
      description: 'The main 50 KVA diesel generator powering the festival illumination and stage audio. Heavy copper cables lead out through an unshielded ground conduit towards the stage.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);

        // 1. Steel base frame & vibration dampeners
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(s.x - 8, s.y + obj.height - 12, obj.width + 16, 12);
        // Rubber mounts
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(s.x, s.y + obj.height - 4, 16, 6);
        ctx.fillRect(s.x + obj.width - 16, s.y + obj.height - 4, 16, 6);

        // 2. Heavy industrial diesel generator enclosure (Dark teal-green)
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(s.x, s.y + 18, obj.width, obj.height - 30);

        // Top cowl / roof with rain bevel
        ctx.fillStyle = '#115e59';
        ctx.beginPath();
        ctx.moveTo(s.x - 4, s.y + 18);
        ctx.lineTo(s.x + 8, s.y + 10);
        ctx.lineTo(s.x + obj.width - 8, s.y + 10);
        ctx.lineTo(s.x + obj.width + 4, s.y + 18);
        ctx.closePath();
        ctx.fill();

        // 3. Stamped ventilation cooling louvers
        ctx.fillStyle = '#134e4a';
        for (let g = 0; g < 5; g++) {
          ctx.fillRect(s.x + 12, s.y + 26 + g * 8, 56, 4);
          ctx.fillStyle = '#042f2e';
          ctx.fillRect(s.x + 12, s.y + 29 + g * 8, 56, 1);
          ctx.fillStyle = '#134e4a';
        }

        // 4. Exhaust stack with heat wrap
        ctx.fillStyle = '#475569';
        ctx.fillRect(s.x + 82, s.y - 4, 14, 22);
        ctx.fillStyle = '#334155';
        ctx.fillRect(s.x + 80, s.y - 6, 18, 4); // rain flap

        // 5. Analog Control Panel & Gauges
        ctx.fillStyle = '#022c22';
        ctx.fillRect(s.x + 76, s.y + 24, 52, 42);
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1;
        ctx.strokeRect(s.x + 76, s.y + 24, 52, 42);

        // Round AC Voltmeter
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x + 90, s.y + 36, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x + 90, s.y + 36);
        ctx.lineTo(s.x + 94, s.y + 32);
        ctx.stroke();

        // Round Pressure Gauge
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x + 114, s.y + 36, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x + 114, s.y + 36);
        ctx.lineTo(s.x + 117, s.y + 31);
        ctx.stroke();

        // Emergency STOP Button (Red mushroom cap)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(s.x + 88, s.y + 54, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Green Power Status Light
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(s.x + 104, s.y + 54, 3, 0, Math.PI * 2);
        ctx.fill();

        // 6. 415V Danger Warning Hazard Sign
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(s.x + 36, s.y + 70);
        ctx.lineTo(s.x + 50, s.y + 86);
        ctx.lineTo(s.x + 22, s.y + 86);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('415V', s.x + 36, s.y + 83);

        // Perimeter safety barrier
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x - 8, s.y + 12, obj.width + 16, obj.height - 4);
      }
    });
    this.interactables.push(generator);
    this.obstacles.push(generator);

    // -------------------------------------------------------------
    // 5B. DAMAGED POWER CABLE (Critical Failure Element!)
    // -------------------------------------------------------------
    const damagedCable = new InteractiveObject({
      id: 'damaged_cable',
      name: 'Damaged 415V Main Power Cable',
      x: 235,
      y: 335,
      width: 70,
      height: 40,
      solid: false,
      interactRadius: 70,
      prompt: 'Inspect Damaged Cable',
      category: 'Electrical Hazard',
      description: 'DANGER: The heavy rubber insulation on this high-voltage cable is severely cracked and worn out! Bare copper strands are exposed right inside a low mud depression where rainwater runoff collects during rain.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);

        // 1. Mud Runoff Depression with Murky Rainwater Puddle
        ctx.fillStyle = '#2a170f';
        ctx.beginPath();
        ctx.ellipse(s.x + 35, s.y + 22, 34, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Puddle water surface with soft sheen
        ctx.fillStyle = 'rgba(28, 38, 55, 0.75)';
        ctx.beginPath();
        ctx.ellipse(s.x + 35, s.y + 22, 29, 13.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water ripple highlights
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(s.x + 35, s.y + 22, 18, 7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Heavy Industrial 3-Phase Black Rubber Cable
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x + 4, s.y + 9);
        ctx.quadraticCurveTo(s.x + 35, s.y + 28, s.x + 66, s.y + 13);
        ctx.stroke();

        // Cracked outer insulation rubber flaps
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.x + 22, s.y + 19);
        ctx.lineTo(s.x + 26, s.y + 24);
        ctx.moveTo(s.x + 45, s.y + 23);
        ctx.lineTo(s.x + 49, s.y + 18);
        ctx.stroke();

        // 3. Exposed Frayed Raw Copper Strands
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(s.x + 27, s.y + 21);
        ctx.lineTo(s.x + 43, s.y + 23);
        ctx.stroke();

        // Individual frayed copper filaments
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x + 31, s.y + 20);
        ctx.lineTo(s.x + 35, s.y + 17);
        ctx.moveTo(s.x + 36, s.y + 23);
        ctx.lineTo(s.x + 40, s.y + 26);
        ctx.stroke();

        // 4. Hazard Warning Marker Flag
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + 50, s.y + 24);
        ctx.lineTo(s.x + 50, s.y + 2);
        ctx.stroke();

        // Red & Yellow Striped Caution Flag
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(s.x + 50, s.y + 2);
        ctx.lineTo(s.x + 66, s.y + 8);
        ctx.lineTo(s.x + 50, s.y + 14);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(s.x + 54, s.y + 3.5);
        ctx.lineTo(s.x + 59, s.y + 5.5);
        ctx.lineTo(s.x + 55, s.y + 12);
        ctx.closePath();
        ctx.fill();
      }
    });
    this.interactables.push(damagedCable);

    // -------------------------------------------------------------
    // 6. SOUND & LIGHTING MIXER BOARD
    // -------------------------------------------------------------
    const soundMixer = new InteractiveObject({
      id: 'sound_mixer',
      name: 'Festival Audio & PA Control Board',
      x: 390,
      y: 250,
      width: 100,
      height: 70,
      solid: true,
      collider: { offsetX: 0, offsetY: 15, width: 100, height: 55 },
      interactRadius: 75,
      prompt: 'Inspect Sound Console',
      category: 'Utility',
      description: 'A 24-channel analog audio console hooked to the main stage speakers and mics. It is powered directly by the 415V generator feed line.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);

        // 1. Console Desk Stand
        ctx.fillStyle = '#27272a';
        ctx.fillRect(s.x, s.y + 16, obj.width, obj.height - 16);

        // 2. Angled Mixer Surface (Matte Charcoal)
        ctx.fillStyle = '#18181b';
        ctx.fillRect(s.x + 3, s.y + 19, obj.width - 6, obj.height - 22);

        // Aluminum flightcase edge trim
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x + 3, s.y + 19, obj.width - 6, obj.height - 22);

        // 3. Channel Strips & Faders
        for (let i = 0; i < 7; i++) {
          const fx = s.x + 8 + i * 11;
          // Channel fader track
          ctx.fillStyle = '#09090b';
          ctx.fillRect(fx + 2, s.y + 34, 3, 22);

          // Fader cap (color coded)
          const faderColors = ['#f8fafc', '#f8fafc', '#ef4444', '#ef4444', '#38bdf8', '#38bdf8', '#facc15'];
          ctx.fillStyle = faderColors[i];
          const faderPos = s.y + 40 + (i % 3) * 3;
          ctx.fillRect(fx + 1, faderPos, 5, 4);

          // Rotary gain knobs
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(fx + 3.5, s.y + 26, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Master Stereo LED VU Meter
        for (let v = 0; v < 6; v++) {
          const vy = s.y + 26 + v * 4.5;
          ctx.fillStyle = (v > 4) ? '#ef4444' : ((v > 3) ? '#f59e0b' : '#22c55e');
          ctx.fillRect(s.x + 87, vy, 4, 3);
          ctx.fillRect(s.x + 92, vy, 4, 3);
        }

        // 5. Heavy Snake Cable Bundle exiting backstage
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x + 75, s.y + 55);
        ctx.bezierCurveTo(s.x + 105, s.y + 68, s.x + 125, s.y + 35, s.x + 155, s.y + 50);
        ctx.stroke();
      }
    });
    this.interactables.push(soundMixer);
    this.obstacles.push(soundMixer);

    // -------------------------------------------------------------
    // 7. GRAND FESTIVAL MANDAP & GANESH IDOL ALTAR
    // -------------------------------------------------------------
    const ganeshIdol = new InteractiveObject({
      id: 'ganesh_idol',
      name: 'Lord Shri Ganesh (Vighnaharta)',
      x: 720,
      y: 110,
      width: 160,
      height: 150,
      solid: true,
      collider: { offsetX: 10, offsetY: 50, width: 140, height: 95 },
      interactRadius: 100,
      prompt: 'Offer Pranam to Shri Ganesh',
      category: 'Sacred Altar',
      description: 'The majestic 8-foot clay idol of Lord Ganesh, adorned with a golden crown (mukut), marigold garlands, and modak in hand. The ceremonial aarti thali rests before him.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);
        const cx = s.x + obj.width / 2;
        const cy = s.y + 56;

        // 1. Ornate Singhasan (Carved Wooden Throne with Golden Plinths)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(s.x + 6, s.y + 88, obj.width - 12, 58);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(s.x + 12, s.y + 92, obj.width - 24, 50);

        // Golden filigree trim on throne
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(s.x + 8, s.y + 92, obj.width - 16, 4);
        ctx.fillRect(s.x + 8, s.y + 138, obj.width - 16, 4);

        // Velvet cushion seat
        ctx.fillStyle = '#831843';
        ctx.fillRect(s.x + 22, s.y + 96, obj.width - 44, 40);

        // 2. Golden Prabhavali (Sacred Sunburst Aura Arch behind Ganesha)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 48, 0, Math.PI * 2);
        ctx.stroke();

        // Radiating golden petal rays on aura
        for (let r = 0; r < 12; r++) {
          const angle = (r / 12) * Math.PI * 2;
          const rx1 = cx + Math.cos(angle) * 44;
          const ry1 = cy + Math.sin(angle) * 44;
          const rx2 = cx + Math.cos(angle) * 52;
          const ry2 = cy + Math.sin(angle) * 52;
          ctx.beginPath();
          ctx.moveTo(rx1, ry1);
          ctx.lineTo(rx2, ry2);
          ctx.stroke();
        }

        // 3. Lord Ganesha Body (Warm Auspicious Terracotta Saffron Form)
        // Big round belly (Lambodara)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 26, 26, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Royal Silk Pitambari Dhoti (Crimson with gold zari hem)
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(cx - 20, cy + 30, 40, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 20, cy + 46, 40, 3);

        // Sacred Thread (Janeyu) across chest
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy + 10);
        ctx.lineTo(cx + 18, cy + 38);
        ctx.stroke();

        // 4. Arms & Divine Attributes
        // Upper Right Hand (Holding Golden Goad / Parashu)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(cx - 26, cy + 10, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 31, cy - 2, 4, 16); // Goad handle
        ctx.beginPath();
        ctx.arc(cx - 29, cy - 2, 4.5, 0, Math.PI);
        ctx.fill();

        // Upper Left Hand (Holding Sacred Lotus / Pasha)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(cx + 26, cy + 10, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#db2777'; // Pink Lotus
        ctx.beginPath();
        ctx.arc(cx + 28, cy + 4, 5, 0, Math.PI * 2);
        ctx.fill();

        // Lower Right Hand: Abhaya Mudra (Blessing Palm)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(cx - 20, cy + 24, 6, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx - 20, cy + 24, 2, 0, Math.PI * 2); // Golden palm symbol
        ctx.fill();

        // Lower Left Hand: Golden Katori with Modaks
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(cx + 20, cy + 24, 6, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(cx + 20, cy + 22, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(cx + 20, cy + 18, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 5. Head & Majestic Elephant Ears
        // Ears (with pink inner ear shading & gold earrings)
        [-26, 26].forEach((ex, idx) => {
          const rot = idx === 0 ? -0.15 : 0.15;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.ellipse(cx + ex, cy - 2, 16, 20, rot, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.ellipse(cx + ex, cy - 2, 10, 13, rot, 0, Math.PI * 2);
          ctx.fill();

          // Golden Kundal (Earrings)
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx + ex * 1.3, cy + 12, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Head Base
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 18, 0, Math.PI * 2);
        ctx.fill();

        // Gentle eyes
        [-7, 7].forEach(eyeX => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(cx + eyeX, cy - 8, 3.5, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(cx + eyeX, cy - 8, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });

        // 6. Curved Trunk (Turning Left towards Modak)
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 2);
        ctx.quadraticCurveTo(cx - 6, cy + 18, cx - 15, cy + 15);
        ctx.stroke();

        // Single Tusk (Ekadanta)
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy + 8);
        ctx.lineTo(cx + 14, cy + 13);
        ctx.lineTo(cx + 7, cy + 14);
        ctx.closePath();
        ctx.fill();

        // Auspicious Vermilion & Sandalwood Tilak (Trishul/Tripundra)
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 14);
        ctx.lineTo(cx + 6, cy - 14);
        ctx.moveTo(cx - 5, cy - 11);
        ctx.lineTo(cx + 5, cy - 11);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 12, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 7. Ornate Golden Mukut (Crown with Ruby & Emerald Jewels)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 36);
        ctx.lineTo(cx - 16, cy - 18);
        ctx.lineTo(cx + 16, cy - 18);
        ctx.closePath();
        ctx.fill();

        // Crown tiers
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 14, cy - 20, 28, 4);
        ctx.fillStyle = '#dc2626'; // Ruby gem
        ctx.beginPath();
        ctx.arc(cx, cy - 26, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981'; // Emerald gem
        ctx.beginPath();
        ctx.arc(cx, cy - 33, 2, 0, Math.PI * 2);
        ctx.fill();

        // 8. Sacred Mooshak Devotee (Mouse with folded paws offering modak)
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(cx + 42, s.y + 120, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 37, s.y + 116, 4, 0, Math.PI * 2); // Head
        ctx.fill();
        // Tiny ears
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(cx + 36, s.y + 112, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Modak in paws
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(cx + 33, s.y + 118, 2, 0, Math.PI * 2);
        ctx.fill();

        // 9. Ceremonial Brass Kalash with Mango Leaves & Coconut
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(cx - 44, s.y + 124, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(cx - 44, s.y + 122, 8, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Mango leaves
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(cx - 44, s.y + 118);
        ctx.lineTo(cx - 49, s.y + 110);
        ctx.lineTo(cx - 44, s.y + 112);
        ctx.lineTo(cx - 39, s.y + 110);
        ctx.closePath();
        ctx.fill();
        // Coconut
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(cx - 44, s.y + 112, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // 10. Polished Brass Aarti Thali
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(cx, s.y + 130, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(cx, s.y + 128, 20, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Kumkum & Haldi bowls on thali
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(cx - 9, s.y + 127, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(cx + 9, s.y + 127, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Central Camphor Flame (Karpur Aarti)
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(cx, s.y + 124, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(cx, s.y + 122, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    this.interactables.push(ganeshIdol);
    this.obstacles.push(ganeshIdol);

    this.obstacles.push({ left: 580, right: 1020, top: 90, bottom: 130, solid: true });
    this.obstacles.push({ left: 580, right: 620, top: 130, bottom: 330, solid: true });
    this.obstacles.push({ left: 980, right: 1020, top: 130, bottom: 330, solid: true });

    // -------------------------------------------------------------
    // 8. BRASS DEEPSTAMBH (Ceremonial Lamps)
    // -------------------------------------------------------------
    this.leftDeepstambh = new InteractiveObject({
      id: 'deepstambh_left',
      name: 'Left Brass Deepstambh (Ceremonial Lamp)',
      x: 640,
      y: 240,
      width: 40,
      height: 70,
      solid: true,
      collider: { offsetX: 6, offsetY: 40, width: 28, height: 26 },
      interactRadius: 65,
      prompt: 'Light Deepstambh Lamps [Camphor Flame]',
      category: 'Ritual Item',
      description: 'A tall multi-tiered brass lamp filled with sacred sesame oil and cotton wicks. Panditji insists both lamps must be lit with the sacred flame before 6:30 PM for the Final Aarti.',
      renderCustom: (ctx, camera, obj) => {
        this._renderDeepstambh(ctx, camera, obj);
      }
    });
    this.leftDeepstambh.isLit = false;
    this.interactables.push(this.leftDeepstambh);
    this.obstacles.push(this.leftDeepstambh);

    this.rightDeepstambh = new InteractiveObject({
      id: 'deepstambh_right',
      name: 'Right Brass Deepstambh (Ceremonial Lamp)',
      x: 920,
      y: 240,
      width: 40,
      height: 70,
      solid: true,
      collider: { offsetX: 6, offsetY: 40, width: 28, height: 26 },
      interactRadius: 65,
      prompt: 'Light Deepstambh Lamps [Camphor Flame]',
      category: 'Ritual Item',
      description: 'The companion sacred brass deepstambh on the eastern altar wing. Must be lit before 6:30 PM to complete the final ritual preparations.',
      renderCustom: (ctx, camera, obj) => {
        this._renderDeepstambh(ctx, camera, obj);
      }
    });
    this.rightDeepstambh.isLit = false;
    this.interactables.push(this.rightDeepstambh);
    this.obstacles.push(this.rightDeepstambh);

    // -------------------------------------------------------------
    // 9. FESTIVAL NOTICE BOARD
    // -------------------------------------------------------------
    const noticeBoard = new InteractiveObject({
      id: 'notice_board',
      name: 'Pandal Schedule Notice Board',
      x: 970,
      y: 720,
      width: 80,
      height: 70,
      solid: true,
      collider: { offsetX: 0, offsetY: 25, width: 80, height: 45 },
      interactRadius: 75,
      prompt: 'Read Schedule Board',
      category: 'Information',
      description: 'SCHEDULE OF EVENTS:\n• 05:55 PM: Pandal Doors Open\n• 06:00 PM: Devotee Darshan Begins\n• 06:08 PM: Weather Forecast (Monsoon Showers Expected)\n• 06:15 PM: Modak Offering & Naivedya\n• 06:30 PM: The Grand Final Aarti',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(s.x + 10, s.y + 30, 8, 40);
        ctx.fillRect(s.x + obj.width - 18, s.y + 30, 8, 40);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(s.x, s.y + 4, obj.width, 36);

        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(s.x + 6, s.y + 8, obj.width - 12, 28);

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SCHEDULE', s.x + obj.width / 2, s.y + 17);
        ctx.fillStyle = '#1e293b';
        ctx.font = '7px sans-serif';
        ctx.fillText('Grand Aarti: 6:30 PM', s.x + obj.width / 2, s.y + 28);
      }
    });
    this.interactables.push(noticeBoard);
    this.obstacles.push(noticeBoard);

    // -------------------------------------------------------------
    // 9B. UNCLE SHARMA'S LOST BRASS KEY (Near Flower Stall Crates)
    // -------------------------------------------------------------
    this.storageKeyProp = new InteractiveObject({
      id: 'storage_key',
      name: 'Uncle Sharma\'s Lost Brass Key',
      x: 340,
      y: 680,
      width: 24,
      height: 24,
      solid: false,
      interactRadius: 65,
      prompt: 'Pick up Brass Key',
      category: 'Key Item',
      description: 'An antique stamped brass key dropped near the flower crates. Uncle Sharma was searching frantically for this earlier. It has the committee initials "SPM-2026" engraved on it.',
      renderCustom: (ctx, camera, obj) => {
        if (!obj.active) return;
        const s = camera.worldToScreen(obj.x, obj.y);
        // Golden glint
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(s.x + 8, s.y + 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(s.x + 8, s.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(s.x + 13, s.y + 6, 10, 4);
        ctx.fillRect(s.x + 19, s.y + 10, 4, 4);
      }
    });
    this.interactables.push(this.storageKeyProp);

    // -------------------------------------------------------------
    // 9C. COMMITTEE STORAGE CABINET (Backstage Utility Area)
    // -------------------------------------------------------------
    this.storageCabinetProp = new InteractiveObject({
      id: 'storage_cabinet',
      name: 'Committee Supply Cabinet',
      x: 100,
      y: 360,
      width: 60,
      height: 80,
      solid: true,
      collider: { offsetX: 0, offsetY: 20, width: 60, height: 60 },
      interactRadius: 75,
      prompt: 'Inspect Supply Cabinet',
      category: 'Storage',
      description: 'Heavy steel locker marked "Pandal Committee Reserves". Holds replacement electrical cabling and cooking supplies. Requires Uncle Sharma\'s brass key to unlock.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);
        ctx.fillStyle = '#334155';
        ctx.fillRect(s.x, s.y, obj.width, obj.height);
        ctx.fillStyle = '#475569';
        ctx.fillRect(s.x + 4, s.y + 4, obj.width - 8, obj.height - 8);

        // Cabinet doors
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x + 6, s.y + 6, obj.width / 2 - 8, obj.height - 12);
        ctx.strokeRect(s.x + obj.width / 2 + 2, s.y + 6, obj.width / 2 - 8, obj.height - 12);

        // Brass lock or opened badge
        if (obj.isUnlocked) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(s.x + obj.width / 2 - 4, s.y + 36, 8, 8);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 7px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('OPEN', s.x + obj.width / 2, s.y + 30);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(s.x + obj.width / 2, s.y + 40, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    this.interactables.push(this.storageCabinetProp);
    this.obstacles.push(this.storageCabinetProp);

    // -------------------------------------------------------------
    // 9D. ENTRANCE OBSTRUCTION CRATES (Eastern Queue Route)
    // -------------------------------------------------------------
    this.entranceObstructionProp = new InteractiveObject({
      id: 'entrance_obstruction',
      name: 'Unattended Cargo Crates',
      x: 880,
      y: 830,
      width: 80,
      height: 60,
      solid: true,
      collider: { offsetX: 0, offsetY: 10, width: 80, height: 50 },
      interactRadius: 80,
      prompt: 'Push & Clear Cargo Crates',
      category: 'Obstruction',
      description: 'A stack of heavy wooden cargo crates left directly in the eastern queue detour walkway. If not moved before devotees arrive at 6:00 PM, incoming crowds will bottleneck and crush through the central mandap.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);
        if (obj.isCleared) {
          // Render moved off to the side (pushed against wall)
          ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
          ctx.fillRect(s.x + 60, s.y - 10, 40, 40);
          ctx.strokeStyle = '#b45309';
          ctx.strokeRect(s.x + 60, s.y - 10, 40, 40);
          return;
        }

        // Crates blocking pathway
        ctx.fillStyle = '#78350f';
        ctx.fillRect(s.x, s.y, 45, 45);
        ctx.fillRect(s.x + 35, s.y + 12, 45, 45);

        ctx.fillStyle = '#b45309';
        ctx.fillRect(s.x + 3, s.y + 3, 39, 39);
        ctx.fillRect(s.x + 38, s.y + 15, 39, 39);

        // Wooden cross bracing
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + 3, s.y + 3);
        ctx.lineTo(s.x + 42, s.y + 42);
        ctx.moveTo(s.x + 42, s.y + 3);
        ctx.lineTo(s.x + 3, s.y + 42);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s.x + 38, s.y + 15);
        ctx.lineTo(s.x + 77, s.y + 54);
        ctx.moveTo(s.x + 77, s.y + 15);
        ctx.lineTo(s.x + 38, s.y + 54);
        ctx.stroke();

        // Warning tape
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(s.x - 2, s.y + 8, 84, 46);
      }
    });
    this.interactables.push(this.entranceObstructionProp);
    this.obstacles.push(this.entranceObstructionProp);

    // -------------------------------------------------------------
    // 9E. MANDAP FESTIVAL GARLAND DECORATIONS ARCH
    // -------------------------------------------------------------
    this.garlandRackProp = new InteractiveObject({
      id: 'mandap_garland_rack',
      name: 'Mandap Ceremonial Garland Arch',
      x: 720,
      y: 330,
      width: 160,
      height: 40,
      solid: false,
      interactRadius: 80,
      prompt: 'Hang Royal Marigold Garland',
      category: 'Festival Decoration',
      description: 'The ceremonial archway before Lord Shri Ganesh\'s altar. Awaiting the 11-foot royal orange marigold and red rose garland from Radha\'s flower stall to complete the pandal decorations.',
      renderCustom: (ctx, camera, obj) => {
        const s = camera.worldToScreen(obj.x, obj.y);
        if (obj.isDecorated) {
          // Lush marigold & rose draped toran
          for (let gx = s.x; gx < s.x + obj.width; gx += 14) {
            ctx.fillStyle = gx % 28 === 0 ? '#ea580c' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(gx + 6, s.y + 14, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e11d48';
            ctx.beginPath();
            ctx.arc(gx + 6, s.y + 22, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y + 10);
          ctx.quadraticCurveTo(s.x + obj.width / 2, s.y + 28, s.x + obj.width, s.y + 10);
          ctx.stroke();
        } else {
          // Wooden support awaiting garland
          ctx.fillStyle = '#78350f';
          ctx.fillRect(s.x, s.y + 12, obj.width, 6);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('• AWAITING ROYAL MARIGOLD GARLAND •', s.x + obj.width / 2, s.y + 28);
        }
      }
    });
    this.garlandRackProp.isDecorated = false;
    this.interactables.push(this.garlandRackProp);

    // -------------------------------------------------------------
    // 10. DECORATIVE ELEMENTS
    // -------------------------------------------------------------
    this.decorations.rangolis = [
      { x: 800, y: 780, radius: 46, pattern: 'peacock' },
      { x: 800, y: 440, radius: 42, pattern: 'lotus' },
      { x: 285, y: 740, radius: 28, pattern: 'floral' },
      { x: 1310, y: 740, radius: 28, pattern: 'floral' }
    ];

    const diyaPositions = [
      { x: 480, y: 920 }, { x: 480, y: 840 }, { x: 480, y: 760 }, { x: 480, y: 680 }, { x: 480, y: 600 },
      { x: 1120, y: 920 }, { x: 1120, y: 840 }, { x: 1120, y: 760 }, { x: 1120, y: 680 }, { x: 1120, y: 600 },
      { x: 620, y: 380 }, { x: 700, y: 380 }, { x: 900, y: 380 }, { x: 980, y: 380 },
      { x: 680, y: 220 }, { x: 920, y: 220 }, { x: 740, y: 280 }, { x: 860, y: 280 }
    ];

    this.decorations.diyas = diyaPositions.map(p => ({
      x: p.x,
      y: p.y,
      phase: Math.random() * Math.PI * 2
    }));

    this.decorations.fairyLights = [
      { startX: 200, startY: 180, endX: 600, endY: 200, sag: 30, color: '#facc15' },
      { startX: 1000, startY: 200, endX: 1400, endY: 180, sag: 30, color: '#facc15' },
      { startX: 480, startY: 550, endX: 1120, endY: 550, sag: 45, color: '#fb923c' },
      { startX: 480, startY: 750, endX: 1120, endY: 750, sag: 45, color: '#38bdf8' },
      { startX: 480, startY: 920, endX: 1120, endY: 920, sag: 40, color: '#f43f5e' }
    ];
  }

  resetProps() {
    // Reset Key
    if (this.storageKeyProp) {
      this.storageKeyProp.active = true;
    }

    // Reset Cabinet
    if (this.storageCabinetProp) {
      this.storageCabinetProp.isUnlocked = false;
      this.storageCabinetProp.prompt = 'Inspect Supply Cabinet';
      this.storageCabinetProp.description = 'Heavy steel locker marked "Pandal Committee Reserves". Holds replacement electrical cabling and cooking supplies. Requires Uncle Sharma\'s brass key to unlock.';
    }

    // Reset Obstruction Crates
    if (this.entranceObstructionProp) {
      this.entranceObstructionProp.isCleared = false;
      this.entranceObstructionProp.solid = true;
      this.entranceObstructionProp.prompt = 'Push & Clear Cargo Crates';
      this.entranceObstructionProp.description = 'A stack of heavy wooden cargo crates left directly in the eastern queue detour walkway. If not moved before devotees arrive at 6:00 PM, incoming crowds will bottleneck and crush through the central mandap.';
      // Ensure it's in obstacles list
      if (!this.obstacles.includes(this.entranceObstructionProp)) {
        this.obstacles.push(this.entranceObstructionProp);
      }
    }

    // Reset Garland Arch
    if (this.garlandRackProp) {
      this.garlandRackProp.isDecorated = false;
      this.garlandRackProp.prompt = 'Hang Royal Marigold Garland';
      this.garlandRackProp.description = 'The ceremonial archway before Lord Shri Ganesh\'s altar. Awaiting the 11-foot royal orange marigold and red rose garland from Radha\'s flower stall to complete the pandal decorations.';
    }

    // Reset Deepstambh Lamps
    if (this.leftDeepstambh) {
      this.leftDeepstambh.isLit = false;
      this.leftDeepstambh.prompt = 'Light Deepstambh Lamps [Camphor Flame]';
    }
    if (this.rightDeepstambh) {
      this.rightDeepstambh.isLit = false;
      this.rightDeepstambh.prompt = 'Light Deepstambh Lamps [Camphor Flame]';
    }
  }

  _renderDeepstambh(ctx, camera, obj) {
    const s = camera.worldToScreen(obj.x, obj.y);
    const cx = s.x + obj.width / 2;

    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 10, s.y + 56, 20, 14);
    ctx.fillRect(cx - 2, s.y + 20, 4, 38);

    const tiers = [s.y + 46, s.y + 32, s.y + 18];
    tiers.forEach((ty, idx) => {
      const radius = 14 - idx * 3;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx, ty, radius, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame glow & wick
      if (obj.isLit) {
        // Bright active ceremonial flame
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(cx, ty - 6, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx, ty - 8, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, ty - 7, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Unlit cotton wick
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 1, ty - 4, 2, 4);
      }
    });
  }
}
