#!/usr/bin/env bash
# Frames arrive irregularly from the screencast, so the concat list carries a real
# duration per frame and the encoder resamples to a constant 24fps. Encoding from a
# fixed -framerate instead would stretch quiet passages and compress busy ones.
set -e
FF="C:/Users/Sigoff/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe"
DIR="exploration/review-video/_cdp/frames-$1"
OUT="exploration/review-video/$2.mp4"
"$FF" -hide_banner -loglevel error -f concat -safe 0 -i "$DIR/list.txt" \
  -vsync cfr -r 24 -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -y "$OUT"
"$FF" -hide_banner -i "$OUT" 2>&1 | grep -E "Duration|Stream #0:0"
