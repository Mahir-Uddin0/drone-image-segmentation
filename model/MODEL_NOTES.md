# SegFormer-B2 Model Notes

## Model: `nvidia/segformer-b2-finetuned-ade-512-512`

| Property | Detail |
|---|---|
| Architecture | Mix Transformer (MiT-B2) encoder + All-MLP decoder |
| Pretrained | ImageNet-1K → ADE20K fine-tune (150 classes) |
| Input | Any size (processor resizes to 512×512 internally) |
| Output | Per-pixel class logits → argmax seg map |
| Model size | ~85 MB |
| CPU inference | ~2–4 s at 512×512; ~5–8 s for full drone image with thumbnail |
| GPU inference | ~0.2–0.5 s |
| License | Apache 2.0 |

## Why ADE20K over Cityscapes
- 150 classes cover buildings, trees, vegetation, water, roads (all relevant for Dhaka aerial views)
- Cityscapes only has 19 classes and lacks tree/vegetation

## Inference Pipeline (see `services/segformer_service.py`)
1. Open image with PIL, thumbnail to 2048 px max side
2. `SegformerImageProcessor` normalises and resizes to 512×512
3. Forward pass → logits `(1, 150, H/4, W/4)`
4. Bilinear upsample to original image size
5. Softmax → per-pixel class probabilities
6. Argmax → integer seg map `(H, W)`
7. Per-class: mean probability of class in its predicted pixels = confidence
8. `cv2.connectedComponentsWithStats` → tight bounding box per class
9. Colour palette → RGBA PNG overlay saved to `outputs/`

## Relevant ADE20K Classes for Drone/Kafrul Imagery
| ID | Label | Color |
|---|---|---|
| 1 | building | `#FF6B6B` |
| 4 | tree | `#4CAF50` |
| 6 | road | `#9E9E9E` |
| 9 | grass | `#8BC34A` |
| 12 | sidewalk | `#795548` |
| 17 | vegetation | `#33691E` |
| 20 | car | `#FF9800` |
| 21 | water | `#2196F3` |
| 29 | fence | `#BDBDBD` |
