import { useCurrentFrame } from "remotion";

export const ProgressBar = ({ scenes, totalFrames }) => {
  const frame = useCurrentFrame();
  const progress = Math.min(frame / totalFrames, 1);

  return (
    <div style={barContainerStyle}>
      {/* Scene segments */}
      <div style={barTrackStyle}>
        {scenes.map((scene, i) => {
          const segStart = scene.startFrame / totalFrames;
          const segWidth = scene.durationFrames / totalFrames;
          const isActive =
            frame >= scene.startFrame &&
            frame < scene.startFrame + scene.durationFrames;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${segStart * 100}%`,
                width: `${segWidth * 100}%`,
                height: "100%",
                backgroundColor: scene.color || "#666",
                opacity: isActive ? 1 : 0.4,
                transition: "opacity 0.3s ease",
              }}
            />
          );
        })}

        {/* Progress overlay */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};

const barContainerStyle = {
  position: "absolute",
  bottom: 30,
  left: 40,
  right: 40,
  zIndex: 25,
};

const barTrackStyle = {
  position: "relative",
  height: "4px",
  borderRadius: "2px",
  overflow: "hidden",
  backgroundColor: "rgba(255,255,255,0.15)",
};
