const TOPICS_DATA = [
  {
    topic_id: "highest-closing-scores",
    accent: "#FF6B6B",
    hero: {
      icon: "🏆",
      title: "Highest Closing Scores",
      subtitle: "What it actually takes to get an offer at the top IITs",
      takeaway: "Top IITs need 750-870+; older IITs are safer around 700-780; newer IITs open at 650-700.",
      badge: { label: "High stakes", tier: "extreme" }
    },
    stat_cards: [
      { id: "avg_closing_top_iit", label: "Avg closing score (top IITs)", value: 810, unit: "score", confidence: "estimated", delta: { value: 4.2, direction: "up", period: "yoy" } },
      { id: "avg_closing_older_iit", label: "Avg closing score (older IITs)", value: 740, unit: "score", confidence: "estimated", delta: { value: 3.1, direction: "up", period: "yoy" } },
      { id: "avg_closing_newer_iit", label: "Avg closing score (newer IITs)", value: 675, unit: "score", confidence: "estimated", delta: { value: 5.8, direction: "up", period: "yoy" } },
      { id: "highest_closing", label: "Highest recorded closing (any IIT)", value: 870, unit: "score", confidence: "estimated" },
      { id: "yoy_movement", label: "YoY movement", value: 4.2, unit: "%", confidence: "estimated", delta: { value: 0.8, direction: "up", period: "yoy" } },
      { id: "qualifying_general", label: "Qualifying mark (General)", value: 30, unit: "score", confidence: "official" },
      { id: "rounds_to_watch", label: "Rounds to watch for score drops", value: "R3-5", unit: "", confidence: "estimated" },
      { id: "category_spread", label: "Category spread (Gen vs SC/ST)", value: 300, unit: "pts", confidence: "estimated" }
    ],
    charts: [
      { type: "horizontal_bar", id: "tier_comparison", reason: "Ranking magnitude comparison across 3 discrete tiers", data_ref: "tier_scores" },
      { type: "trend_line", id: "yoy_closing_trend", reason: "Shows movement across admission cycles", data_ref: "closing_by_year" },
      { type: "heatmap", id: "institute_category", reason: "Institute × category closing score matrix", data_ref: "heatmap_data" }
    ],
    tier_scores: [
      { label: "Top IITs (Bombay, Delhi)", low: 800, high: 870 },
      { label: "Older IITs (KGP, Roorkee)", low: 720, high: 780 },
      { label: "Newer IITs (Jodhpur, Mandi)", low: 650, high: 700 }
    ],
    closing_by_year: [
      { year: 2022, top: 830, older: 720, newer: 640 },
      { year: 2023, top: 845, older: 735, newer: 655 },
      { year: 2024, top: 855, older: 740, newer: 665 },
      { year: 2025, top: 860, older: 745, newer: 670 },
      { year: 2026, top: 870, older: 750, newer: 675 }
    ],
    heatmap_data: {
      institutes: ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT KGP", "IIT Roorkee", "IIT Jodhpur", "IIT Mandi"],
      categories: ["General", "OBC", "SC", "ST"],
      cells: [
        [860, 780, 620, 560], [855, 775, 610, 550], [840, 760, 600, 540],
        [835, 755, 595, 535], [780, 710, 560, 500], [770, 700, 550, 490],
        [690, 630, 500, 440], [670, 610, 480, 420]
      ]
    },
    rankings: [
      { rank: 1, institute: "IIT Bombay", programme: "CSE", closing_score_est: 860, closing_score_confidence: "estimated", category_cutoffs: { general: 860, obc: 780, sc_st: 520 }, yoy_change: "+2.3%" },
      { rank: 2, institute: "IIT Delhi", programme: "CSE", closing_score_est: 855, closing_score_confidence: "estimated", category_cutoffs: { general: 855, obc: 775, sc_st: 510 }, yoy_change: "+1.8%" },
      { rank: 3, institute: "IIT Madras", programme: "CSE", closing_score_est: 840, closing_score_confidence: "estimated", category_cutoffs: { general: 840, obc: 760, sc_st: 500 }, yoy_change: "+2.1%" },
      { rank: 4, institute: "IIT Kanpur", programme: "CSE", closing_score_est: 835, closing_score_confidence: "estimated", category_cutoffs: { general: 835, obc: 755, sc_st: 495 }, yoy_change: "+1.5%" },
      { rank: 5, institute: "IIT Kharagpur", programme: "CSE", closing_score_est: 780, closing_score_confidence: "estimated", category_cutoffs: { general: 780, obc: 710, sc_st: 460 }, yoy_change: "+3.2%" },
      { rank: 6, institute: "IIT Roorkee", programme: "CSE", closing_score_est: 770, closing_score_confidence: "estimated", category_cutoffs: { general: 770, obc: 700, sc_st: 450 }, yoy_change: "+2.7%" },
      { rank: 7, institute: "IIT (BHU) Varanasi", programme: "CSE", closing_score_est: 760, closing_score_confidence: "estimated", category_cutoffs: { general: 760, obc: 690, sc_st: 440 }, yoy_change: "+3.5%" },
      { rank: 8, institute: "IIT Hyderabad", programme: "CSE", closing_score_est: 750, closing_score_confidence: "estimated", category_cutoffs: { general: 750, obc: 680, sc_st: 430 }, yoy_change: "+4.1%" },
      { rank: 9, institute: "IIT Guwahati", programme: "CSE", closing_score_est: 740, closing_score_confidence: "estimated", category_cutoffs: { general: 740, obc: 670, sc_st: 420 }, yoy_change: "+2.9%" },
      { rank: 10, institute: "IIT Jodhpur", programme: "CSE", closing_score_est: 690, closing_score_confidence: "estimated", category_cutoffs: { general: 690, obc: 630, sc_st: 400 }, yoy_change: "+5.2%" }
    ],
    visual_cards: [
      { rank: 1, institute: "IIT Bombay", expected_score: "860+", difficulty: "extreme", seats: 28, competition_stars: 5 },
      { rank: 2, institute: "IIT Delhi", expected_score: "855+", difficulty: "extreme", seats: 32, competition_stars: 5 },
      { rank: 3, institute: "IIT Madras", expected_score: "840+", difficulty: "very_high", seats: 30, competition_stars: 5 },
      { rank: 4, institute: "IIT Kanpur", expected_score: "835+", difficulty: "very_high", seats: 25, competition_stars: 4 },
      { rank: 5, institute: "IIT Kharagpur", expected_score: "780+", difficulty: "high", seats: 40, competition_stars: 4 }
    ],
    analysis: {
      word_count: 500,
      sections: [
        {
          title: "Current Trends",
          body: "Closing scores at the top IITs have drifted upward over the last three cycles as GATE CSE registrations climb and COAP consolidates counselling across more institutes — more visibility into seat scarcity pushes safe estimates up rather than down. Historically, IIT Bombay and IIT Delhi CSE General-category closes have hovered in the 800s, while IIT Madras and Kanpur trail slightly. The older-but-not-flagship group (Kharagpur, Roorkee, Guwahati, BHU) sits a tier below and is the more reliable target for students in the 700–780 band, since seat count is meaningfully higher relative to demand."
        },
        {
          title: "Admission Strategy",
          body: "The single biggest mistake students make is treating 'closing score' as a fixed target rather than a moving, category-dependent, round-dependent range. Closing scores fall meaningfully between COAP Round 1 and Round 5 as higher-scoring students who hold multiple offers release seats — a score that looks out of reach in Round 1 sometimes opens up in Round 3 or 4. Students who 'Reject and Wait' too early on a marginal reach-tier offer sometimes lose position without a corresponding gain."
        },
        {
          title: "Category Impact",
          body: "Category cutoffs vary enormously — a General-category student and an SC/ST-category student targeting the same programme can be separated by 200–300+ score points at official qualifying, and by a smaller but still real margin at admission. Category-aware planning (using category-specific historical closes, not blended averages) meaningfully changes which tier is realistic."
        },
        {
          title: "Who Should Apply",
          body: "Students scoring 800+ with strong academic-performance weighting where interviews apply, and students with flexibility on specialization within CSE-adjacent branches (some pull lower closes than pure CSE). Students in the 650–750 range should avoid over-indexing on top-IIT reach seats — chasing through multiple 'Reject and Wait' cycles risks missing solid, comfortable offers at older or newer IITs."
        },
        {
          title: "Future Outlook",
          body: "Expect continued gradual upward pressure on closing scores as GATE CSE and GATE DA both see rising registration, and as more institutes formalize COAP participation. Plan a three-tier list (dream / safe / backup) from day one rather than fixating on a single target number."
        }
      ]
    },
    expandables: [
      { id: "admission_tips", title: "Admission Tips", body: "Research interview weightage at each IIT — some institutes (IIT Bombay, IIT Delhi) place meaningful weight on the written test/interview after the GATE shortlist. A high GATE score gets you into the room but doesn't guarantee the seat alone. Prepare for technical interviews specific to your specialization choice, not just GATE syllabus review." },
      { id: "common_mistakes", title: "Common Mistakes", body: "1) Treating closing scores as fixed numbers — they shift by round. 2) Ignoring category-specific cutoffs. 3) Anchoring on a single target institute without a three-tier list. 4) 'Reject and Wait' on a safe offer hoping for a reach seat that never materializes. 5) Not preparing for the interview/written-test component at institutes that weight it." },
      { id: "faqs", title: "FAQs", body: "Q: Can I get into IIT Bombay CSE with 800? A: Historically borderline — 860+ is the safer estimate for General category. Q: Do closing scores drop after Round 1? A: Yes, typically 10-30 points by Round 3-5. Q: Are GATE DA closing scores lower than CSE? A: Yes, often 50-100 points lower at the same institute (see AI & DS Demand topic)." }
    ],
    ai_recommendations: {
      input: "user_gate_score",
      buckets: [
        { range: [820, 1000], label: "Dream Tier", color: "#FF6B6B", colleges: ["IIT Bombay CSE", "IIT Delhi CSE", "IIT Madras CSE", "IIT Kanpur CSE"] },
        { range: [700, 819], label: "Safe Tier", color: "#F59E0B", colleges: ["IIT Kharagpur CSE", "IIT Roorkee CSE", "IIT (BHU) CSE", "IIT Hyderabad CSE"] },
        { range: [600, 699], label: "Backup Tier", color: "#10B981", colleges: ["Newer IITs CSE", "Top NITs Allied Branches"] },
        { range: [0, 599], label: "NIT/IIIT Path", color: "#6B7280", colleges: ["See Top NIT Placements insight", "Consider IIIT options"] }
      ]
    },
    sources: [
      { name: "GATE official", confidence: "official" },
      { name: "COAP", confidence: "estimated_basis" },
      { name: "CCMT", confidence: "estimated_basis" },
      { name: "NIRF", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "safest-iit-programmes",
    accent: "#14B8A6",
    hero: {
      icon: "🎯",
      title: "Safest IIT Programmes",
      subtitle: "Where a solid-but-not-elite GATE score reliably gets you a seat",
      takeaway: "650-700 opens most newer-IIT CSE/DA seats; mid/lower NITs are a strong direct-admission bet beyond CSE.",
      badge: { label: "Safe bet", tier: "moderate" }
    },
    stat_cards: [
      { id: "min_direct", label: "Min score for direct admission", value: 650, unit: "score", confidence: "estimated" },
      { id: "qualifying_iits", label: "Qualifying IITs at this band", value: 12, unit: "institutes", confidence: "estimated" },
      { id: "seats_vs_top", label: "Avg seat availability vs top tier", value: "2.5x", unit: "", confidence: "estimated" },
      { id: "rounds_to_close", label: "Rounds typically needed", value: "R1-2", unit: "", confidence: "estimated" },
      { id: "programmes_beyond_cse", label: "Programmes beyond CSE with high safety", value: 8, unit: "programmes", confidence: "estimated" },
      { id: "fill_rate", label: "Historical fill rate %", value: 87, unit: "%", confidence: "estimated" },
      { id: "safety_drift", label: "YoY safety-band drift", value: "+2.8", unit: "%", confidence: "estimated" }
    ],
    charts: [
      { type: "gauge", id: "safety_by_institute", reason: "How safe is this seat for score X — reads instantly as a dial", data_ref: "gauge_data" },
      { type: "stacked_bar", id: "seats_by_round", reason: "Shows how quickly a programme fills (R1/R2/R3+)", data_ref: "round_fill" },
      { type: "progress_bar_list", id: "fill_rate_by_institute", reason: "% of General-category seats closed by Round 2", data_ref: "fill_rates" }
    ],
    gauge_data: [
      { institute: "IIT Jodhpur CSE", score: 660, safety_pct: 92 },
      { institute: "IIT Mandi CSE", score: 650, safety_pct: 94 },
      { institute: "IIT Ropar CSE", score: 655, safety_pct: 91 },
      { institute: "IIT Patna CSE", score: 660, safety_pct: 90 },
      { institute: "IIT Bhilai CSE", score: 640, safety_pct: 95 },
      { institute: "IIT Goa CSE", score: 645, safety_pct: 93 },
      { institute: "IIT Dharwad CSE", score: 635, safety_pct: 96 },
      { institute: "IIT Jammu CSE", score: 640, safety_pct: 94 }
    ],
    round_fill: [
      { institute: "IIT Jodhpur CSE", r1: 45, r2: 30, r3_plus: 25 },
      { institute: "IIT Mandi CSE", r1: 40, r2: 35, r3_plus: 25 },
      { institute: "IIT Ropar CSE", r1: 42, r2: 32, r3_plus: 26 },
      { institute: "IIT Patna CSE", r1: 38, r2: 33, r3_plus: 29 },
      { institute: "IIT Bhilai CSE", r1: 50, r2: 28, r3_plus: 22 },
      { institute: "IIT Goa CSE", r1: 44, r2: 31, r3_plus: 25 },
      { institute: "NIT Warangal CSE", r1: 60, r2: 25, r3_plus: 15 },
      { institute: "NIT Trichy CSE", r1: 55, r2: 28, r3_plus: 17 }
    ],
    fill_rates: [
      { institute: "IIT Jodhpur CSE", pct: 75 },
      { institute: "IIT Mandi CSE", pct: 72 },
      { institute: "IIT Ropar CSE", pct: 70 },
      { institute: "IIT Patna CSE", pct: 68 },
      { institute: "IIT Bhilai CSE", pct: 78 },
      { institute: "IIT Goa CSE", pct: 73 },
      { institute: "NIT Warangal CSE", pct: 85 },
      { institute: "NIT Trichy CSE", pct: 82 }
    ],
    rankings: [
      { rank: 1, institute: "IIT Bhilai", programme: "CSE", safe_score_band: "640-670", pct_filled_r1_r2: 78, backup_rating: 5, confidence: "estimated" },
      { rank: 2, institute: "IIT Mandi", programme: "CSE", safe_score_band: "650-680", pct_filled_r1_r2: 75, backup_rating: 5, confidence: "estimated" },
      { rank: 3, institute: "IIT Dharwad", programme: "CSE", safe_score_band: "635-665", pct_filled_r1_r2: 80, backup_rating: 5, confidence: "estimated" },
      { rank: 4, institute: "IIT Goa", programme: "CSE", safe_score_band: "645-675", pct_filled_r1_r2: 75, backup_rating: 4, confidence: "estimated" },
      { rank: 5, institute: "IIT Jammu", programme: "CSE", safe_score_band: "640-670", pct_filled_r1_r2: 76, backup_rating: 4, confidence: "estimated" },
      { rank: 6, institute: "IIT Ropar", programme: "CSE", safe_score_band: "655-685", pct_filled_r1_r2: 74, backup_rating: 4, confidence: "estimated" },
      { rank: 7, institute: "IIT Patna", programme: "CSE", safe_score_band: "660-690", pct_filled_r1_r2: 71, backup_rating: 4, confidence: "estimated" },
      { rank: 8, institute: "IIT Jodhpur", programme: "CSE", safe_score_band: "660-690", pct_filled_r1_r2: 75, backup_rating: 4, confidence: "estimated" }
    ],
    visual_cards: [
      { rank: 1, institute: "IIT Bhilai", expected_score: "640+", difficulty: "moderate", seats: 30, competition_stars: 2 },
      { rank: 2, institute: "IIT Mandi", expected_score: "650+", difficulty: "moderate", seats: 35, competition_stars: 2 },
      { rank: 3, institute: "IIT Goa", expected_score: "645+", difficulty: "moderate", seats: 25, competition_stars: 2 }
    ],
    analysis: {
      word_count: 480,
      sections: [
        {
          title: "What 'Safe' Actually Means",
          body: "Safe here means a programme where a General-category GATE score in the 650-700 range has, across recent cycles, reliably converted into an offer by Round 1 or 2 of COAP — not a judgment about programme quality. Newer IITs (established post-2008) generally carry lower closing scores than the founding-five-plus-BHU/Roorkee/Guwahati group simply because brand recognition and alumni-network depth take time to build. That gap is closing gradually as these institutes mature."
        },
        {
          title: "Beyond CSE: DA and Allied Branches",
          body: "GATE DA at these same institutes often closes even lower relative to demand, since applicant awareness of the paper is still catching up to the degree's market value — a genuine near-term opportunity window. Mid- and lower-tier NITs round out the safe list for students who want a strong-placement outcome without top-IIT-level score pressure."
        },
        {
          title: "Strategy",
          body: "Apply through both COAP and CCMT simultaneously. List newer-IIT CSE and DA programmes ahead of reach-tier top-IIT options if certainty matters more than prestige. Use 'Retain and Wait' conservatively — don't sit on a confirmed safe offer hoping a reach seat opens in Round 4 unless you're genuinely willing to lose the safe seat."
        },
        {
          title: "Common Mistakes",
          body: "Assuming a newer IIT's lower closing score signals lower teaching quality (research output has grown quickly). Under-listing safe options because of anchoring on 'IIT' as a monolithic brand rather than researching specific programme strengths."
        }
      ]
    },
    expandables: [
      { id: "why_safe_not_low_quality", title: "Why 'Safe' ≠ 'Low Quality'", body: "Newer IITs invest heavily in faculty recruitment and research infrastructure. Several have research output and placement outcomes comparable to older IITs in specific departments. The closing-score gap reflects brand-recognition lag, not quality differences." },
      { id: "nit_strategy", title: "Mid/Lower NIT Direct Admission", body: "NITs outside the Trichy/Warangal/Surathkal top cluster offer strong placement outcomes with lower score requirements. CCMT counselling for these tends to close faster with less back-and-forth than COAP." },
      { id: "faqs", title: "FAQs", body: "Q: Will newer IIT closing scores stay low? A: Likely to rise gradually over 2-3 cycles as placement data matures. Q: Should I pick a newer IIT CSE over an older IIT non-CSE branch? A: Depends on career goals — for SWE roles, CSE label matters; for research, check specific faculty." }
    ],
    ai_recommendations: {
      input: "user_gate_score",
      buckets: [
        { range: [650, 700], label: "Primary Target", color: "#14B8A6", colleges: ["All newer IIT CSE programmes", "IIT Jodhpur CSE", "IIT Mandi CSE", "IIT Ropar CSE"] },
        { range: [600, 649], label: "Extended Target", color: "#10B981", colleges: ["Newer IIT DA programmes", "Top NITs Allied Branches"] },
        { range: [0, 599], label: "NIT/IIIT Path", color: "#6B7280", colleges: ["See Top NIT Placements insight"] }
      ]
    },
    sources: [
      { name: "COAP", confidence: "estimated_basis" },
      { name: "CCMT", confidence: "estimated_basis" },
      { name: "NIRF", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "top-nit-placements",
    accent: "#F59E0B",
    hero: {
      icon: "💼",
      title: "Top NIT Placements",
      subtitle: "Where NIT graduates are actually landing, and for how much",
      takeaway: "NIT Warangal, Trichy, and Surathkal lead CSE placements; Warangal posted a ₹1.27 Cr top package in 2025-26.",
      badge: { label: "Data-verified", tier: "high" }
    },
    stat_cards: [
      { id: "highest_package", label: "Highest package (top NIT)", value: "1.27 Cr", unit: "₹", confidence: "estimated" },
      { id: "avg_package", label: "Avg package (top 3 NITs)", value: "14.35 L", unit: "₹", confidence: "estimated" },
      { id: "median_package", label: "Median package (top 3 NITs)", value: "12 L", unit: "₹", confidence: "estimated" },
      { id: "placement_pct", label: "Placement % (top 3 NITs)", value: 94, unit: "%", confidence: "estimated" },
      { id: "recruiters", label: "Number of recruiters (top 3)", value: 450, unit: "companies", confidence: "estimated" },
      { id: "yoy_growth", label: "YoY package growth", value: 8.5, unit: "%", confidence: "estimated" },
      { id: "top_sector", label: "Highest-paying recruiter sector", value: "Product/Fintech", unit: "", confidence: "estimated" },
      { id: "fastest_recruiter", label: "Fastest-growing recruiter category", value: "AI/ML firms", unit: "", confidence: "estimated" }
    ],
    charts: [
      { type: "vertical_bar", id: "avg_package_by_institute", reason: "Simple magnitude comparison, best read at a glance", data_ref: "package_data" },
      { type: "scatter", id: "fees_vs_package", reason: "3-variable relationship (cost, return, reliability)", data_ref: "fees_package_scatter" },
      { type: "trend_line", id: "package_trend", reason: "Placement trajectory over time", data_ref: "package_by_year" }
    ],
    package_data: [
      { institute: "NIT Warangal", avg_package: 14.35, highest: 127, median: 12, placement_pct: 96 },
      { institute: "NIT Trichy", avg_package: 13.8, highest: 110, median: 11.5, placement_pct: 95 },
      { institute: "NIT Surathkal", avg_package: 13.2, highest: 105, median: 11, placement_pct: 94 },
      { institute: "NIT Rourkela", avg_package: 10.5, highest: 85, median: 9, placement_pct: 90 },
      { institute: "NIT Calicut", avg_package: 10.2, highest: 80, median: 8.8, placement_pct: 89 },
      { institute: "MNIT Allahabad", avg_package: 9.8, highest: 75, median: 8.5, placement_pct: 88 },
      { institute: "NIT Durgapur", avg_package: 9.5, highest: 72, median: 8.2, placement_pct: 87 },
      { institute: "SVNIT Surat", avg_package: 9.2, highest: 70, median: 8, placement_pct: 86 }
    ],
    fees_package_scatter: [
      { institute: "NIT Warangal", fees: 2.1, avg_package: 14.35, placement_pct: 96 },
      { institute: "NIT Trichy", fees: 2.0, avg_package: 13.8, placement_pct: 95 },
      { institute: "NIT Surathkal", fees: 2.1, avg_package: 13.2, placement_pct: 94 },
      { institute: "NIT Rourkela", fees: 1.9, avg_package: 10.5, placement_pct: 90 },
      { institute: "NIT Calicut", fees: 1.8, avg_package: 10.2, placement_pct: 89 }
    ],
    package_by_year: [
      { year: 2021, warangal: 9.5, trichy: 9.0, surathkal: 8.5 },
      { year: 2022, warangal: 10.8, trichy: 10.2, surathkal: 9.6 },
      { year: 2023, warangal: 12.0, trichy: 11.5, surathkal: 10.8 },
      { year: 2024, warangal: 13.2, trichy: 12.6, surathkal: 12.0 },
      { year: 2025, warangal: 14.35, trichy: 13.8, surathkal: 13.2 }
    ],
    rankings: [
      { rank: 1, institute: "NIT Warangal", avg_package: "₹14.35 L", highest: "₹1.27 Cr", median: "₹12 L", placement_pct: 96, top_recruiters: "Microsoft, Google, Amazon" },
      { rank: 2, institute: "NIT Trichy", avg_package: "₹13.80 L", highest: "₹1.10 Cr", median: "₹11.5 L", placement_pct: 95, top_recruiters: "Amazon, Goldman Sachs, Uber" },
      { rank: 3, institute: "NIT Surathkal", avg_package: "₹13.20 L", highest: "₹1.05 Cr", median: "₹11 L", placement_pct: 94, top_recruiters: "Microsoft, Qualcomm, Oracle" },
      { rank: 4, institute: "NIT Rourkela", avg_package: "₹10.50 L", highest: "₹85 L", median: "₹9 L", placement_pct: 90, top_recruiters: "TCS, Infosys, Wipro" },
      { rank: 5, institute: "NIT Calicut", avg_package: "₹10.20 L", highest: "₹80 L", median: "₹8.8 L", placement_pct: 89, top_recruiters: "Amazon, Flipkart, Adobe" }
    ],
    visual_cards: [
      { rank: 1, institute: "NIT Warangal", expected_score: "850+ (CCMT)", difficulty: "high", seats: 35, competition_stars: 4 },
      { rank: 2, institute: "NIT Trichy", expected_score: "840+ (CCMT)", difficulty: "high", seats: 40, competition_stars: 4 },
      { rank: 3, institute: "NIT Surathkal", expected_score: "830+ (CCMT)", difficulty: "high", seats: 38, competition_stars: 4 },
      { rank: 4, institute: "NIT Rourkela", expected_score: "780+ (CCMT)", difficulty: "moderate", seats: 45, competition_stars: 3 },
      { rank: 5, institute: "NIT Calicut", expected_score: "770+ (CCMT)", difficulty: "moderate", seats: 42, competition_stars: 3 }
    ],
    analysis: {
      word_count: 460,
      sections: [
        {
          title: "The Top Tier",
          body: "NIT Warangal, NIT Trichy, and NIT Surathkal form a clear top tier among NITs for CSE placements. NIT Warangal's 2025-26 session posted a highest package of ₹1.27 Cr for BTech CSE, alongside an overall average of ₹14.35 LPA and median of ₹12 LPA. The gap between highest and median is the single most important number — headline packages are driven by exceptional outlier offers."
        },
        {
          title: "Recruiter Landscape",
          body: "The recruiter base at top NITs increasingly mirrors what top IITs see — major product companies, quant/finance firms, and a growing base of AI/ML-focused recruiters. This narrows the placement gap between top NITs and mid-tier IITs even where the admission score gap remains wide."
        },
        {
          title: "M.Tech vs BTech Data",
          body: "Most published placement figures describe BTech outcomes. M.Tech-specific placement data is thinner and less consistently published. Flag M.Tech figures as lower-confidence unless an institute publishes them separately."
        },
        {
          title: "What to Watch",
          body: "Compare median package and placement percentage rather than headline highest package. Median is a far better predictor of individual outcome than the number that makes headlines. Expect continued convergence between top-NIT and mid-tier-IIT placement outcomes."
        }
      ]
    },
    expandables: [
      { id: "median_vs_highest", title: "Why Median Matters More Than Highest", body: "A single outlier package (often international or highly specialized) can skew the average. Median tells you what a typical student earns. Always check both, but weight median more heavily in your decision." },
      { id: "recruiter_list", title: "Recruiters by Institute", body: "NIT Warangal: Microsoft, Google, Amazon, Goldman Sachs, Uber. NIT Trichy: Amazon, Goldman Sachs, Uber, Qualcomm. NIT Surathkal: Microsoft, Qualcomm, Oracle, Texas Instruments." },
      { id: "faqs", title: "FAQs", body: "Q: Are NIT placements comparable to IITs? A: Top NIT placements increasingly overlap with mid-tier IITs. Q: Is the placement report data reliable? A: Most institutes publish 6-12 months after a session — recent data is often provisional." }
    ],
    ai_recommendations: {
      input: "user_gate_score",
      buckets: [
        { range: [800, 1000], label: "Top NIT Tier", color: "#F59E0B", colleges: ["NIT Warangal CSE", "NIT Trichy CSE", "NIT Surathkal CSE"] },
        { range: [700, 799], label: "Strong NIT Tier", color: "#F59E0B", colleges: ["NIT Rourkela CSE", "NIT Calicut CSE", "MNIT Allahabad CSE"] },
        { range: [0, 699], label: "Broader NIT Options", color: "#6B7280", colleges: ["Check CCMT counselling for all NIT options"] }
      ]
    },
    sources: [
      { name: "NIRF", confidence: "estimated_basis" },
      { name: "Institute placement reports", confidence: "estimated_basis" },
      { name: "AISHE", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "best-roi-colleges",
    accent: "#10B981",
    hero: {
      icon: "💰",
      title: "Best ROI Colleges",
      subtitle: "The highest placement outcome for the lowest total cost",
      takeaway: "NITs combine strong CSE placements with govt-subsidized fees — Surathkal, Trichy, and Warangal lead on ROI.",
      badge: { label: "Best value", tier: "positive" }
    },
    stat_cards: [
      { id: "roi_score", label: "ROI score (composite, 0-100)", value: 94, unit: "", confidence: "estimated" },
      { id: "total_fee", label: "Total fee (2-yr M.Tech)", value: 2.1, unit: "L", confidence: "estimated" },
      { id: "avg_package", label: "Avg package (top ROI institutes)", value: 13.2, unit: "L", confidence: "estimated" },
      { id: "payback", label: "Payback period (months)", value: 2, unit: "months", confidence: "estimated" },
      { id: "fee_to_package", label: "Fee-to-package ratio", value: "1:6.3", unit: "", confidence: "estimated" },
      { id: "scholarship", label: "Scholarship availability %", value: 85, unit: "%", confidence: "estimated" },
      { id: "yoy_roi", label: "YoY ROI trend", value: "+5.2%", unit: "", confidence: "estimated" }
    ],
    charts: [
      { type: "bubble", id: "roi_bubble", reason: "Cost/return/composite-score relationship — makes ROI legible in one glance", data_ref: "roi_data" },
      { type: "horizontal_bar", id: "roi_ranking", reason: "Ranked-list form once relationship is established", data_ref: "roi_ranked" }
    ],
    roi_data: [
      { institute: "NIT Surathkal", fees: 2.1, avg_package: 13.2, roi_score: 94, placement_pct: 94 },
      { institute: "NIT Trichy", fees: 2.0, avg_package: 13.8, roi_score: 93, placement_pct: 95 },
      { institute: "NIT Warangal", fees: 2.1, avg_package: 14.35, roi_score: 92, placement_pct: 96 },
      { institute: "IIT Madras", fees: 2.4, avg_package: 16.0, roi_score: 88, placement_pct: 92 },
      { institute: "IIT Kharagpur", fees: 2.4, avg_package: 15.5, roi_score: 86, placement_pct: 91 },
      { institute: "IIT Roorkee", fees: 2.3, avg_package: 15.0, roi_score: 85, placement_pct: 90 }
    ],
    roi_ranked: [
      { institute: "NIT Surathkal", roi_score: 94, payback_months: 2 },
      { institute: "NIT Trichy", roi_score: 93, payback_months: 2 },
      { institute: "NIT Warangal", roi_score: 92, payback_months: 2 },
      { institute: "IIT Madras", roi_score: 88, payback_months: 3 },
      { institute: "IIT Kharagpur", roi_score: 86, payback_months: 3 },
      { institute: "IIT Roorkee", roi_score: 85, payback_months: 3 },
      { institute: "NIT Rourkela", roi_score: 82, payback_months: 3 },
      { institute: "NIT Calicut", roi_score: 80, payback_months: 3 }
    ],
    rankings: [
      { rank: 1, institute: "NIT Surathkal", total_fees: "₹2.1L", avg_package: "₹13.2 L", roi_score: 94, payback_months: 2, scholarship_note: "MHRD stipend available" },
      { rank: 2, institute: "NIT Trichy", total_fees: "₹2.0L", avg_package: "₹13.8 L", roi_score: 93, payback_months: 2, scholarship_note: "MHRD stipend available" },
      { rank: 3, institute: "NIT Warangal", total_fees: "₹2.1L", avg_package: "₹14.35 L", roi_score: 92, payback_months: 2, scholarship_note: "MHRD stipend available" },
      { rank: 4, institute: "IIT Madras", total_fees: "₹2.4L", avg_package: "₹16.0 L", roi_score: 88, payback_months: 3, scholarship_note: "MHRD + institute scholarships" },
      { rank: 5, institute: "IIT Kharagpur", total_fees: "₹2.4L", avg_package: "₹15.5 L", roi_score: 86, payback_months: 3, scholarship_note: "MHRD + institute scholarships" },
      { rank: 6, institute: "IIT Roorkee", total_fees: "₹2.3L", avg_package: "₹15.0 L", roi_score: 85, payback_months: 3, scholarship_note: "MHRD + institute scholarships" },
      { rank: 7, institute: "NIT Rourkela", total_fees: "₹1.9L", avg_package: "₹10.5 L", roi_score: 82, payback_months: 3, scholarship_note: "MHRD stipend available" },
      { rank: 8, institute: "NIT Calicut", total_fees: "₹1.8L", avg_package: "₹10.2 L", roi_score: 80, payback_months: 3, scholarship_note: "MHRD stipend available" }
    ],
    visual_cards: [
      { rank: 1, institute: "NIT Surathkal", expected_score: "830+ (CCMT)", difficulty: "moderate", roi: "94/100", competition_stars: 3 },
      { rank: 2, institute: "NIT Trichy", expected_score: "840+ (CCMT)", difficulty: "moderate", roi: "93/100", competition_stars: 3 },
      { rank: 3, institute: "NIT Warangal", expected_score: "850+ (CCMT)", difficulty: "moderate", roi: "92/100", competition_stars: 3 },
      { rank: 4, institute: "IIT Madras", expected_score: "840+ (GATE)", difficulty: "high", roi: "88/100", competition_stars: 4 },
      { rank: 5, institute: "IIT Kharagpur", expected_score: "780+ (GATE)", difficulty: "high", roi: "86/100", competition_stars: 4 }
    ],
    analysis: {
      word_count: 430,
      sections: [
        {
          title: "Why Public-Institute ROI Is Different",
          body: "Government-subsidized NIT and IIT fee structures make ROI fundamentally different from private-institute math. Total two-year M.Tech fees at a top NIT run a small fraction of the first year's placement package. Payback period for a strong placement outcome is measured in single-digit months."
        },
        {
          title: "The Leaders",
          body: "NIT Surathkal, Trichy, and Warangal lead the ROI ranking specifically because they combine top-tier NIT placement outcomes with fee structures identical to lower-ranked NITs. ROI essentially tracks placement outcome directly inside the public-institute fee band."
        },
        {
          title: "The Stipend Factor",
          body: "Many M.Tech students receive a monthly stipend through MHRD/AICTE schemes that substantially offsets living costs. This is often omitted from naive cost-of-degree calculations but materially changes payback-period numbers."
        },
        {
          title: "When ROI Isn't Everything",
          body: "A marginally lower-ROI institute with stronger research infrastructure may be better for PhD-bound students. Always consider your specific career goals alongside ROI metrics."
        }
      ]
    },
    expandables: [
      { id: "methodology", title: "How ROI Score Is Computed", body: "ROI score = weighted combination of (avg_package / total_fees) * placement_pct * (1 - payback_penalty). Fees include tuition only. Stipend eligibility adds a bonus of up to 5 points. Scores are normalized to a 0-100 scale." },
      { id: "hidden_costs", title: "Hidden Costs to Factor", body: "Relocation, hostel, and mess costs for out-of-state students can meaningfully change year-one cash flow. Include these in your personal ROI calculation even if they're not in the fee structure." },
      { id: "faqs", title: "FAQs", body: "Q: Is ROI the most important factor? A: For cost-conscious students choosing between offers of similar prestige, yes. For research-oriented students, prioritize faculty and lab quality. Q: Do stipends really make a difference? A: Yes — ₹12,400/month (MHRD) over 2 years significantly offsets costs." }
    ],
    ai_recommendations: {
      input: "user_gate_score",
      buckets: [
        { range: [800, 1000], label: "Premium ROI", color: "#10B981", colleges: ["IIT Madras", "IIT Kharagpur", "NIT Warangal"] },
        { range: [650, 799], label: "Best Value ROI", color: "#10B981", colleges: ["NIT Surathkal", "NIT Trichy", "NIT Warangal"] },
        { range: [0, 649], label: "Solid ROI", color: "#6B7280", colleges: ["NIT Rourkela", "NIT Calicut", "Other NITs"] }
      ]
    },
    sources: [
      { name: "NIRF", confidence: "estimated_basis" },
      { name: "Institute placement reports", confidence: "estimated_basis" },
      { name: "AISHE", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "category-trends",
    accent: "#8B5CF6",
    hero: {
      icon: "📊",
      title: "Category Trends",
      subtitle: "How qualifying and admission cutoffs shift by reservation category",
      takeaway: "GATE CSE 2026 qualifying marks: 30 General, 27 OBC, 20 SC/ST/PwD — admission cutoffs diverge further.",
      badge: { label: "Official + estimated", tier: "mixed" }
    },
    stat_cards: [
      { id: "gen_qualifying", label: "General qualifying mark", value: 30, unit: "score", confidence: "official" },
      { id: "obc_qualifying", label: "OBC qualifying mark", value: 27, unit: "score", confidence: "official" },
      { id: "scst_qualifying", label: "SC/ST/PwD qualifying mark", value: 20, unit: "score", confidence: "official" },
      { id: "gen_vs_scst_gap", label: "Avg admission-cutoff gap Gen vs SC-ST", value: 300, unit: "pts", confidence: "estimated" },
      { id: "fastest_growing", label: "Category with fastest-growing applicant pool", value: "General", unit: "", confidence: "estimated" },
      { id: "yoy_drift", label: "YoY qualifying-mark drift", value: 1, unit: "pt", confidence: "official" }
    ],
    charts: [
      { type: "grouped_bar", id: "qualifying_vs_admission", reason: "Directly contrasts official floor vs estimated real-world bar", data_ref: "category_bars" },
      { type: "stacked_bar", id: "applicant_pool", reason: "Part-to-whole comparison of applicant base by category", data_ref: "applicant_composition" }
    ],
    category_bars: [
      { category: "General", qualifying: 30, admission_top_iit: 820, admission_nit: 700 },
      { category: "OBC", qualifying: 27, admission_top_iit: 740, admission_nit: 630 },
      { category: "EWS", qualifying: 27, admission_top_iit: 780, admission_nit: 660 },
      { category: "SC", qualifying: 20, admission_top_iit: 560, admission_nit: 480 },
      { category: "ST", qualifying: 20, admission_top_iit: 500, admission_nit: 430 },
      { category: "PwD", qualifying: 20, admission_top_iit: 520, admission_nit: 450 }
    ],
    applicant_composition: [
      { category: "General", pct: 42 },
      { category: "OBC", pct: 28 },
      { category: "EWS", pct: 8 },
      { category: "SC", pct: 12 },
      { category: "ST", pct: 6 },
      { category: "PwD", pct: 4 }
    ],
    rankings: [
      { category: "General", qualifying: 30, est_admission_top_iit: 820, est_admission_nit: 700, gap_vs_general: "—" },
      { category: "OBC", qualifying: 27, est_admission_top_iit: 740, est_admission_nit: 630, gap_vs_general: "≈80 pts" },
      { category: "EWS", qualifying: 27, est_admission_top_iit: 780, est_admission_nit: 660, gap_vs_general: "≈40 pts" },
      { category: "SC", qualifying: 20, est_admission_top_iit: 560, est_admission_nit: 480, gap_vs_general: "≈260 pts" },
      { category: "ST", qualifying: 20, est_admission_top_iit: 500, est_admission_nit: 430, gap_vs_general: "≈320 pts" },
      { category: "PwD", qualifying: 20, est_admission_top_iit: 520, est_admission_nit: 450, gap_vs_general: "≈300 pts" }
    ],
    visual_cards: [
      { rank: 1, category: "General", qualifying: 30, est_admission: "820+", gap_vs_scst: "≈300pts", competition_stars: 5 },
      { rank: 2, category: "OBC", qualifying: 27, est_admission: "740+", gap_vs_scst: "≈220pts", competition_stars: 4 },
      { rank: 3, category: "SC", qualifying: 20, est_admission: "560+", gap_vs_scst: "—", competition_stars: 3 }
    ],
    analysis: {
      word_count: 420,
      sections: [
        {
          title: "Qualifying vs Admission",
          body: "GATE qualifying marks are the one figure you can trust as official — they're published alongside results each year. For GATE CSE 2026: 30 (General), 27 (OBC/EWS), 20 (SC/ST/PwD). These determine only eligibility to participate in COAP/CCMT counselling, not admission. The gap between 'qualified' and 'admitted' widens dramatically and unevenly by category at top institutes."
        },
        {
          title: "Category-Aware Planning",
          body: "The most useful strategic move: category-filtered versions of every other insight. Closing-score, safest-programme, and ROI pages all shift meaningfully once category is factored in. Blended General-category-default figures actively mislead OBC/SC/ST/PwD users."
        },
        {
          title: "Common Mistakes",
          body: "Under-applying to reach-tier institutes because General-category closing scores made those institutes look unreachable, without checking category-specific historical cutoffs. The inverse: assuming category status alone guarantees an easy top-IIT seat."
        },
        {
          title: "Category Selector",
          body: "Every insight card and ranking table should carry a category selector. Default to General but persist the user's selection across pages via the sidebar's score/category chip."
        }
      ]
    },
    expandables: [
      { id: "why_qualifying_ne_admission", title: "Why Qualifying ≠ Admission Cutoff", body: "Qualifying marks set the floor for eligibility. Admission cutoffs are determined by applicant performance within each category, seat availability, and round-by-round counselling dynamics. At top institutes, the gap between qualifying and admission is often 500+ points for General category." },
      { id: "category_verification", title: "How Category Verification Works", body: "COAP/CCMT require valid category certificates issued by competent authorities. Verification happens during document submission after seat allocation. Incorrect claims can lead to cancellation." },
      { id: "faqs", title: "FAQs", body: "Q: Do I need to meet General qualifying if I'm from a reserved category? A: No — you qualify at your category's published marks. Q: Are category-specific cutoffs published officially? A: Closing ranks are available per round; scores are estimated from those ranks." }
    ],
    ai_recommendations: {
      input: "user_category_score",
      buckets: [
        { range: [30, 1000], label: "General/EWS", color: "#8B5CF6", colleges: ["Use category-specific filters on all topics"] },
        { range: [27, 1000], label: "OBC", color: "#8B5CF6", colleges: ["Filter rankings by OBC cutoffs for realistic targets"] },
        { range: [20, 1000], label: "SC/ST/PwD", color: "#8B5CF6", colleges: ["Your qualifying threshold is lower — check category-specific closing scores"] }
      ]
    },
    sources: [
      { name: "GATE official", confidence: "official" },
      { name: "COAP", confidence: "estimated_basis" },
      { name: "CCMT", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "ai-ds-demand",
    accent: "#3B82F6",
    hero: {
      icon: "🤖",
      title: "AI & Data Science Demand",
      subtitle: "The fastest-growing GATE paper, backed by real industry hiring numbers",
      takeaway: "GATE DA registrations nearly doubled from ~52,000 (2024) to 91,764 (2026); NASSCOM projects 1.4M+ data professional roles in India.",
      badge: { label: "Fast-growing", tier: "high" }
    },
    stat_cards: [
      { id: "da_reg_2026", label: "GATE DA registrations 2026", value: 91764, unit: "", confidence: "official", format: "number" },
      { id: "da_reg_2024", label: "GATE DA registrations 2024", value: 52000, unit: "", confidence: "official", format: "number" },
      { id: "yoy_growth", label: "YoY growth %", value: 76, unit: "%", confidence: "estimated" },
      { id: "nascom_projection", label: "NASSCOM projected DA roles", value: "1.4M+", unit: "", confidence: "estimated" },
      { id: "da_closing_gap", label: "DA vs CSE closing score gap", value: "50-100", unit: "pts", confidence: "estimated" },
      { id: "institutes_offering_da", label: "Institutes offering DA M.Tech/DS", value: 35, unit: "", confidence: "estimated" },
      { id: "industry_growth", label: "Industry demand growth rate", value: 22, unit: "%", confidence: "estimated" }
    ],
    charts: [
      { type: "trend_line", id: "da_registrations", reason: "Headline growth story — a line is the only honest way to show acceleration", data_ref: "da_reg_data" },
      { type: "vertical_bar", id: "da_vs_cse_scores", reason: "DA may be under-priced — paired bars at same institute", data_ref: "da_cse_comparison" }
    ],
    da_reg_data: [
      { year: 2024, registrations: 52000 },
      { year: 2025, registrations: 74000 },
      { year: 2026, registrations: 91764 }
    ],
    da_cse_comparison: [
      { institute: "IIT Bombay", cse: 860, da: 780 },
      { institute: "IIT Delhi", cse: 855, da: 770 },
      { institute: "IIT Madras", cse: 840, da: 760 },
      { institute: "IIT Kharagpur", cse: 780, da: 700 },
      { institute: "IIT Roorkee", cse: 770, da: 690 },
      { institute: "IIT Jodhpur", cse: 690, da: 610 },
      { institute: "IIT Mandi", cse: 670, da: 590 }
    ],
    rankings: [
      { institute: "IIT Bombay", da_closing_est: 780, cse_closing_est: 860, score_gap: 80, industry_demand: "Very High" },
      { institute: "IIT Delhi", da_closing_est: 770, cse_closing_est: 855, score_gap: 85, industry_demand: "Very High" },
      { institute: "IIT Madras", da_closing_est: 760, cse_closing_est: 840, score_gap: 80, industry_demand: "Very High" },
      { institute: "IIT Kharagpur", da_closing_est: 700, cse_closing_est: 780, score_gap: 80, industry_demand: "High" },
      { institute: "IIT Roorkee", da_closing_est: 690, cse_closing_est: 770, score_gap: 80, industry_demand: "High" },
      { institute: "IIT Jodhpur", da_closing_est: 610, cse_closing_est: 690, score_gap: 80, industry_demand: "High" },
      { institute: "IIT Mandi", da_closing_est: 590, cse_closing_est: 670, score_gap: 80, industry_demand: "Moderate" }
    ],
    visual_cards: [
      { rank: 1, institute: "GATE DA", registrations: 91764, growth: "+76%", industry_demand: "1.4M+", competition_stars: 3 },
      { rank: 2, institute: "IIT Bombay DA", expected_score: "780+", gap_vs_cse: "80pts", competition_stars: 3 },
      { rank: 3, institute: "IIT Delhi DA", expected_score: "770+", gap_vs_cse: "85pts", competition_stars: 3 }
    ],
    analysis: {
      word_count: 420,
      sections: [
        {
          title: "The Growth Story",
          body: "GATE DA (Data Science & AI), introduced in 2024, is the fastest-growing paper by registration volume — climbing to 91,764 candidates in 2026 from ~52,000 in 2024. This growth tracks genuine industry demand: NASSCOM projections put India's data-professional talent need above 1.4 million roles."
        },
        {
          title: "The Score Arbitrage Window",
          body: "Because GATE DA is new, institute-level DA programme closing scores haven't caught up to CSE closing scores at the same institutes — even though industry demand for DA-trained graduates is comparable. A score backup-tier for CSE may be safe-tier for DA at the same institute. This window is unlikely to persist indefinitely."
        },
        {
          title: "Historical Precedent",
          body: "Emerging specializations typically see a multi-year lag between industry-demand recognition and applicant-pool score adjustment. DA appears to be in the early-to-middle part of that lag right now. Expect closing scores to rise toward CSE parity over 2-4 cycles."
        },
        {
          title: "Best For",
          body: "Students with genuine interest in ML/AI/data roles whose GATE score sits below their target institute's CSE closing score — checking DA is the single highest-leverage insight. Avoid choosing DA purely for the lower score bar without interest in the specialization."
        }
      ]
    },
    expandables: [
      { id: "da_vs_cse_curriculum", title: "DA vs CSE Curriculum", body: "DA focuses on ML, statistics, data engineering, and AI — less emphasis on core CS theory (compilers, OS, networks). If your interest is pure software engineering, CSE may be a better fit despite higher score requirements." },
      { id: "industry_traction", title: "Industry Traction", body: "Top recruiters (Google, Microsoft, Amazon, Goldman Sachs) now have dedicated AI/ML hiring tracks. DA graduates from strong programmes are recruited alongside CSE graduates for these roles." },
      { id: "faqs", title: "FAQs", body: "Q: Is DA easier than CSE? A: Not inherently — different curriculum. The lower closing score reflects less applicant awareness, not lower rigor. Q: Will DA closing scores keep rising? A: Yes — expect 50-100 pt increase over 2-4 cycles as awareness grows." }
    ],
    ai_recommendations: {
      input: "user_gate_score",
      buckets: [
        { range: [700, 1000], label: "CSE + DA Options", color: "#3B82F6", colleges: ["Apply to both CSE and DA at target institutes"] },
        { range: [600, 699], label: "DA Primary Target", color: "#3B82F6", colleges: ["DA at older IITs may be in range", "DA at newer IITs is strong backup"] },
        { range: [0, 599], label: "DA Backup Options", color: "#6B7280", colleges: ["DA at newer IITs and top NITs"] }
      ]
    },
    sources: [
      { name: "GATE official", confidence: "official" },
      { name: "COAP", confidence: "estimated_basis" },
      { name: "NASSCOM reports", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "most-competitive-specializations",
    accent: "#EF4444",
    hero: {
      icon: "📚",
      title: "Most Competitive Specializations",
      subtitle: "Which programmes see the toughest fight for seats, and why",
      takeaway: "CSE remains the single most oversubscribed specialization; AI/DS and Cyber Security are closing the gap fast.",
      badge: { label: "Highly competitive", tier: "extreme" }
    },
    stat_cards: [
      { id: "most_competitive", label: "Most competitive specialization", value: "CSE", unit: "", confidence: "estimated" },
      { id: "applicants_per_seat", label: "Applicants-per-seat ratio (CSE)", value: "40:1", unit: "", confidence: "estimated" },
      { id: "fastest_rising", label: "Fastest-rising competitiveness", value: "AI/DS", unit: "", confidence: "estimated" },
      { id: "least_competitive", label: "Least competitive core-CS-adjacent", value: "Systems/VLSI", unit: "", confidence: "estimated" },
      { id: "yoy_competitiveness", label: "YoY competitiveness trend", value: "+8%", unit: "", confidence: "estimated" },
      { id: "cse_vs_next_gap", label: "Avg score gap CSE vs next-closest spec", value: 60, unit: "pts", confidence: "estimated" }
    ],
    charts: [
      { type: "radar", id: "specialization_comparison", reason: "Multi-axis comparison (competitiveness, package, seats, growth)", data_ref: "radar_data" },
      { type: "competition_meter", id: "competition_meters", reason: "Quick-glance single-metric per specialization", data_ref: "meter_data" }
    ],
    radar_data: [
      { specialization: "CSE", competitiveness: 95, avg_package: 90, seat_count: 40, growth_rate: 60 },
      { specialization: "AI/DS", competitiveness: 78, avg_package: 88, seat_count: 50, growth_rate: 95 },
      { specialization: "Cyber Security", competitiveness: 70, avg_package: 80, seat_count: 55, growth_rate: 85 },
      { specialization: "Systems & Architecture", competitiveness: 50, avg_package: 75, seat_count: 70, growth_rate: 40 },
      { specialization: "VLSI & Embedded", competitiveness: 45, avg_package: 70, seat_count: 75, growth_rate: 35 },
      { specialization: "Computational Science", competitiveness: 40, avg_package: 65, seat_count: 80, growth_rate: 50 }
    ],
    meter_data: [
      { specialization: "CSE", level: 95, label: "Extreme" },
      { specialization: "AI/DS", level: 78, label: "Very High" },
      { specialization: "Cyber Security", level: 70, label: "High" },
      { specialization: "Systems", level: 50, label: "Moderate" },
      { specialization: "VLSI", level: 45, label: "Moderate" },
      { specialization: "Comp. Science", level: 40, label: "Moderate" }
    ],
    rankings: [
      { specialization: "CSE", applicants_per_seat: "40:1", avg_closing_est: 810, avg_package: "₹16 L", trend: "Stable" },
      { specialization: "AI/DS", applicants_per_seat: "28:1", avg_closing_est: 730, avg_package: "₹15.5 L", trend: "Rising fast" },
      { specialization: "Cyber Security", applicants_per_seat: "22:1", avg_closing_est: 700, avg_package: "₹14 L", trend: "Rising" },
      { specialization: "Systems", applicants_per_seat: "12:1", avg_closing_est: 640, avg_package: "₹13 L", trend: "Stable" },
      { specialization: "VLSI", applicants_per_seat: "10:1", avg_closing_est: 620, avg_package: "₹12.5 L", trend: "Stable" },
      { specialization: "Comp. Science", applicants_per_seat: "8:1", avg_closing_est: 600, avg_package: "₹12 L", trend: "Slight rise" }
    ],
    visual_cards: [
      { rank: 1, specialization: "CSE", competitiveness: "★★★★★", applicants_per_seat: "40:1", avg_closing: "810+" },
      { rank: 2, specialization: "AI/DS", competitiveness: "★★★★☆", applicants_per_seat: "28:1", avg_closing: "730+" },
      { rank: 3, specialization: "Cyber Security", competitiveness: "★★★☆☆", applicants_per_seat: "22:1", avg_closing: "700+" }
    ],
    analysis: {
      word_count: 400,
      sections: [
        {
          title: "The CSE Dominance",
          body: "CSE remains the most competitive M.Tech specialization — the applicants-per-seat ratio at top institutes dwarfs every other specialization. This is partly self-reinforcing: high volume pushes closing scores up, which signals prestige, which sustains volume in a feedback loop loosely tied to actual placement outcomes."
        },
        {
          title: "Rising Contenders",
          body: "AI/DS and Cyber Security are rising fastest in competitiveness, tracking industry hiring trends. Cyber Security has seen growing applicant interest as enterprise security hiring expands, though its closing scores still trail CSE meaningfully."
        },
        {
          title: "The Strategy Mistake",
          body: "Treating 'most competitive' as synonymous with 'best outcome' is a mistake. Several less-competitive specializations at the same institutes post placement outcomes competitive with CSE's. A rational strategy compares specialization-level placement data, not just prestige rankings."
        },
        {
          title: "Recommendation",
          body: "If your score sits below your target institute's CSE cutoff, check that same institute's next 2-3 specializations before moving to a lower-tier institute's CSE programme. Staying at a stronger institute in an adjacent specialization frequently outperforms dropping a tier for the CSE label."
        }
      ]
    },
    expandables: [
      { id: "competitiveness_vs_outcome", title: "Why Competitiveness ≠ Better Outcome", body: "A specialization can be highly competitive due to brand-name pull rather than outcome data. Compare specialization-level placement data before defaulting to the most competitive option. Less competitive specializations at the same institute may offer better ROI." },
      { id: "rising_specs", title: "Rising Specializations to Watch", body: "AI/DS — rapidly growing industry demand; Cyber Security — enterprise hiring boom; Computational Science — HPC/AI crossover roles emerging. These specializations offer strong outcomes with lower current competition." },
      { id: "faqs", title: "FAQs", body: "Q: Should I pick CSE at a lower-tier institute over an adjacent specialization at a top IIT? A: For core SWE roles, CSE label matters. For ML/research roles, specialization relevance may outweigh institute tier. Q: Is competitiveness expected to rise across all specializations? A: Yes — GATE registration overall is growing." }
    ],
    ai_recommendations: {
      input: "user_gate_score",
      buckets: [
        { range: [800, 1000], label: "CSE Primary", color: "#EF4444", colleges: ["CSE at any top IIT is in range"] },
        { range: [700, 799], label: "CSE at Older IITs", color: "#EF4444", colleges: ["CSE at older IITs — consider AI/DS at top IITs as backup"] },
        { range: [600, 699], label: "Consider Adjacent", color: "#F59E0B", colleges: ["CSE at newer IITs or AI/DS/Cyber Security at older IITs"] },
        { range: [0, 599], label: "Broader Options", color: "#6B7280", colleges: ["Systems, VLSI, or Computational Science at strong institutes"] }
      ]
    },
    sources: [
      { name: "COAP", confidence: "estimated_basis" },
      { name: "CCMT", confidence: "estimated_basis" },
      { name: "Institute placement reports", confidence: "estimated_basis" }
    ],
    last_verified: "2026-07-27"
  },
  {
    topic_id: "counselling-timeline",
    accent: "#9CA3AF",
    hero: {
      icon: "📅",
      title: "Counselling Timeline",
      subtitle: "Every round, every deadline, mapped out",
      takeaway: "COAP runs 10 rounds from mid-May through early June for IITs/IISc; CCMT follows a parallel schedule for NITs/IIITs/GFTIs.",
      badge: { label: "Structural reference", tier: "neutral" }
    },
    stat_cards: [
      { id: "total_coap_rounds", label: "Total COAP rounds", value: 10, unit: "rounds", confidence: "official" },
      { id: "round_1_dates", label: "Round 1 dates", value: "May 11-13", unit: "", confidence: "official" },
      { id: "final_round", label: "Final round date", value: "Jun 8-10", unit: "", confidence: "official" },
      { id: "participating_institutes", label: "Participating institutes (IITs+IISc)", value: 24, unit: "", confidence: "official" },
      { id: "ccmt_rounds", label: "CCMT total rounds", value: 6, unit: "rounds", confidence: "official" },
      { id: "days_to_counselling", label: "Days between GATE result and counselling", value: 45, unit: "days", confidence: "official" }
    ],
    charts: [
      { type: "timeline", id: "coap_timeline", reason: "Sequential-dated process — the only correct form", data_ref: "timeline_data" },
      { type: "network", id: "counselling_flow", reason: "Structural overview showing COAP and CCMT run in parallel", data_ref: "flow_data" }
    ],
    timeline_data: [
      { round: "GATE Result", start: "Mar 16", end: "Mar 16", action: "Score published", note: "Official GATE 2026 result" },
      { round: "COAP Registration", start: "Mar 20", end: "Apr 30", action: "Register", note: "Create profile, upload docs, list preferences" },
      { round: "Round 1", start: "May 11", end: "May 13", action: "A&F / R&W / R&R", note: "Highest volatility round" },
      { round: "Round 2", start: "May 15", end: "May 17", action: "A&F / R&W / R&R", note: "Early movement" },
      { round: "Round 3", start: "May 19", end: "May 21", action: "A&F / R&W / R&R", note: "Score drops start" },
      { round: "Round 4", start: "May 23", end: "May 25", action: "A&F / R&W / R&R", note: "Steady movement" },
      { round: "Round 5", start: "May 27", end: "May 29", action: "A&F / R&R only", note: "Flexibility narrows — no R&W" },
      { round: "Round 6", start: "May 31", end: "Jun 1", action: "A&F / R&R only", note: "" },
      { round: "Round 7", start: "Jun 2", end: "Jun 3", action: "A&F / R&R only", note: "" },
      { round: "Round 8", start: "Jun 4", end: "Jun 5", action: "A&F / R&R only", note: "" },
      { round: "Round 9", start: "Jun 6", end: "Jun 7", action: "A&F / R&R only", note: "" },
      { round: "Round 10", start: "Jun 8", end: "Jun 10", action: "Final A&F / R&R", note: "Last round" }
    ],
    rankings: [
      { round: "Round 1", dates: "May 11-13", action: "A&F / R&W / R&R", notes: "First and highest-volatility round", confidence: "official" },
      { round: "Round 2", dates: "May 15-17", action: "A&F / R&W / R&R", notes: "Early movement", confidence: "official" },
      { round: "Round 3", dates: "May 19-21", action: "A&F / R&W / R&R", notes: "Score drops begin — watch for reach-tier seats", confidence: "official" },
      { round: "Round 4", dates: "May 23-25", action: "A&F / R&W / R&R", notes: "Steady movement", confidence: "official" },
      { round: "Round 5", dates: "May 27-29", action: "A&F / R&R only", notes: "CRITICAL: R&W removed — decide or lose offer", confidence: "official" },
      { round: "Round 6", dates: "May 31-Jun 1", action: "A&F / R&R only", notes: "", confidence: "official" },
      { round: "Round 7-9", dates: "Jun 2-7", action: "A&F / R&R only", notes: "Late rounds — limited movement", confidence: "official" },
      { round: "Round 10", dates: "Jun 8-10", action: "Final A&F / R&R", notes: "Last opportunity — all seats finalize", confidence: "official" }
    ],
    visual_cards: [
      { round: "Round 1", dates: "May 11-13", action: "A&F / R&W / R&R", importance: "Highest volatility" },
      { round: "Round 5", dates: "May 27-29", action: "A&F / R&R only", importance: "R&W removed — critical" },
      { round: "Round 10", dates: "Jun 8-10", action: "Final deadline", importance: "Last round" }
    ],
    analysis: {
      word_count: 380,
      sections: [
        {
          title: "Parallel Systems",
          body: "COAP (for IITs and IISc Bangalore) and CCMT (for NITs, IIITs, and GFTIs) run as parallel — not sequential — counselling systems. Students eligible for both should register on both platforms as soon as GATE results are announced. Holding offers in both systems simultaneously is standard practice."
        },
        {
          title: "The Narrowing Choice Set",
          body: "COAP 2026 runs 10 rounds. Rounds 1-4 offer three actions: Accept & Freeze, Retain & Wait, Reject & Wait. From Round 5 onward, Retain & Wait is no longer available — the flexibility to wait for something better genuinely disappears. This is the single most important structural fact."
        },
        {
          title: "Common Mistakes",
          body: "Missing an action-deadline window within a round. Assuming a previous round's choice automatically carries forward. Not tracking both COAP and CCMT deadlines simultaneously when they don't perfectly align."
        },
        {
          title: "Recommendation",
          body: "This page should function as an operational dashboard — check repeatedly through May-June. Set calendar reminders for each round's deadline. Understand the three action types before Round 1 opens."
        }
      ]
    },
    expandables: [
      { id: "accept_freeze", title: "What 'Accept & Freeze' Actually Means", body: "You accept the current offer and exit the counselling process for that specific institute/programme. Your seat is confirmed and cannot be upgraded in later rounds. Use this only when you're certain." },
      { id: "retain_wait", title: "Why 'Retain & Wait' Disappears After Round 5", body: "COAP is designed to force decisions by Round 5 so late rounds have clearer seat availability. After Round 5, you must either lock in your current offer (A&F) or release it (R&R). Plan your timeline around this deadline." },
      { id: "faqs", title: "FAQs", body: "Q: What happens if I miss a round's deadline? A: Your current choice carries forward for some actions, but not always — check COAP rules each round. Q: Can I participate in both COAP and CCMT? A: Yes — they're independent. Q: When should I start preparing documents? A: Before Round 1 opens — delays cause missed deadlines." }
    ],
    ai_recommendations: {
      input: "system_date",
      buckets: [
        { range: [0, 999], label: "Timeline Reference", color: "#9CA3AF", colleges: ["Live countdown to next round deadline"] }
      ]
    },
    sources: [
      { name: "GATE official", confidence: "official" },
      { name: "COAP", confidence: "official" },
      { name: "CCMT", confidence: "official" }
    ],
    last_verified: "2026-07-27"
  }
];

export const INSIGHT_TOPICS = TOPICS_DATA;

export const TOPIC_ACCENTS = Object.fromEntries(
  TOPICS_DATA.map(t => [t.topic_id, t.accent])
);

export const getTopicBySlug = (slug) => TOPICS_DATA.find(t => t.topic_id === slug);

export default TOPICS_DATA;
