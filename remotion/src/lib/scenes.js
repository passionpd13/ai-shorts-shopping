/**
 * 40초 쇼핑 쇼츠를 5개 씬(구간)으로 분할합니다.
 *
 * [0:00~0:03] 후킹 — 빨간색
 * [0:03~0:10] 공감 — 주황색
 * [0:10~0:28] 체험 — 파란색 (핵심)
 * [0:28~0:35] 마무리 — 보라색
 * [0:35~0:40] 키워드 — 금색
 */
export function getScenes(totalDuration = 40, fps = 30) {
  const scenes = [
    {
      label: "후킹",
      startTime: 0,
      endTime: 3,
      color: "#FF4444",
      labelColor: "#FF6B6B",
      overlayOpacity: 0.3,
    },
    {
      label: "공감",
      startTime: 3,
      endTime: 10,
      color: "#FF8C00",
      labelColor: "#FFA940",
      overlayOpacity: 0.35,
    },
    {
      label: "체험",
      startTime: 10,
      endTime: 28,
      color: "#4A90D9",
      labelColor: "#69B1FF",
      overlayOpacity: 0.4,
    },
    {
      label: "마무리",
      startTime: 28,
      endTime: 35,
      color: "#9B59B6",
      labelColor: "#B37FEB",
      overlayOpacity: 0.45,
    },
    {
      label: "키워드",
      startTime: 35,
      endTime: totalDuration,
      color: "#FFD700",
      labelColor: "#FFD700",
      overlayOpacity: 0.5,
    },
  ];

  return scenes.map((scene) => ({
    ...scene,
    startFrame: Math.floor(scene.startTime * fps),
    durationFrames: Math.floor((scene.endTime - scene.startTime) * fps),
  }));
}
