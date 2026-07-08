// ─────────────────────────────────────────────────────────────
// EDIT ME — all site copy lives in this one file.
// Fix any detail here and the whole site updates.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Yuichi Okuhama',
  handle: 'yuichi',
  role: 'Product Designer',
  tagline: 'Design that makes complex things feel inevitable.',
  location: 'San Francisco',
  intro:
    'I take vague, complicated problems — in AI, blockchain, developer tools — and find the version that feels obvious. The goal is always the same: software people understand the moment they touch it.',
  email: 'yuokuhama@gmail.com',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/yokuhama/' },
    { label: 'GitHub', url: 'https://github.com/yuichi-9621' },
    { label: 'Email', url: 'mailto:yuokuhama@gmail.com' },
  ],
};

// Full case studies, structured by the Double Diamond.
export const projects = [
  {
    id: 'snowx',
    index: '01',
    title: 'SnowX — 3D NFT Marketplace in VR',
    org: 'SnowX',
    year: '2021',
    tags: ['VR', 'Zero-to-One', 'Web3'],
    summary:
      'The first 3D NFT marketplace built for virtual reality. I led product design from zero to launch — recognized by JETRO, showcased at TechCrunch.',
    meta: [
      ['role', 'Lead Product Designer'],
      ['timeline', '2021 · 6 months'],
      ['team', '2 designers · 4 engineers · PM'],
      ['platform', 'Oculus / SideQuest VR'],
    ],
    lede: 'In 2021, every NFT marketplace looked the same: a grid of thumbnails, a price, a "connect wallet" button. SnowX asked a different question — what if you could stand inside a gallery instead of scrolling past one?',
    quote: '“We weren’t designing a store. We were designing a place.”',
    phases: [
      {
        name: 'discover',
        mode: 'diverge',
        heading: 'Listening before designing',
        body: 'I started where I always start: with people, not pixels. We ran 14 user interviews across two groups that almost never overlap — seasoned VR users who had never touched crypto, and NFT collectors who had never owned a headset. The gap between them was the whole project.',
        points: [
          'VR-native users got motion sick from the floating menus other Web3 apps used in headset.',
          'NFT collectors couldn’t tell what they actually owned once an asset was “in a room.”',
          'Both groups distrusted wallet connection flows — the single biggest drop-off point.',
        ],
      },
      {
        name: 'define',
        mode: 'converge',
        heading: 'Narrowing to the real problem',
        body: 'How might we let people buy and own 3D NFTs with total confidence, inside an immersive space that feels comfortable to first-time VR users and trustworthy to first-time collectors?',
        points: [
          'Persona: Mika, 27, VR native — “I love being inside things. I just don’t want to do my taxes while I’m in there.”',
          'Persona: Daniel, 34, collector — “If I can’t verify what I own, it’s not an asset. It’s a screenshot.”',
        ],
      },
      {
        name: 'develop',
        mode: 'diverge',
        heading: 'Designing the way out of the spreadsheet',
        body: 'We explored three spatial metaphors — museum, bazaar, personal vault — prototyped in Figma, then grey-boxed in Unity so we could feel them in headset. A layout that reads fine on a monitor can be nauseating at 1:1 scale.',
        points: [
          'Diegetic UI: every control lived on a physical-feeling object — no floating panels.',
          'Ownership as light: NFTs you owned glowed warm; others were cool-toned.',
          'Wallet flow before entry: finance friction moved to a calm antechamber, so gas fees never broke immersion.',
        ],
      },
      {
        name: 'deliver',
        mode: 'converge',
        heading: 'Shipping & what it earned',
        body: 'We launched on SideQuest. The product was acknowledged by JETRO (the Japanese government’s trade organization) and showcased at TechCrunch — validating the bet that immersion could make Web3 feel human.',
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
      'SnowX taught me that the hardest part of emerging tech isn’t the technology — it’s translation. A great interface doesn’t ask people to learn a new mental model. It meets them inside the one they already have, and quietly does the hard work underneath.',
  },
  {
    id: 'mahola',
    index: '02',
    title: 'mahola — Enterprise Blockchain, No Code',
    org: 'Crypto Garage',
    year: '2022',
    tags: ['B2B', 'No-Code', 'Enterprise'],
    summary:
      'A no-code contract builder and real-time transaction analysis platform. Business teams deployed and monitored blockchain infrastructure without an engineer in the loop.',
    meta: [
      ['role', 'Product Designer (end-to-end)'],
      ['timeline', '2022 · 8 months'],
      ['context', 'Crypto Garage · Enterprise B2B'],
      ['surface', 'Web dashboard + no-code builder'],
    ],
    lede: 'Crypto Garage’s enterprise clients — banks, logistics firms, payment companies — wanted blockchain without hiring smart-contract engineers. Business teams understood exactly what they needed the chain to do; they just had no way to express it.',
    quote: '“The challenge wasn’t simplifying blockchain. It was respecting how much these teams already knew — about everything except the chain.”',
    phases: [
      {
        name: 'discover',
        mode: 'diverge',
        heading: 'Sitting with the people who’d use it',
        body: 'Contextual interviews with 9 enterprise stakeholders across three client companies, shadowing real workflows — plus a heuristic evaluation of the three tools they were stitching together, scored against Nielsen’s heuristics.',
        points: [
          'Visibility of system status failed everywhere — no human-readable confirmation a contract worked.',
          'Error prevention was nonexistent — a mistyped address meant irreversible loss.',
          'The language was all “gas, nonce, ABI” — nothing mapped to a business concept.',
        ],
      },
      {
        name: 'define',
        mode: 'converge',
        heading: 'From chaos to a single question',
        body: 'How might we let a non-technical business team create, deploy, and monitor smart contracts with the same confidence they’d have configuring any enterprise SaaS tool — no code, no fear of irreversible mistakes?',
        points: [
          'Persona: Rina, 38, operations lead — “I know the business rule perfectly. I just can’t write it in a language the chain understands.”',
          'Card sorting with 5 participants collapsed 40+ features into three mental models: Build, Deploy, Monitor.',
        ],
      },
      {
        name: 'develop',
        mode: 'diverge',
        heading: 'The no-code contract builder',
        body: 'I designed and tested three interaction models. The freeform canvas tested beautifully with engineers and terrified everyone else. The guided, step-based flow won because it removed the fear of the blank page.',
        points: [
          'Plain-language preview: “This contract will release ¥X when Y is confirmed” — before deployment.',
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
      'mahola is the project I point to when someone asks what kind of designer I am. Collapsing fragmented, intimidating tools into a single thing that feels obvious — powerful underneath, calm on the surface, defensible to the business. That balance is the whole job.',
  },
  {
    id: 'netflix',
    index: '03',
    title: 'Netflix NMHP — Homepage Redesign',
    org: 'Self-initiated case study',
    year: 'Case study',
    tags: ['Double Diamond', 'UX Research', 'Consumer'],
    summary:
      'A complete Double Diamond run in the open: redesigning the non-member homepage so potential subscribers can see the unique stories only Netflix tells — before being asked to pay.',
    meta: [
      ['role', 'Solo — research to prototype'],
      ['timeline', 'Multi-week case study'],
      ['method', 'Double Diamond, end-to-end'],
      ['tools', 'Figma · card sorting · heuristics'],
    ],
    lede: 'Netflix’s non-member homepage leads with plans and pricing — asking for commitment before it earns desire. Its strongest asset, a library of originals you can’t watch anywhere else, is invisible until after you’ve paid.',
    quote: '“You can’t ask someone to commit to a relationship before you’ve shown them why you’re worth it.”',
    phases: [
      {
        name: 'discover',
        mode: 'diverge',
        heading: 'Finding the real friction',
        body: 'A structured heuristic evaluation against Nielsen’s ten heuristics, plus interviews with 6 people who had cancelled or never subscribed — to find the emotional barrier, not just the functional one.',
        points: [
          'The page spoke in plans and tiers; users spoke in “is there anything I actually want to watch?”',
          'Key insight: curiosity → paywall → lost curiosity. The page killed desire at the exact moment it should have built it.',
        ],
      },
      {
        name: 'define',
        mode: 'converge',
        heading: 'A persona and a sharp problem',
        body: 'How might we help non-members discover the unique stories only Netflix offers — building genuine desire to subscribe — before the page ever asks for a commitment?',
        points: [
          'Persona: Sam, 29, curious skeptic — “I’m not paying just to find out if there’s anything I’d actually watch.”',
        ],
      },
      {
        name: 'develop',
        mode: 'diverge',
        heading: 'Architecture, then interface',
        body: 'An open card sort showed people group streaming content by mood and exclusivity, not genre. I rebuilt the sitemap to lead with discovery, then used style tiles to settle the visual language before any high-fidelity comps.',
        points: [
          'Core move: an “Only on Netflix” discovery rail above the fold.',
          'One gentle sign-up prompt — after curiosity had been earned.',
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
      'Run as the real, sometimes-messy process of moving from a vague hunch to a defensible design — not a polished after-the-fact story.',
  },
];

export const about = {
  headline: 'I design for humans, not screens.',
  body: [
    'Okinawa-raised, San Francisco-based. I design AI experiences, blockchain platforms, and developer tools — products where five tools got stitched together and someone has to make it feel like one.',
    'Japanese craft taught me that everyday objects should be a quiet pleasure to use. So I sit with the problem first, then find the version that feels simple. Not dumbed down — clear, and worth keeping.',
  ],
  human:
    'AI can generate screens. It can’t sit in a room with a logistics manager, notice what she’s afraid of, and design the guardrail that lets her trust an irreversible system. The more software machines write, the more the human parts — taste, judgment, translation, care — become the work. That’s the part I do.',
  pillars: [
    ['Mental models', 'Untangling vague problems into the most accessible flow — so people get value on first touch.'],
    ['Craft + business', 'Pixel-level care, balanced against speed and the bottom line. Pretty UI that also ships and pays off.'],
    ['End to end', 'Idea → UX → pixel-perfect execution, driven to the ship line alongside engineers.'],
    ['Designer who codes', 'I build, not just spec. This site is hand-written — shaders included.'],
  ],
  timeline: [
    ['now', 'Creative tech events', 'Curating a series at the intersection of design, AI, and emerging technology in San Francisco.'],
    ['2023', 'Headless API product design', 'Led design on a headless API product for B2B blockchain clients; advising on platform strategy.'],
    ['2022', 'mahola at Crypto Garage', 'Enterprise Web3 tools — no-code contract creation and real-time transaction analysis.'],
    ['2021', 'SnowX VR marketplace', 'First 3D NFT marketplace on VR. JETRO recognition, TechCrunch showcase.'],
    ['2019–21', 'B.S. Informatics, UC Irvine', 'Human-Computer Interaction focus. Career Officer at the Japanese Student Association.'],
    ['origin', 'Okinawa, Japan', 'Island-raised. Slow thinking. Long perspective. Bilingual from the start.'],
  ],
  skills: [
    'Product strategy',
    'Interaction design',
    'UX research',
    'Prototyping',
    'Design systems',
    'Figma',
    'VR / spatial UX',
    'Front-end collaboration',
  ],
};

export const events = {
  headline: 'Shaping the conversation.',
  body: [
    'I run a recurring creative tech event series in San Francisco — bringing together designers, founders, and technologists exploring what design means when AI is doing half the work.',
    'Not panels. Not pitches. Real conversations about where things are going, with the people building them.',
  ],
  themes: [
    ['01', 'Design × AI', 'When intelligence becomes a design material'],
    ['02', 'Blockchain UX', 'Making decentralized systems feel human'],
    ['03', 'Emerging interfaces', 'VR, spatial computing, and what’s next'],
    ['04', 'Cross-cultural design', 'Building for a world that isn’t one market'],
  ],
};

export const process = {
  headline: 'How I get from fog to shipped.',
  intro:
    'Every 0→1 project above ran on the Double Diamond: diverge to understand, converge on the real problem, diverge on solutions, converge on the one worth shipping. In practice it’s messy — you loop back, re-open questions, re-converge. That back-and-forth isn’t failure; it’s the method working.',
  diagram: String.raw`
    DISCOVER · DEFINE               DEVELOP · DELIVER
    diverge ⇄ converge              diverge ⇄ converge

            /\                              /\
           /  \                            /  \
          /    \                          /    \
problem ⇄       ⇄  the real              ⇄      ⇄  worth
          \    /   problem                \    /   shipping
           \  /                            \  /
            \/                              \/

    research &      one sharp       prototype &     ship &
    interviews      question        test in situ    measure

    (the arrows go both ways on purpose — real process loops back)`,
  steps: [
    ['discover', 'Interviews, shadowing, heuristic audits. Sit with the problem before touching pixels.'],
    ['define', 'One sharp problem statement and a persona the whole team can hold in their heads.'],
    ['develop', 'Multiple directions, prototyped where the product actually lives — in headset, in dashboard, in hand.'],
    ['deliver', 'Ship, measure, and carry the lesson forward.'],
  ],
};

// Smaller projects — shipped fast, no full case study. Add `link` when ready.
export const sideProjects = [
  {
    title: 'SociaLens',
    desc: 'VR social commerce app — unique discovery features, prototyped and delivered. 2 awards from sponsors of ETH Mexico Global Hackathon 2022.',
    tags: ['VR', 'Hackathon', '2 awards'],
    link: '',
  },
  {
    title: 'XrossLend',
    desc: 'Lend and rent NFTs across chains. Designed the core flows alongside 3 developers. 6 awards from sponsors of ETH NYC Global Hackathon 2022.',
    tags: ['Web3', 'Hackathon', '6 awards'],
    link: '',
  },
  {
    title: 'Halfway to Home Dog Rescue',
    desc: 'Self-initiated redesign of a dog-rescue site — cutting bounce between pages and smoothing the path to finding your favorite furry friend.',
    tags: ['Case study', 'Nonprofit'],
    link: '',
  },
];

// Lines printed by the boot sequence in the hero terminal.
export const bootLines = [
  'yuichi@portfolio:~$ ./init --mode=liquid',
  'mounting /okinawa .............. ok',
  'brewing sanpin tea ............. ok',
  'aligning to the 8pt grid ....... ok',
  'kerning feelings ............... ok',
  'unread figma comments (47) ..... ignored',
  'ready. (yes, it’s in the latest file. promise.)',
];
