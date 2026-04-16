function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hashStringToUnitInterval(input: string) {
  // Simple deterministic hash -> [0, 1)
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Unsigned -> [0, 1)
  return (h >>> 0) / 2 ** 32;
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function makeWavPcm16Mono(samples: Int16Array, sampleRate: number) {
  const bytesPerSample = 2;
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");

  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let o = 44;
  for (let i = 0; i < samples.length; i += 1) {
    view.setInt16(o, samples[i]!, true);
    o += 2;
  }

  return new Uint8Array(buffer);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const trackId = url.searchParams.get("trackId") ?? "";
  const bpmRaw = url.searchParams.get("bpm");
  const bpm = bpmRaw && /^[0-9]+$/.test(bpmRaw) ? Number(bpmRaw) : undefined;

  const durationMsRaw = url.searchParams.get("ms");
  const durationMs = clamp(
    durationMsRaw && /^[0-9]+$/.test(durationMsRaw) ? Number(durationMsRaw) : 1200,
    200,
    3000,
  );

  const sampleRate = 44100;
  const totalSamples = Math.floor((durationMs / 1000) * sampleRate);

  // Deterministic frequency (pleasant range)
  const unit = hashStringToUnitInterval(`${trackId}:${bpm ?? ""}`);
  const base = bpm ? 180 + (bpm % 120) * 2.5 : 220;
  const freq = clamp(base + unit * 260, 110, 880);

  const amp = 0.22;
  const fadeSamples = Math.floor(sampleRate * 0.02); // 20ms

  const pcm = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const x = Math.sin(2 * Math.PI * freq * t);

    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > totalSamples - fadeSamples) env = (totalSamples - i) / fadeSamples;

    const v = x * amp * env;
    pcm[i] = clamp(Math.round(v * 32767), -32768, 32767);
  }

  const wav = makeWavPcm16Mono(pcm, sampleRate);

  return new Response(wav, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
