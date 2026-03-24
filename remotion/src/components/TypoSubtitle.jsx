import { useCurrentFrame, spring, useVideoConfig } from "remotion";

const VISIBLE_WORDS = 8;
const HIGHLIGHT_COLOR = "#FFD700";
const GLOW_COLOR = "rgba(255, 215, 0, 0.6)";

export const TypoSubtitle = ({ timestamps, script, productName, commentKeyword, fps }) => {
  const frame = useCurrentFrame();
  const { fps: configFps } = useVideoConfig();
  const currentFps = fps || configFps;
  const currentTime = frame / currentFps;

  // If no timestamps, show script as static text
  if (!timestamps || timestamps.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ ...wordStyle, opacity: 1, transform: "translateY(0)" }}>
          {script}
        </div>
      </div>
    );
  }

  // Find visible words (current + recent)
  const activeIndex = timestamps.findIndex(
    (w) => currentTime >= w.start && currentTime < w.end
  );

  const startIdx = Math.max(0, activeIndex - VISIBLE_WORDS + 1);
  const visibleWords = timestamps.slice(startIdx, activeIndex + 1);

  return (
    <div style={containerStyle}>
      <div style={wordRowStyle}>
        {visibleWords.map((word, i) => {
          const globalIdx = startIdx + i;
          const isActive = globalIdx === activeIndex;
          const isPast = globalIdx < activeIndex;
          const isKeyword = isHighlightWord(word.word, productName, commentKeyword);

          // Spring entrance animation
          const entranceProgress = spring({
            frame: frame - Math.floor(word.start * currentFps),
            fps: currentFps,
            config: { damping: 12, stiffness: 200, mass: 0.5 },
          });

          const opacity = isPast ? 0.5 : entranceProgress;
          const translateY = (1 - entranceProgress) * 30;
          const scale = isActive ? 1.15 : 1;

          // Glow pulse for keywords
          const glowIntensity = isKeyword && isActive
            ? Math.sin(frame * 0.15) * 0.5 + 0.5
            : 0;

          return (
            <span
              key={`${globalIdx}-${word.word}`}
              style={{
                ...wordStyle,
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                color: isKeyword ? HIGHLIGHT_COLOR : isActive ? "#FFFFFF" : "#E0E0E0",
                textShadow: isKeyword
                  ? `0 0 ${10 + glowIntensity * 20}px ${GLOW_COLOR}`
                  : isActive
                  ? "0 2px 8px rgba(0,0,0,0.8)"
                  : "0 1px 4px rgba(0,0,0,0.6)",
                backgroundColor: isKeyword && isActive
                  ? "rgba(255, 215, 0, 0.15)"
                  : "transparent",
                borderRadius: isKeyword ? "4px" : "0",
                padding: isKeyword ? "2px 6px" : "0",
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

function isHighlightWord(word, productName, commentKeyword) {
  const cleaned = word.replace(/[.,!?]/g, "").trim();
  if (!cleaned) return false;
  if (commentKeyword && cleaned.includes(commentKeyword)) return true;
  if (productName) {
    const nameWords = productName.split(/\s+/);
    return nameWords.some((nw) => cleaned.includes(nw));
  }
  return false;
}

const containerStyle = {
  position: "absolute",
  bottom: "15%",
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "center",
  padding: "0 40px",
  zIndex: 10,
};

const wordRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "8px",
  maxWidth: "900px",
};

const wordStyle = {
  fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
  fontSize: "48px",
  fontWeight: 700,
  lineHeight: 1.4,
  transition: "all 0.1s ease",
  display: "inline-block",
};
