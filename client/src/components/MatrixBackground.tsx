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

      ctx.fillStyle = "rgba(5, 5, 5, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns.length; i++) {
        const x = i * fontSize;
        const y = columns[i] * fontSize;

        const isWordColumn = i % 12 === 0;
        const wordIndex = Math.floor(i / 12) % words.length;
        const word = words[wordIndex];
        const charIndex = Math.floor(columns[i]) % word.length;

        let char: string;
        if (isWordColumn && charIndex >= 0 && charIndex < word.length) {
          char = word[charIndex];
        } else {
          char = chars[Math.floor(Math.random() * chars.length)];
        }

        const brightness = Math.random();

        if (brightness > 0.97) {
          ctx.fillStyle = "rgba(0, 255, 0, 0.9)";
          ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
          ctx.shadowBlur = 15;
        } else if (brightness > 0.9) {
          ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
          ctx.shadowColor = "rgba(0, 255, 0, 0.4)";
          ctx.shadowBlur = 8;
        } else if (brightness > 0.7) {
          ctx.fillStyle = "rgba(0, 200, 0, 0.3)";
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "rgba(0, 150, 0, 0.12)";
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
      style={{ opacity: 0.45 }}
    />
  );
}
