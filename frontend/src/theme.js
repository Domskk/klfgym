export const C = {
  bgPrimary:'#0a0a0a', bgSecondary:'#111111', bgTertiary:'#181818', bgHover:'#1a1a1a',
  border:'#1e1e1e', borderMid:'#2a2a2a',
  gold:'#F0C040', goldDark:'#d4a830', goldFaint:'rgba(240,192,64,0.12)', goldBg:'#1a1a00',
  textPrimary:'#ffffff', textSecondary:'#aaaaaa', textMuted:'#555555',
  green:'#5aaa5a', greenBg:'#0f1f0f', greenBorder:'#2a5a2a',
  red:'#aa5a5a', redBg:'#1f0f0f', redBorder:'#5a2a2a',
  orange:'#e07020', orangeBg:'#1a0a00', orangeBorder:'#5a3010',
  blue:'#4a9af0', blueBg:'#0f1a2a',
};
export const T = { display:"'Bebas Neue', cursive", body:"'DM Sans', sans-serif" };

export const pillStyles = {
  active:   { bg:'#0f1f0f', color:'#5aaa5a', border:'#2a5a2a' },
  expiring: { bg:'#1a1a00', color:'#F0C040', border:'rgba(240,192,64,0.4)' },
  expired:  { bg:'#1f0f0f', color:'#aa5a5a', border:'#5a2a2a' },
  risk:     { bg:'#1a0a00', color:'#e07020', border:'#5a3010' },
  info:     { bg:'#0f1a2a', color:'#4a9af0', border:'#1a3a5a' },
};

export const TRAINERS_DATA = [
  { id:1, initials:'MC', name:'Marco Cruz',   role:'Strength Training Coach', clients:12, status:'On Session', email:'marco@ironpeak.com' },
  { id:2, initials:'SR', name:'Sofia Reyes',  role:'Weight Loss Coach',       clients:8,  status:'Available',  email:'sofia@ironpeak.com' },
  { id:3, initials:'JL', name:'Jake Lim',     role:'Fitness & Cardio Coach',  clients:10, status:'On Session', email:'jake@ironpeak.com' },
  { id:4, initials:'AM', name:'Ana Mendoza',  role:'Yoga Instructor',         clients:6,  status:'Available',  email:'ana@ironpeak.com' },
  { id:5, initials:'RP', name:'Rico Padilla', role:'Nutrition & Lifestyle',   clients:5,  status:'Available',  email:'rico@ironpeak.com' },
  { id:6, initials:'BT', name:'Ben Torres',   role:'Powerlifting Coach',      clients:7,  status:'Available',  email:'ben@ironpeak.com' },
];

export const MEMBERS_DATA = [
  { id:1, name:'Maria Santos',   plan:'Monthly',   status:'active',   sessions:12, risk:10 },
  { id:2, name:'Jason Cruz',     plan:'Quarterly', status:'expiring', sessions:8,  risk:45 },
  { id:3, name:'Lea Gomez',      plan:'Monthly',   status:'risk',     sessions:2,  risk:88 },
  { id:4, name:'Diego Reyes',    plan:'Monthly',   status:'active',   sessions:18, risk:5  },
  { id:5, name:'Ana Villanueva', plan:'Quarterly', status:'expired',  sessions:0,  risk:95 },
  { id:6, name:'Paulo Torres',   plan:'Monthly',   status:'risk',     sessions:3,  risk:75 },
];

export const EVENTS_DATA = [
  { id:1, type:'class', title:'Zumba Fitness Class',        date:'March 20, 2026 · 7:00 AM – 8:00 AM',   info:'Instructor: Ana Mendoza · 12 slots left' },
  { id:2, type:'class', title:'Morning Yoga Session',       date:'March 22, 2026 · 6:00 AM – 7:00 AM',   info:'Instructor: Ana Mendoza · 8 slots left'  },
  { id:3, type:'promo', title:'Summer Membership Deal',     date:'Starts March 25 · Ends April 10, 2026', info:'20% off on all monthly plans'            },
  { id:4, type:'event', title:'Iron Peak Fitness Challenge', date:'April 5, 2026 · All Day',               info:'Open to all active members · Prizes await'},
];

export const INVENTORY_DATA = [
  { id:1, name:'Treadmill',          category:'Cardio',       qty:6,  condition:'Good'         },
  { id:2, name:'Cable Machine',      category:'Machines',     qty:4,  condition:'Needs Repair'  },
  { id:3, name:'Barbell Set (20kg)', category:'Free Weights', qty:10, condition:'Good'          },
  { id:4, name:'Weight Plates 5kg',  category:'Free Weights', qty:0,  condition:'Out of Stock'  },
  { id:5, name:'Rowing Machine',     category:'Cardio',       qty:3,  condition:'Good'          },
  { id:6, name:'Yoga Mats',          category:'Accessories',  qty:20, condition:'Good'          },
];

export const ANNOUNCEMENTS_DATA = [
  { id:1, type:'Promo',   title:'Summer Membership Discount – 20% Off!', body:'Enjoy 20% off on all monthly membership plans. Valid March 25 – April 10, 2026.', date:'Posted March 16, 2026 · Expires April 10' },
  { id:2, type:'New Trainer', title:'Meet Our New Trainer: Rico Padilla', body:"We're excited to welcome Rico Padilla as our Nutrition & Lifestyle Coach.", date:'Posted March 10, 2026' },
  { id:3, type:'Class',   title:'Zumba Fitness Class – March 20',         body:'Join our Zumba class this March 20, 7:00–8:00 AM with Coach Ana. Only 12 slots!', date:'Posted March 8, 2026' },
];