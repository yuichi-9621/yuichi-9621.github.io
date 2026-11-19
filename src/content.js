// ─────────────────────────────────────────────────────────────
// EDIT ME — all site copy lives in this one file.
// Fix any detail here and the whole site updates.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Yuichi Okuhama',
  handle: 'yuichi',
  role: 'Design Engineer',
  tagline: 'I design software, and then I build it.',
  location: 'San Francisco',
  intro:
    'I grew up in Okinawa and live in San Francisco. I’ve designed tools for blockchain teams and a marketplace you could walk around in VR, and these days I build my own things too, like Allsquare, a bill splitter I designed and shipped by myself. I made this site from scratch as well.',
  email: 'yuokuhama@gmail.com',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/yokuhama/' },
    { label: 'Email', url: 'mailto:yuokuhama@gmail.com' },
  ],
};

// Full case studies, structured by the Double Diamond.
// How I design, in my own words. Shown first on the Work page.
export const beliefs = [
  ['Design serves both sides', 'A design is a feature that, once it’s real, satisfies its stakeholders: the people who use it and the business behind it.'],
  ['Take away until it’s clear', '引き算, the art of subtraction. Growing up in Japan taught me that the best version is often the one with less in it.'],
  ['Go wide, then narrow', 'I work in a double diamond. First I explore to find the right problem and narrow it down, then explore again to find the right solution.'],
];

