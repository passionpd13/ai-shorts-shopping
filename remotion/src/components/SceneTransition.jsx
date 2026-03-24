import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";

const TRANSITION_FRAMES = 12; // 0.4s at 30fps

export const SceneTransition = ({ scenes, fps }) => {
  const frame = useCurrentFrame();
  const { fps: configFps } = useVideoConfig();
  const currentFps = fps || configFps;

  // Find current scene
  const currentSceneIndex = scenes.findIndex(
    (s) => frame >= s.startFrame && frame < s.startFrame + s.durationFrames
  );
  const scene = scenes[currentSceneIndex] || scenes[0];

  // Transition opacity
  const localFrame = frame - scene.startFrame;
  const fadeIn = interpolate(localFrame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Ken Burns: subtle zoom over scene duration
  const zoom = interpolate(
    localFrame,
    [0, scene.durationFrames],
    [1.0, 1.05],
    { extrapolateRight: "clamp" }
  );

  // Gradient overlay darkness varies by scene type
  const overlayOpacity = scene.overlayOpacity || 0.4;

  return (
    <>
      {/* Fade transition overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          opacity: 1 - fadeIn,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Ken Burns zoom effect (applied to parent video via CSS) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Bottom gradient overlay for text readability */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          background: `linear-gradient(transparent, rgba(0,0,0,${overlayOpacity}))`,
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* Scene label (top-left, visible for 2 seconds) */}
      {localFrame < currentFps * 2 && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 40,
            zIndex: 15,
            opacity: interpolate(
              localFrame,
              [0, 10, currentFps * 1.5, currentFps * 2],
              [0, 1, 1, 0],
              { extrapolateRight: "clamp" }
            ),
          }}
        >
          <span
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: "24px",
              fontWeight: 600,
              color: scene.labelColor || "#FFFFFF",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "6px 16px",
              borderRadius: "20px",
              borderLeft: `3px solid ${scene.color || "#FFFFFF"}`,
            }}
          >
            {scene.label}
          </span>
        </div>
      )}
    </>
  );
};
