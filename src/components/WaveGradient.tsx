import React, { useEffect, useRef } from "react";

interface WaveGradientProps {
  colors: string[];
  speed?: number;
}

export const WaveGradient: React.FC<WaveGradientProps> = ({
  colors = ["#4a148c", "#7b1fa2", "#9c27b0", "#ab47bc"],
  speed = 0.005,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const animate = () => {
      time += speed;

      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      colors.forEach((color, index) => {
        const offset =
          (index / (colors.length - 1) + Math.sin(time + index) * 0.1) % 1;
        gradient.addColorStop(offset, color);
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create wave effect
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);

      for (let x = 0; x < canvas.width; x++) {
        const y = Math.sin(x * 0.01 + time) * 50 + canvas.height / 2;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colors, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
};