export const projects = [
  {
    id: 'snowx',
    index: '01',
    title: 'SnowX: 3D NFT Marketplace in VR',
    org: 'SnowX',
    year: '2022',
    tags: ['VR', 'Zero-to-One', 'Web3'],
    summary:
      'The first 3D NFT marketplace built for virtual reality. I led product design from zero to launch. Recognized by JETRO, showcased at TechCrunch.',
    meta: [
      ['role', 'UX Designer'],
      ['timeline', '2022 · 6 months'],
      ['team', '2 designers · 4 engineers · PM'],
      ['platform', 'Oculus / SideQuest VR'],
    ],
    lede: 'In 2022, every NFT marketplace looked the same: a grid of thumbnails, a price, a "connect wallet" button. SnowX asked a different question. What if you could stand inside a gallery instead of scrolling past one?',
    quote: '“We weren’t designing a store. We were designing a place.”',
    phases: [
      {
        name: 'discover',
        mode: 'diverge',
        heading: 'Listening before designing',
        body: 'I started where I always start: with people, not pixels. We ran 14 user interviews across two groups that almost never overlap. Seasoned VR users who had never touched crypto, and NFT collectors who had never owned a headset. The gap between them was the whole project.',
        points: [
          'VR-native users got motion sick from the floating menus other Web3 apps used in headset.',
          'NFT collectors couldn’t tell what they actually owned once an asset was “in a room.”',
          'Both groups distrusted wallet connection flows, the single biggest drop-off point.',
        ],
      },
      {
        name: 'define',
        mode: 'converge',
        heading: 'Narrowing to the real problem',
        body: 'How might we let people buy and own 3D NFTs with total confidence, inside an immersive space that feels comfortable to first-time VR users and trustworthy to first-time collectors?',
        points: [
          'Persona: Mika, 27, VR native. “I love being inside things. I just don’t want to do my taxes while I’m in there.”',
          'Persona: Daniel, 34, collector. “If I can’t verify what I own, it’s not an asset. It’s a screenshot.”',
        ],
      },
      {
        name: 'develop',
        mode: 'diverge',
        heading: 'Designing the way out of the spreadsheet',
        body: 'We explored three spatial metaphors (museum, bazaar, personal vault), prototyped them in Figma, then grey-boxed them in Unity so we could feel them in headset. A layout that reads fine on a monitor can be nauseating at 1:1 scale.',
        points: [
          'Diegetic UI: every control lived on a physical-feeling object. No floating panels.',
          'Ownership as light: NFTs you owned glowed warm, and everything else stayed cool.',
          'Wallet flow before entry: finance friction moved to a calm antechamber, so gas fees never broke immersion.',
        ],
      },
      {
        name: 'deliver',
        mode: 'converge',
        heading: 'Shipping & what it earned',
        body: 'We launched on SideQuest. The product was acknowledged by JETRO (the Japanese government’s trade organization) and showcased at TechCrunch, validating the bet that immersion could make Web3 feel human.',
        points: [
          'First 3D NFT marketplace shipped on VR.',
          '68% drop in wallet-connection abandonment vs. our v0 flow.',
          'JETRO recognition + TechCrunch showcase.',
        ],
      },
    ],
    metrics: [
      ['1st', '3D NFT marketplace on VR'],
      ['68%', 'less wallet-connect abandonment'],
      ['JETRO', 'recognition + TechCrunch showcase'],
    ],
    reflection:
      'SnowX taught me that the hardest part of emerging tech isn’t the technology. It’s translation. A great interface doesn’t ask people to learn a new mental model. It meets them inside the one they already have, and quietly does the hard work underneath.',
  },
  {
    id: 'mahola',
    index: '02',
    title: 'mahola: Enterprise Blockchain, No Code',
    org: 'Crypto Garage',
    year: '2023-24',
    tags: ['B2B', 'No-Code', 'Enterprise'],
    summary:
      'A no-code contract builder and real-time transaction analysis platform. Business teams deployed and monitored blockchain infrastructure without an engineer in the loop.',
    meta: [
      ['role', 'Product Designer (end-to-end)'],
      ['timeline', '2023-24'],
      ['context', 'Crypto Garage · Enterprise B2B'],
      ['surface', 'Web dashboard + no-code builder'],
    ],
    lede: 'Crypto Garage’s enterprise clients (banks, logistics firms, payment companies) wanted blockchain without hiring smart-contract engineers. Business teams understood exactly what they needed the chain to do. They just had no way to express it.',
    quote: '“The challenge wasn’t simplifying blockchain. It was respecting how much these teams already knew about everything except the chain.”',
    phases: [
      {
        name: 'discover',
        mode: 'diverge',
        heading: 'Sitting with the people who’d use it',
        body: 'Contextual interviews with 9 enterprise stakeholders across three client companies, shadowing real workflows, plus a heuristic evaluation of the three tools they were stitching together, scored against Nielsen’s heuristics.',
        points: [
          'Visibility of system status failed everywhere. No human-readable confirmation a contract worked.',
          'Error prevention was nonexistent. A mistyped address meant irreversible loss.',
          'The language was all “gas, nonce, ABI”. Nothing mapped to a business concept.',
        ],
      },
      {
        name: 'define',
        mode: 'converge',
        heading: 'From chaos to a single question',
        body: 'How might we let a non-technical business team create, deploy, and monitor smart contracts with the same confidence they’d have configuring any enterprise SaaS tool? No code, no fear of irreversible mistakes.',
        points: [
          'Persona: Rina, 38, operations lead. “I know the business rule perfectly. I just can’t write it in a language the chain understands.”',
          'Card sorting with 5 participants collapsed 40+ features into three mental models: Build, Deploy, Monitor.',
        ],
      },
      {
        name: 'develop',
        mode: 'diverge',
        heading: 'The no-code contract builder',
        body: 'I designed and tested three interaction models. The freeform canvas tested beautifully with engineers and terrified everyone else. The guided, step-based flow won because it removed the fear of the blank page.',
        points: [
          'Plain-language preview before deployment: “This contract will release ¥X when Y is confirmed.”',
          'Irreversibility guardrails: mandatory testnet simulation before anything touched mainnet.',
          'Monitoring translated raw transactions into a timeline of business events, not hashes.',
        ],
      },
      {
        name: 'deliver',
        mode: 'converge',
        heading: 'What shipped & what it changed',
        body: 'For the first time, business teams deployed and monitored blockchain infrastructure without an engineer in the loop. Three disconnected tools became one platform.',
        points: [
          '0 lines of code required to deploy a contract.',
          '3→1 tools consolidated.',
          '82% of usability-test tasks completed unaided by non-technical users.',
        ],
      },
    ],
    metrics: [
      ['0', 'lines of code to deploy'],
      ['3→1', 'tools consolidated'],
      ['82%', 'tasks completed unaided'],
    ],
    reflection:
      'mahola is the project I point to when someone asks what kind of designer I am. Collapsing fragmented, intimidating tools into a single thing that feels obvious: powerful underneath, calm on the surface, defensible to the business. That balance is the whole job.',
  },
  {
    id: 'netflix',
    index: '03',
    title: 'Netflix NMHP: Homepage Redesign',
    org: 'Self-initiated case study',
    year: 'Case study',
    tags: ['Double Diamond', 'UX Research', 'Consumer'],
    summary:
      'A complete Double Diamond run in the open: redesigning the non-member homepage so potential subscribers can see the unique stories only Netflix tells, before being asked to pay.',
    meta: [
      ['role', 'Solo, research to prototype'],
      ['timeline', 'Multi-week case study'],
      ['method', 'Double Diamond, end-to-end'],
      ['tools', 'Figma · card sorting · heuristics'],
    ],
    lede: 'Netflix’s non-member homepage leads with plans and pricing, asking for commitment before it earns desire. Its strongest asset, a library of originals you can’t watch anywhere else, is invisible until after you’ve paid.',
    quote: '“You can’t ask someone to commit to a relationship before you’ve shown them why you’re worth it.”',
    phases: [
      {
        name: 'discover',
        mode: 'diverge',
        heading: 'Finding the real friction',
        body: 'A structured heuristic evaluation against Nielsen’s ten heuristics, plus interviews with 6 people who had cancelled or never subscribed, to find the emotional barrier, not just the functional one.',
        points: [
          'The page spoke in plans and tiers. Users spoke in “is there anything I actually want to watch?”',
          'Key insight: curiosity → paywall → lost curiosity. The page killed desire at the exact moment it should have built it.',
        ],
      },
      {
        name: 'define',
        mode: 'converge',
        heading: 'A persona and a sharp problem',
        body: 'How might we help non-members discover the unique stories only Netflix offers, and build genuine desire to subscribe, before the page ever asks for a commitment?',
        points: [
          'Persona: Sam, 29, curious skeptic. “I’m not paying just to find out if there’s anything I’d actually watch.”',
        ],
      },
      {
        name: 'develop',
        mode: 'diverge',
        heading: 'Architecture, then interface',
        body: 'An open card sort showed people group streaming content by mood and exclusivity, not genre. I rebuilt the sitemap to lead with discovery, then used style tiles to settle the visual language before any high-fidelity comps.',
        points: [
          'Core move: an “Only on Netflix” discovery rail above the fold.',
          'One gentle sign-up prompt, after curiosity had been earned.',
        ],
      },
      {
        name: 'deliver',
        mode: 'converge',
        heading: 'The prototype & the proof',
        body: 'A high-fidelity interactive navigation prototype in Figma, usability-tested against the original.',
        points: [
          '5/6 testers preferred the content-first flow.',
          '+40% self-reported intent to sign up after browsing the discovery rail.',
        ],
      },
    ],
    metrics: [
      ['5/6', 'testers preferred the redesign'],
      ['+40%', 'sign-up intent after browsing'],
      ['1', 'defensible point of view, end to end'],
    ],
    reflection:
      'Run as the real, sometimes-messy process of moving from a vague hunch to a defensible design, not a polished after-the-fact story.',
  },
];

