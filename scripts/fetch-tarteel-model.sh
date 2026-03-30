#!/bin/sh
# Download offline-tarteel model files to apps/web/public/models/
# Run once before first use: sh scripts/fetch-tarteel-model.sh

set -e

MODELS_DIR="apps/web/public/models"
REPO_RAW="https://raw.githubusercontent.com/yazinsai/offline-tarteel/main/web/frontend/public"
RELEASE_URL="https://github.com/yazinsai/offline-tarteel/releases/download/v0.1.0"

echo "Downloading tarteel model files to $MODELS_DIR..."

# ONNX model (~126MB) — from GitHub release
if [ ! -f "$MODELS_DIR/fastconformer_ar_ctc_q8.onnx" ]; then
  echo "Downloading ONNX model (126MB)..."
  curl -L --retry 3 -o "$MODELS_DIR/fastconformer_ar_ctc_q8.onnx" \
    "$RELEASE_URL/fastconformer_ar_ctc_q8.onnx"
else
  echo "ONNX model already exists, skipping."
fi

# Phoneme vocabulary (~1KB) — from repo
if [ ! -f "$MODELS_DIR/phoneme_vocab.json" ]; then
  echo "Downloading phoneme vocabulary..."
  curl -L --retry 3 -o "$MODELS_DIR/phoneme_vocab.json" \
    "$REPO_RAW/phoneme_vocab.json"
else
  echo "Phoneme vocab already exists, skipping."
fi

# Quran phonemes data (~5MB) — from repo
if [ ! -f "$MODELS_DIR/quran_phonemes.json" ]; then
  echo "Downloading Quran phonemes data..."
  curl -L --retry 3 -o "$MODELS_DIR/quran_phonemes.json" \
    "$REPO_RAW/quran_phonemes.json"
else
  echo "Quran phonemes already exists, skipping."
fi

echo "Done! Model files are in $MODELS_DIR"
ls -lh "$MODELS_DIR"
