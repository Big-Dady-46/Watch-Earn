/**
 * Extracts YouTube Video ID from any standard URL, youtu.be, shorts, embed or direct ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // If already 11-char alphanumeric/underscore/dash ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regular YouTube URL matches
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
}

export function getYouTubeThumbnail(videoId: string, quality: 'hq' | 'max' | 'mq' = 'hq'): string {
  if (quality === 'max') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Calculates reward in PKR based on duration:
 * Exactly 1 PKR per 1 Minute of watch time.
 * For videos with seconds, rounds to 1 decimal or at least 1 PKR.
 */
export function calculateRewardPKR(durationMinutes: number): number {
  if (durationMinutes <= 0) return 1;
  // Exactly 1 PKR per minute
  return Number((durationMinutes * 1).toFixed(1));
}

/**
 * Parses seconds into formatted string: "3m 45s" or "30s"
 */
export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/**
 * Fetches public video info from YouTube oEmbed API
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title: string; author_name: string } | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || '',
      author_name: data.author_name || '',
    };
  } catch {
    return null;
  }
}
