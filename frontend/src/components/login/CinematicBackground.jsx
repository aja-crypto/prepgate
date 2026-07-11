export default function CinematicBackground() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <picture>
        <source srcSet="/images/login-wallpaper-2.webp" type="image/webp" />
        <img
          src="/images/login-wallpaper-2.png"
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </picture>
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(rgba(6,10,20,0.50), rgba(6,10,20,0.65))',
        }}
      />
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.04) 0%, transparent 60%)
          `,
          animation: 'auroraPulse 8s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes auroraPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
