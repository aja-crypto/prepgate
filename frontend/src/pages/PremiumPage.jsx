import { useState } from 'react';
import { useAuthData } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 499, period: '/month', popular: false, features: ['Unlimited AI Chat', 'Advanced Analytics', 'AIR Predictor Pro', 'Custom Mock Tests', 'Gate Vault Access', 'Email Support'] },
  { id: 'yearly', name: 'Yearly', price: 2999, period: '/year', popular: true, features: ['Everything in Monthly', '2 Months Free', 'Priority Support', 'Early Feature Access', 'Premium Badge', 'PDF Reports', 'AI Mentor Priority'] },
  { id: 'lifetime', name: 'Lifetime', price: 7999, period: ' once', popular: false, features: ['Everything in Yearly', 'All Future Updates', 'Direct Founder Access', 'Beta Features First', 'Lifetime Badge', 'Personalized Roadmap', '1:1 Mentorship Session'] },
];

const FEATURES = [
  { icon: '🤖', name: 'Unlimited AI Chat', desc: 'Ask anything without daily limits' },
  { icon: '📊', name: 'Advanced Analytics', desc: 'Deep performance insights & trends' },
  { icon: '🎯', name: 'AIR Predictor Pro', desc: 'More accurate rank predictions' },
  { icon: '📝', name: 'Custom Mock Tests', desc: 'Create subject/topic-specific mocks' },
  { icon: '🔐', name: 'Gate Vault', desc: 'Curated practice from topper notes' },
  { icon: '⭐', name: 'Early Access', desc: 'Be first to try new features' },
];

const TESTIMONIALS = [
  { name: 'Rahul S.', air: 'AIR 12', text: 'The AI Mentor feature alone saved me months of confusion. Worth every rupee.', avatar: '🎯' },
  { name: 'Priya M.', air: 'AIR 27', text: 'Advanced Analytics helped me identify weak spots I never noticed.', avatar: '⭐' },
  { name: 'Arun K.', air: 'AIR 58', text: 'Custom mock tests with real GATE pattern made a huge difference.', avatar: '🚀' },
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes. Monthly and yearly plans can be cancelled anytime. You retain access until the billing period ends.' },
  { q: 'Is there a free trial?', a: 'Yes! Start with the free tier — no credit card needed. Upgrade when you need premium features.' },
  { q: 'What payment methods?', a: 'We support UPI, credit/debit cards, net banking, and popular wallets.' },
  { q: 'Can I switch plans?', a: 'Absolutely. Upgrade or downgrade anytime. The price adjusts prorated to your billing cycle.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function PlanCard({ plan, index, isAnnual, onSelect }) {
  const displayPrice = plan.id === 'yearly' && isAnnual !== null ? Math.round(plan.price / 12) : plan.price;
  const displayPeriod = plan.id === 'yearly' && isAnnual !== null ? '/month' : plan.period;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className={`relative rounded-2xl p-6 flex flex-col ${plan.popular ? 'ring-2' : ''}`}
      style={{
        background: plan.popular
          ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))'
          : 'rgba(255,255,255,0.03)',
        border: plan.popular ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: plan.popular ? '0 0 40px rgba(139,92,246,0.1)' : 'none',
      }}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-bold text-white">{plan.name}</h3>
        <div className="mt-2 flex items-baseline gap-0.5">
          <span className="text-3xl font-black text-white">₹{displayPrice.toLocaleString()}</span>
          <span className="text-[11px] text-text3">{displayPeriod}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 mb-6">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0 text-purple-400">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-text2">{f}</span>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all"
        style={{
          background: plan.popular
            ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
            : 'rgba(139,92,246,0.1)',
          border: plan.popular ? 'none' : '1px solid rgba(139,92,246,0.2)',
          boxShadow: plan.popular ? '0 4px 20px rgba(139,92,246,0.3)' : 'none',
        }}
      >
        {plan.id === 'lifetime' ? 'Get Lifetime Access' : plan.id === 'yearly' ? 'Subscribe Yearly' : 'Subscribe Monthly'}
      </motion.button>
    </motion.div>
  );
}

export default function PremiumPage() {
  const { isPremium, referralProgress, referralCount } = useAuthData();
  const navigate = useNavigate();
  const [billing, setBilling] = useState(null); // null = show both, 'monthly' = show yearly as monthly price

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">

          <motion.div variants={itemVariants} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Go Premium</h1>
            <p className="text-sm text-text3 mt-2 max-w-md mx-auto">Unlock the full GATE preparation experience with AI-powered features designed to maximize your rank.</p>
          </motion.div>

          {isPremium ? (
            <motion.div variants={itemVariants} className="rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
              <motion.span initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-5xl">⭐</motion.span>
              <p className="text-lg font-bold text-white mt-3">Premium Active</p>
              <p className="text-sm text-text3 mt-1">All features unlocked. Thank you for being a premium member!</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-block"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                Go to Dashboard
              </motion.button>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="rounded-2xl p-5 sm:p-6 text-center max-w-lg mx-auto"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-base font-bold text-white">Get Premium Free</p>
              <p className="text-xs text-text3 mt-1 max-w-sm mx-auto">Invite friends to GateNexa and unlock premium features at no cost.</p>
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text3">Referral Progress</span>
                  <span className="text-xs font-mono text-purple-400">{Math.min(100, Math.round(referralProgress))}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, referralProgress)}%` }}
                    style={{ background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)', boxShadow: '0 0 8px rgba(139,92,246,0.3)' }} />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/referral')}
                className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
                Invite Friends
              </motion.button>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3">
            <span className={`text-xs font-medium transition-colors ${billing !== true ? 'text-white' : 'text-text3'}`}>Monthly</span>
            <button onClick={() => setBilling(billing === true ? null : true)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: billing === true ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)' }}>
              <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                animate={{ x: billing === true ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </button>
            <span className={`text-xs font-medium transition-colors ${billing === true ? 'text-white' : 'text-text3'}`}>
              Yearly <span className="text-purple-400">Save 50%</span>
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} isAnnual={billing}
                onSelect={() => navigate('/referral')} />
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-white text-center mb-6">Everything you get</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <motion.div key={f.name} whileHover={{ y: -2 }} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">{f.icon}</span>
                  <div className="text-xs font-semibold text-white mt-2">{f.name}</div>
                  <div className="text-[10px] text-text3 mt-0.5">{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-white text-center mb-6">What our users say</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t) => (
                <motion.div key={t.name} whileHover={{ y: -3 }} className="rounded-xl p-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-2xl">{t.avatar}</span>
                  <p className="text-xs text-text2 mt-3 leading-relaxed">"{t.text}"</p>
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="text-xs font-semibold text-white">{t.name}</div>
                    <div className="text-[9px] text-purple-400">{t.air}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-white text-center mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <summary className="px-4 py-3 text-xs font-medium text-white cursor-pointer flex items-center justify-between group-open:border-b border-white/[0.06]">
                    {faq.q}
                    <svg className="w-3 h-3 text-text3 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </summary>
                  <div className="px-4 py-3">
                    <p className="text-xs text-text3 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
