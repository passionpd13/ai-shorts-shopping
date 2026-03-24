import { useCurrentFrame, spring, useVideoConfig } from "remotion";

export const KeywordCTA = ({ keyword, fps }) => {
  const frame = useCurrentFrame();
  const { fps: configFps } = useVideoConfig();
  const currentFps = fps || configFps;

  // Line 1: "관심 있으면 댓글에" (appears at frame 0)
  const line1Progress = spring({
    frame,
    fps: currentFps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });

  // Keyword box (appears at frame 15)
  const keywordProgress = spring({
    frame: frame - 15,
    fps: currentFps,
    config: { damping: 10, stiffness: 200, mass: 0.5 },
  });

  // Line 2: "남겨주세요" (appears at frame 30)
  const line2Progress = spring({
    frame: frame - 30,
    fps: currentFps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });

  // Keyword glow pulse
  const glowPulse = Math.sin(frame * 0.2) * 0.5 + 0.5;

  return (
    <div style={containerStyle}>
      {/* Line 1 */}
      <div
        style={{
          opacity: line1Progress,
          transform: `translateY(${(1 - line1Progress) * 20}px)`,
          fontFamily: "'Pretendard', sans-serif",
          fontSize: "36px",
          fontWeight: 500,
          color: "#FFFFFF",
          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
          marginBottom: "16px",
        }}
      >
        관심 있으면 댓글에
      </div>

      {/* Keyword Box */}
      <div
        style={{
          opacity: keywordProgress,
          transform: `scale(${keywordProgress})`,
          backgroundColor: "rgba(255, 215, 0, 0.15)",
          border: "2px solid #FFD700",
          borderRadius: "16px",
          padding: "16px 48px",
          marginBottom: "16px",
          boxShadow: `0 0 ${10 + glowPulse * 25}px rgba(255, 215, 0, ${0.3 + glowPulse * 0.4})`,
        }}
      >
        <span
          style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: "64px",
            fontWeight: 800,
            color: "#FFD700",
            textShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
          }}
        >
          {keyword}
        </span>
      </div>

      {/* Line 2 */}
      <div
        style={{
          opacity: line2Progress,
          transform: `translateY(${(1 - line2Progress) * 20}px)`,
          fontFamily: "'Pretendard', sans-serif",
          fontSize: "36px",
          fontWeight: 500,
          color: "#FFFFFF",
          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        남겨주세요 ✍️
      </div>
    </div>
  );
};

const containerStyle = {
  position: "absolute",
  bottom: "25%",
  left: 0,
  right: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  zIndex: 20,
};
