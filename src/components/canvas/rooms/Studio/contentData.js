/**
 * Projects room content.
 *
 * Each entry becomes one screen on the tower in the Projects room. They are
 * grouped by where the work was done, because the story of each is different:
 * a product I own, a product I shipped inside a team, and a high-volume build
 * shop where the interesting problem was throughput.
 */

// TODO(prabhav): confirm these before launch — Project Rankup in particular.
// Cadence Pro work is internal, so those entries deliberately carry no link.
const RANKUP_URL = 'https://projectrankup.com';
const HIREQUOTIENT_URL = 'https://www.hirequotient.com';

export const PLATFORM_CONFIG = {
    rankup: {
        color: '#35c8f5',
        accentColor: '#7fd2f2',
        icon: '◆',
        label: 'Project Rankup',
        shape: 'monitor',
    },
    cadencepro: {
        color: '#ffb454',
        accentColor: '#ffc97a',
        icon: '▣',
        label: 'Cadence Pro',
        shape: 'tv',
    },
    hirequotient: {
        color: '#56d9a3',
        accentColor: '#7fe4bb',
        icon: '▲',
        label: 'HireQuotient',
        shape: 'monitor',
    },
};

const RAW_CONTENT_DATA = [
    // ===================== PROJECT RANKUP =====================
    // Founder & Product Engineer, Mar 2026 – present.
    {
        id: 'rs-001',
        platform: 'rankup',
        title: 'AI SEO Automation Platform',
        description:
            'Founded and built Project Rankup end to end — Next.js, React, Node.js, PostgreSQL and LLM APIs — automating keyword research, content generation and publishing as a single pipeline.',
        url: RANKUP_URL,
        date: '2026-03-01',
    },
    {
        id: 'rs-002',
        platform: 'rankup',
        title: 'Agent-based Content Pipelines',
        description:
            'Multi-step agents that draft blogs, metadata, FAQs and internal links, then hand off for review. Cut manual content production effort by more than 80%.',
        url: RANKUP_URL,
        date: '2026-04-01',
    },
    {
        id: 'rs-003',
        platform: 'rankup',
        title: 'Product Architecture & Infrastructure',
        description:
            'Designed and deployed the whole system — authentication, analytics, billing and cloud infrastructure — now running for several beta customers.',
        url: RANKUP_URL,
        date: '2026-05-01',
    },
    {
        id: 'rs-004',
        platform: 'rankup',
        title: 'Keyword Research Engine',
        description:
            'Clusters search intent and maps it onto a publishing calendar, so generated content ladders up to a strategy instead of being one-off posts.',
        url: RANKUP_URL,
        date: '2026-06-01',
    },

    // ===================== CADENCE PRO =====================
    // Software Engineer, Mar 2025 – May 2026. Internal product, no public link.
    {
        id: 'cp-001',
        platform: 'cadencepro',
        title: 'Flagship AI Chatbot Rebuild',
        description:
            'Rebuilt the company chatbot in React, TypeScript and Tailwind around a reusable component architecture, cutting UI development effort and making the surface maintainable.',
        url: null,
        date: '2025-06-01',
    },
    {
        id: 'cp-002',
        platform: 'cadencepro',
        title: 'Slack & GitHub Integrations',
        description:
            'OAuth, webhooks and REST integrations that put the chatbot where engineers already were, rather than asking them to visit another tab.',
        url: null,
        date: '2025-09-01',
    },
    {
        id: 'cp-003',
        platform: 'cadencepro',
        title: 'Trie-backed Mentions & Autocomplete',
        description:
            'Real-time mention search over a trie, so suggestions stayed instant as the workspace grew instead of degrading with a linear scan.',
        url: null,
        date: '2025-12-01',
    },
    {
        id: 'cp-004',
        platform: 'cadencepro',
        title: 'Multi-agent Planning Workflows',
        description:
            'Project-planning workflows on LangGraph and LangChain — agents that decompose a goal into tasks and reconcile them against work already in flight.',
        url: null,
        date: '2026-03-01',
    },

    // ===================== HIREQUOTIENT =====================
    // Frontend / MERN intern, Jun 2024 – Feb 2025.
    {
        id: 'hq-001',
        platform: 'hirequotient',
        title: 'AI Resume Builder',
        description:
            'One of the highest-traffic products in the suite — React and Next.js on the front, OpenAI APIs behind it, built to survive a large and unpredictable load.',
        url: HIREQUOTIENT_URL,
        date: '2024-08-01',
    },
    {
        id: 'hq-002',
        platform: 'hirequotient',
        title: '60+ AI-powered Web Applications',
        description:
            'Built and maintained a large catalogue of tools on React, Next.js, Node.js and MongoDB, where the engineering problem was consistency and speed of delivery.',
        url: HIREQUOTIENT_URL,
        date: '2024-10-01',
    },
    {
        id: 'hq-003',
        platform: 'hirequotient',
        title: 'SEO Content Tooling',
        description:
            'Content tools built during a period when organic traffic grew from 40K to 800K monthly visits.',
        url: HIREQUOTIENT_URL,
        date: '2024-12-01',
    },
    {
        id: 'hq-004',
        platform: 'hirequotient',
        title: 'Strapi CMS & Shared Frontend Architecture',
        description:
            'Introduced a CMS and a reusable component layer across the product family, reducing feature development time by roughly 35%.',
        url: HIREQUOTIENT_URL,
        date: '2025-01-01',
    },
];

// Screen faces are handed out round-robin per platform so neighbouring screens
// in the tower don't repeat the same image.
const SCREEN_TEXTURES = {
    rankup: ['/textures/studio/monitorfront_postnafbdoublewinner.webp'],
    cadencepro: [
        '/textures/studio/tvfront_filmikprojektdlamultiego.webp',
        '/textures/studio/tvfront_filmikedytowaniezdjec.webp',
    ],
    hirequotient: ['/textures/studio/monitorfront_postnafbdoublewinner.webp'],
};

const paintedOf = (path) => path.replace('.webp', '_painted.webp');

const cursors = { rankup: 0, cadencepro: 0, hirequotient: 0 };

export const CONTENT_DATA = RAW_CONTENT_DATA.map((item) => {
    const pool = SCREEN_TEXTURES[item.platform];
    const texture = pool[cursors[item.platform]++ % pool.length];
    return {
        ...item,
        thumbnail: item.thumbnail ?? null,
        frontTexture: item.frontTexture || texture,
        paintedFrontTexture: item.paintedFrontTexture || paintedOf(texture),
    };
});

export const getContentByPlatform = (platform) =>
    platform === 'all' ? CONTENT_DATA : CONTENT_DATA.filter((item) => item.platform === platform);

export const getLatestContent = () =>
    [...CONTENT_DATA].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
