'use client'; 
import { useEffect, useState } from "react";

const StatsCounter = ({ end, label, duration = 2 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return (
    <div className="text-center">
      <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
        {count.toLocaleString()}+
      </div>
      <div className="text-slate-400">{label}</div>
    </div>
  );
};

export default StatsCounter