export const about = {
  headline: 'Hi, I’m Yuichi.',
  body: [
    'I grew up in Okinawa, studied HCI at UC Irvine, and live in San Francisco. I like problems where something powerful is hard to use: blockchain contracts, VR, and now AI tools. My job is finding the version that makes sense the first time you touch it, and more and more, I build that version myself.',
    'Growing up around Japanese craft left me with one simple belief: everyday things should be a quiet pleasure to use.',
  ],
  human:
    'Tools that write code keep getting better. Deciding what’s worth building, and how it should feel in someone’s hands, is still a human job. That’s the part I care about most.',
  pillars: [
    ['Make it make sense', 'I untangle messy problems until the flow feels obvious on first use.'],
    ['Sweat the details', 'Readable type, fast pages, and motion that helps instead of showing off.'],
    ['Ship it', 'I take ideas from a sketch to working code, and I’m happy in the repo next to engineers.'],
  ],
  timeline: [
    ['2026', 'Allsquare', 'Designed and built a bill splitter with no sign up. Live at all-sqr.com.'],
    ['2023-24', 'mahola at Crypto Garage', 'Enterprise Web3 tools: no-code contract creation and real-time transaction analysis.'],
    ['2022', 'Netflix UI/UX Bootcamp', 'Foundational and Advanced tracks, a full year of human-centered research and design methods. The origin of the Netflix case study.'],
    ['2022', 'SnowX VR marketplace', 'First 3D NFT marketplace on VR. JETRO recognition, TechCrunch showcase.'],
    ['2019-21', 'B.S. Informatics, UC Irvine', 'Human-Computer Interaction focus, Donald Bren School of ICS.'],
    ['origin', 'Okinawa, Japan', 'Island-raised. Slow thinking. Long perspective. Bilingual from the start.'],
  ],
  languages: ['Japanese (native)', 'English (native)', 'Tagalog (conversational)'],
  skills: [
    'Product strategy',
    'Interaction design',
    'UX research',
    'Prototyping',
    'Design systems',
    'Figma',
    'VR / spatial UX',
    'React + TypeScript',
    'WebGL / GLSL',
  ],
};



