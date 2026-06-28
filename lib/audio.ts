import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";

let currentPlayer: AudioPlayer | null = null;

// 질문 오디오(base64 WAV)를 캐시 파일로 쓴 뒤 재생한다.
// onFinish: 재생이 끝까지 완료되면 한 번 호출된다. stopCurrent로 중간에 멈추면 호출되지 않는다.
export async function playBase64Wav(
  base64: string,
  onFinish?: () => void,
): Promise<void> {
  stopCurrent();

  const file = new File(Paths.cache, "recall-question.wav");
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(base64, { encoding: "base64" });

  const player = createAudioPlayer(file.uri);
  currentPlayer = player;

  if (onFinish) {
    const subscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          onFinish();
        }
      },
    );
  }

  player.play();
}

export function stopCurrent(): void {
  if (currentPlayer) {
    try {
      currentPlayer.remove();
    } catch {
      // 이미 해제된 경우 무시
    }
    currentPlayer = null;
  }
}
