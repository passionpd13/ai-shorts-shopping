import { Composition } from "remotion";
import { ShoppingShorts } from "./ShoppingShorts.jsx";

export const RemotionRoot = () => {
  return (
    <Composition
      id="ShoppingShorts"
      component={ShoppingShorts}
      durationInFrames={1200}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        script: "솔직히 화장품은 기대를 안 하게 됐었어요. 아무리 발라도 오후만 되면 당기고 파운데이션은 갈라지고 겨울마다 같은 고민 반복하고 계시지 않나요? 그러다 히알루론 수분 크림을 써봤는데 바르자마자 흡수가 다르더라고요. 끈적임 없이 쏙 들어가는데 저녁까지 촉촉함이 남아있어요. 이건 진짜 주변 언니들한테 다 알려줬어요. 관심 있는 분은 댓글에 피부 한 글자만 남겨주세요.",
        commentKeyword: "피부",
        productName: "히알루론 수분 크림",
        timestamps: [],
        ttsDuration: 40,
        ttsPath: "",
        videoPath: "",
        outputWidth: 1080,
        outputHeight: 1920,
        fps: 30,
      }}
    />
  );
};