// Things designed and built end to end. Shown in the Work sheet, after the case studies.
export const built = {
  headline: 'Things I designed and then built myself.',
  intro: 'Both are live. I did the design and wrote the code.',
  items: [
    {
      title: 'yuichiokuhama.com',
      desc: 'The site you’re on. One badge on a lanyard that you can grab and swing, and every line on it opens a page. I modeled the card in Blender and draw it with three.js. The colors come from photos of 19th century bingata robes from Okinawa.',
      stack: ['three.js', 'Blender', 'Vite', 'GitHub Pages'],
      links: [
        ['live', 'https://yuichiokuhama.com'],
      ],
    },
    {
      title: 'Allsquare',
      desc: 'Multi-currency group bill splitter with no sign-up: the shared link is the credential. Designed and built solo, from the passport-stamp identity and component library down to the minimal-transfer settlement engine. Live in production.',
      stack: ['PWA', 'Solo build', 'Live product'],
      links: [['live', 'https://all-sqr.com']],
    },
  ],
  craft: {
    title: 'how this site is made',
    points: [
      'Built around 引き算, the Japanese idea of making something better by taking things away. One object on the page, four colors, one typeface.',
      'No framework. The swing is a small physics sim of a few rope points and a rigid card, not a physics engine.',
      'The card and clip are modeled in Blender from a script, not by hand.',
      'Holds still if your system asks for reduced motion.',
      'Every line on the badge is also a real button, so it works with a keyboard and a screen reader, and without WebGL.',
    ],
  },
};

// Smaller projects — shipped fast, no full case study. Add `link` when ready.
export const sideProjects = [
  {
    title: 'SociaLens',
    kind: 'hackathon',
    desc: 'A social shopping app in VR, prototyped at ETH Mexico 2022. Won 2 sponsor awards.',
    link: '',
  },
  {
    title: 'XrossLend',
    kind: 'hackathon',
    desc: 'Lend and rent NFTs across chains. I designed the core flows with 3 developers at ETH NYC 2022. Won 6 sponsor awards.',
    link: '',
  },
  {
    title: 'Halfway to Home Dog Rescue',
    kind: 'redesign',
    desc: 'A redesign I took on myself for a dog rescue’s site, with fewer dead ends between pages and a clearer path to finding a dog.',
    link: '',
  },
];
