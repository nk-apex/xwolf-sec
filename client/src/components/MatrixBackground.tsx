import { useEffect, useRef } from "react";

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let columns: number[] = [];

    const chars = "XWOLFSILENTXWOLF01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const words = ["SILENT", "WOLF", "XWOLF", "SEC", "SCAN", "HACK", "PROBE", "TRACE"];
    const fontSize = 14;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colCount = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: colCount }, () => Math.random() * -100);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = "rgba(5, 5, 5, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns.length; i++) {
        const x = i * fontSize;
        const y = columns[i] * fontSize;

        const isWordColumn = i % 10 === 0;
        const wordIndex = Math.floor(i / 10) % words.length;
        const word = words[wordIndex];
        const charIndex = Math.floor(columns[i]) % word.length;

        let char: string;
        if (isWordColumn && charIndex >= 0 && charIndex < word.length) {
          char = word[charIndex];
        } else {
          char = chars[Math.floor(Math.random() * chars.length)];
        }

        const brightness = Math.random();
        const isHead = y > 0 && y < canvas.height && columns[i] - Math.floor(columns[i]) < 0.05;

        if (isHead || brightness > 0.95) {
          ctx.fillStyle = "rgba(150, 255, 150, 1)";
          ctx.shadowColor = "rgba(0, 255, 0, 1)";
          ctx.shadowBlur = 25;
        } else if (brightness > 0.88) {
          ctx.fillStyle = "rgba(0, 255, 0, 0.85)";
          ctx.shadowColor = "rgba(0, 255, 0, 0.7)";
          ctx.shadowBlur = 18;
        } else if (brightness > 0.75) {
          ctx.fillStyle = "rgba(0, 230, 0, 0.5)";
          ctx.shadowColor = "rgba(0, 255, 0, 0.3)";
          ctx.shadowBlur = 10;
        } else if (brightness > 0.5) {
          ctx.fillStyle = "rgba(0, 200, 0, 0.3)";
          ctx.shadowColor = "rgba(0, 200, 0, 0.15)";
          ctx.shadowBlur = 5;
        } else {
          ctx.fillStyle = "rgba(0, 150, 0, 0.15)";
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        }

        columns[i] += 0.4 + Math.random() * 0.3;
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.55 }}
    />
  );
}
