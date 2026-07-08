// ─────────────────────────────────────────────────────────────
// EDIT ME — all site copy lives in this one file.
// Fix any detail here and the whole site updates.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Yuichi Okuhama',
  handle: 'yuichi',
  role: 'Product Designer',
  tagline: 'I design products that feel alive.',
  location: 'San Francisco Bay Area',
  intro:
    'Product designer working across VR, blockchain and consumer products — from zero-to-one launches to enterprise tools. I care about how things feel, not just how they look.',
  email: 'yuokuhama@gmail.com',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/yuichi-okuhama-b6aa44179' },
    { label: 'GitHub', url: 'https://github.com/yuichi-9621' },
    { label: 'Email', url: 'mailto:yuokuhama@gmail.com' },
  ],
};

export const projects = [
  {
    id: 'vr-marketplace',
    index: '01',
    title: 'VR Marketplace for 3D Art',
    org: 'Potlatch',
    year: '—',
    tags: ['VR', 'Zero-to-One', 'Marketplace'],
    summary:
      'Launched the first version of a VR marketplace for 3D NFT art on SideQuest. Acknowledged by JETRO (Japanese government) and showcased at TechCrunch.',
    details: [
      'Designed the full spatial UX for browsing and collecting 3D art in VR.',
      'Shipped v1 to SideQuest and iterated from real user feedback.',
      'Selected by JETRO and presented at TechCrunch.',
    ],
    link: '',
  },
  {
    id: 'crypto-garage',
    index: '02',
    title: 'No-Code Contract Tools',
    org: 'Crypto Garage',
    year: '—',
    tags: ['Enterprise', 'Blockchain', 'B2B'],
    summary:
      'Designed a no-code contract creation feature and a real-time transaction analysis tool, giving enterprise clients streamlined blockchain deployment and monitoring.',
    details: [
      'Turned developer-only smart-contract workflows into a guided no-code flow.',
      'Designed real-time dashboards for monitoring on-chain transactions.',
      'Shipped for enterprise clients with security-critical constraints.',
    ],
    link: '',
  },
  {
    id: 'netflix-study',
    index: '03',
    title: 'Netflix Non-Member Homepage',
    org: 'Self-initiated case study',
    year: '—',
    tags: ['Case Study', 'Double Diamond', 'Consumer'],
    summary:
      'A self-initiated case study applying double-diamond thinking: a concept letting potential subscribers preview the unique shows Netflix offers, right on the non-member homepage.',
    details: [
      'Framed the problem with double-diamond discovery and definition.',
      'Prototyped a browsable preview of Netflix originals for logged-out visitors.',
      'Validated the concept with lightweight user research.',
    ],
    link: '',
  },
];

export const about = {
  now: 'Product Designer at SnowX.',
  before: [
    'UX Designer at Potlatch — launched a VR marketplace for 3D NFT art.',
    'Crypto Garage — enterprise blockchain product design.',
    'UX Designer / Community Manager at DG717, San Francisco.',
  ],
  skills: [
    'Product strategy',
    'Interaction design',
    'Prototyping',
    'User research',
    'Design systems',
    'Figma',
    'VR / spatial UX',
    'Front-end collaboration',
  ],
};

// Lines printed by the boot sequence in the hero terminal.
export const bootLines = [
  'yuichi@portfolio:~$ ./init --mode=liquid',
  'loading design systems ......... ok',
  'compiling shaders .............. ok',
  'calibrating feel ............... ok',
  'ready.',
];
