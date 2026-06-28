export default function CinematicBackground() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <img
        src="/images/login wallpaper 2.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(rgba(6,10,20,0.45), rgba(6,10,20,0.60))',
        }}
      />
    </div>
  );
}
