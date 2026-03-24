import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { TypoSubtitle } from "./components/TypoSubtitle.jsx";
import { SceneTransition } from "./components/SceneTransition.jsx";
import { KeywordCTA } from "./components/KeywordCTA.jsx";
import { ProgressBar } from "./components/ProgressBar.jsx";
import { getScenes } from "./lib/scenes.js";

export const ShoppingShorts = ({
  script,
  commentKeyword,
  productName,
  timestamps,
  ttsDuration,
  ttsPath,
  videoPath,
  fps = 30,
}) => {
  const totalDuration = Math.ceil(ttsDuration * fps);
  const scenes = getScenes(ttsDuration, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Background Video */}
      {videoPath ? (
        <OffthreadVideo
          src={videoPath.startsWith("http") ? videoPath : staticFile(videoPath)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        />
      )}

      {/* Layer 2: Scene Transitions + Gradient Overlay */}
      <SceneTransition scenes={scenes} fps={fps} />

      {/* Layer 3: Typo Subtitle */}
      <Sequence from={0} durationInFrames={totalDuration}>
        <TypoSubtitle
          timestamps={timestamps}
          script={script}
          productName={productName}
          commentKeyword={commentKeyword}
          fps={fps}
        />
      </Sequence>

      {/* Layer 4: Keyword CTA (last 5 seconds) */}
      <Sequence from={Math.floor((ttsDuration - 5) * fps)} durationInFrames={Math.ceil(5 * fps)}>
        <KeywordCTA keyword={commentKeyword} fps={fps} />
      </Sequence>

      {/* Layer 5: Progress Bar */}
      <ProgressBar scenes={scenes} totalFrames={totalDuration} fps={fps} />

      {/* Layer 6: TTS Audio */}
      {ttsPath && (
        <Audio
          src={ttsPath.startsWith("http") ? ttsPath : staticFile(ttsPath)}
          volume={1}
        />
      )}
    </AbsoluteFill>
  );
};
