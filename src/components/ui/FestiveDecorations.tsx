import React from 'react';

// Snowflake component
const Snowflake: React.FC<{ delay: number; duration: number; left: number }> = ({ delay, duration, left }) => {
  return (
    <div
      className="absolute text-white text-2xl pointer-events-none select-none"
      style={{
        left: `${left}%`,
        top: '-10px',
        animation: `snowfall ${duration}s linear ${delay}s infinite`,
        opacity: 0.8,
      }}
    >
      ❄
    </div>
  );
};

// Star component
const Star: React.FC<{ delay: number; duration: number; left: number; size: number }> = ({ delay, duration, left, size }) => {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${left}%`,
        top: '-10px',
        animation: `sparkle ${duration}s ease-in-out ${delay}s infinite`,
        fontSize: `${size}px`,
        color: '#FFD700',
      }}
    >
      ✨
    </div>
  );
};

// Confetti component
const Confetti: React.FC<{ delay: number; duration: number; left: number; color: string }> = ({ delay, duration, left, color }) => {
  return (
    <div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-10px',
        backgroundColor: color,
        animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
      }}
    />
  );
};

export const FestiveDecorations: React.FC = () => {
  // Generate snowflakes
  const snowflakes = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
    left: Math.random() * 100,
  }));

  // Generate stars
  const stars = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    left: Math.random() * 100,
    size: 12 + Math.random() * 8,
  }));

  // Generate confetti
  const confettiColors = ['#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF69B4', '#00CED1'];
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 4,
    duration: 8 + Math.random() * 7,
    left: Math.random() * 100,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ zIndex: 0 }}>
      {/* Snowflakes */}
      {snowflakes.map((snowflake) => (
        <Snowflake
          key={`snow-${snowflake.id}`}
          delay={snowflake.delay}
          duration={snowflake.duration}
          left={snowflake.left}
        />
      ))}
      
      {/* Stars */}
      {stars.map((star) => (
        <Star
          key={`star-${star.id}`}
          delay={star.delay}
          duration={star.duration}
          left={star.left}
          size={star.size}
        />
      ))}
      
      {/* Confetti */}
      {confetti.map((piece) => (
        <Confetti
          key={`confetti-${piece.id}`}
          delay={piece.delay}
          duration={piece.duration}
          left={piece.left}
          color={piece.color}
        />
      ))}
    </div>
  );
};

