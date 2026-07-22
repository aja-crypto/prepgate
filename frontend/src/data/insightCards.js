function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const INSIGHT_CARDS = [
  { title: 'Highest Closing Scores', desc: 'View the highest GATE scores accepted at top IITs, NITs, and IISc across programmes.', icon: '📈', link: `/insights/topic/${slugify('Highest Closing Scores')}` },
  { title: 'Safest IIT Programmes', desc: 'Discover programmes with the lowest closing ranks — your best shot at an IIT.', icon: '🎯', link: `/insights/topic/${slugify('Safest IIT Programmes')}` },
  { title: 'Top NIT Placements', desc: 'Compare placement packages across NITs to find the best return on investment.', icon: '🏆', link: `/insights/topic/${slugify('Top NIT Placements')}` },
  { title: 'Best ROI Colleges', desc: 'Which colleges offer the best combination of low fees and high placements?', icon: '💰', link: `/insights/topic/${slugify('Best ROI Colleges')}` },
  { title: 'Category Trends', desc: 'Analyze opening and closing rank trends across categories for past 3 years.', icon: '📊', link: `/insights/topic/${slugify('Category Trends')}` },
  { title: 'AI & Data Science Demand', desc: 'See which specializations in AI/DS are seeing the highest demand and lowest ranks.', icon: '🤖', link: `/insights/topic/${slugify('AI & Data Science Demand')}` },
  { title: 'Most Competitive Specializations', desc: 'Identify specializations with the toughest competition based on closing ranks.', icon: '📚', link: `/insights/topic/${slugify('Most Competitive Specializations')}` },
  { title: 'Counselling Timeline', desc: 'Complete timeline of CCMT, COAP, and institute-specific counselling processes.', icon: '📅', link: `/insights/topic/${slugify('Counselling Timeline')}` },
];
