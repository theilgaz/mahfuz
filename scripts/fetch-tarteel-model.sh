#!/bin/sh
# Download offline-tarteel model files to apps/web/public/models/
# Run once before first use: sh scripts/fetch-tarteel-model.sh

set -e

MODELS_DIR="apps/web/public/models"
BASE_URL="https://huggingface.co/yazinsai/fastconformer-phoneme/resolve/main"

echo "Downloading tarteel model files to $MODELS_DIR..."

# ONNX model (~131MB)
if [ ! -f "$MODELS_DIR/fastconformer_ar_ctc_q8.onnx" ]; then
  echo "Downloading ONNX model (131MB)..."
  curl -L -o "$MODELS_DIR/fastconformer_ar_ctc_q8.onnx" \
    "$BASE_URL/fastconformer_phoneme_q8.onnx"
else
  echo "ONNX model already exists, skipping."
fi

# Phoneme vocabulary (~50KB)
if [ ! -f "$MODELS_DIR/phoneme_vocab.json" ]; then
  echo "Downloading phoneme vocabulary..."
  curl -L -o "$MODELS_DIR/phoneme_vocab.json" \
    "$BASE_URL/phoneme_vocab.json"
else
  echo "Phoneme vocab already exists, skipping."
fi

# Quran phonemes data (~20MB)
if [ ! -f "$MODELS_DIR/quran_phonemes.json" ]; then
  echo "Downloading Quran phonemes data..."
  curl -L -o "$MODELS_DIR/quran_phonemes.json" \
    "$BASE_URL/quran_phonemes.json"
else
  echo "Quran phonemes already exists, skipping."
fi

echo "Done! Model files are in $MODELS_DIR"
ls -lh "$MODELS_DIR"
