declare module 'recorder-js' {
  export interface RecorderResult {
    blob: Blob;
    buffer: Float32Array[];
  }

  export default class Recorder {
    constructor(audioContext: AudioContext);
    init(stream: MediaStream): Promise<void>;
    start(): void;
    stop(): Promise<RecorderResult>;
    stream: MediaStream;
    context: AudioContext;
  }
}
