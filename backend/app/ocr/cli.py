"""
Standalone OCR CLI runner for LabelLens.
Usage: python -m app.ocr.cli path/to/label.jpg
Loads RapidOCR (PaddleOCR ONNX Runtime), runs inference, and outputs text, boxes, and confidences.
"""
import sys
import os
import json
import time

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from services.ocr_service import OCRService

def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.ocr.cli <path_to_label_image>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: File not found at '{image_path}'")
        sys.exit(1)

    print("==================================================")
    print("           LABELLENS STANDALONE OCR CLI           ")
    print("==================================================")
    print(f"Image: {image_path}")

    t0 = time.time()
    ocr = OCRService()
    init_time = time.time() - t0
    print(f"Model Init Time: {round(init_time, 3)}s (Engine: RapidOCR ONNX)")

    t1 = time.time()
    raw_text, avg_conf, boxes = ocr.run_raw_ocr(image_path)
    inference_time = time.time() - t1

    print(f"Inference Latency: {round(inference_time, 3)}s")
    print(f"Average Confidence: {round(avg_conf, 4)}")
    print(f"Total Detected Boxes: {len(boxes)}")
    print("--------------------------------------------------")
    print("DETECTED TEXT LINES:")
    print(raw_text if raw_text else "[No text detected]")
    print("--------------------------------------------------")
    print(f"BOUNDING BOXES ({len(boxes)} items):")
    for idx, b in enumerate(boxes):
        print(f"  [{idx+1:02d}] conf={b.get('confidence', 0.0):.4f} | text=\"{b.get('text', '')}\" | box={b.get('box')}")
    print("==================================================")

if __name__ == "__main__":
    main()
