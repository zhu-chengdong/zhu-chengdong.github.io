York-Tank 64 — research preview (working title)
Metadata verified 2026-11-01. New archive, licence, DOI and final citation pending.
This collection is distinct from the published 16-sequence York-Tank release.

CONTENTS
catalog.json: 64 sequence records with original bag basenames, original/crop
image-header ranges, counts, descriptors, baseline states, run IDs, rerun provenance and preview references.
sequences.csv: flattened metadata; empty numeric cells mean missing, not zero.
calibration.json: native and rectified camera parameters, current solver board
definition, historical candidate board-to-left input matrix and status.
analysis.json: v007 same-date matched factor comparisons and combined conditions.

Import *_ns columns as TEXT. They are original integer nanoseconds; converting
to IEEE-754 double or spreadsheet numeric cells loses precision. No timestamp
reset or cross-device offset/drift fitting is applied. The current pipeline
assumes a shared clock and uses the same crop interval for both devices.

SCOPE
64 recordings: sequence_02 reference (12), sequence_03 low light (8),
sequence_04 non-uniform light (8), sequence_05 rapid motion/rotation/viewpoint (8),
sequence_06 low texture (8), sequence_07 moving objects (8), sequence_08 combined
conditions (12). Dates: 2026-03-27 and 2026-03-31. No easy/hard labels.
59,472 retained stereo pairs; summed crop windows 2,974.92776809 seconds.
Stereo: OV9281 hardware-synchronized global-shutter, 1280x800 per eye, nominal
20 Hz. Original ROS image is 2560x800 mono8: left half then right half.
Reference camera: above-water OV2311, 1600x1300, nominal 20 Hz.
All 64 cropped stereo bags retain /imu/data; calibration/timing and inertial
SLAM are not validated in this pass. Baseline is stereo only, without IMU.

FIELD DEFINITIONS
id: stable P001–P064 sequence key; filenames are provenance, not treatment levels.
duration_s: inclusive shared crop-bound span, seconds. Not file size.
stereo_pairs: retained synchronized left/right image pairs.
raw_stereo_pairs: original, untrimmed stereo image message count.
gt_frames / gt_valid_pct: overhead image and board-solver validity counts.
gt_reprojection_median_px: internal PnP reprojection RMSE, pixels; not physical
metric ground-truth accuracy.
raw_mean_gray / right_mean_gray: mean native full-frame mono8 intensity across
ALL retained raw frames, range 0–255. No enhancement, no PWM substitution.
dark_le030_pct: mean sampled native full-frame fraction with intensity <=30.
bright_ge250_pct: mean sampled fraction >=250 (near saturation).
bright_ge255_pct: mean sampled fraction exactly 255 (full saturation).
spatial_cv_median: median per-frame coefficient of variation of 8x8 tile means.
Scene structure contributes; this is not an independent illumination estimate.
corner_density_median: Shi–Tomasi corner count per megapixel after INTER_AREA
resize to 640x400. qualityLevel=0.01, minDistance=4, blockSize=3, minimum
eigenvalue >=0.0001. Same settings for all recordings.
dynamic_area_mean_pct: semantic shark+stick union mask fraction, confidence
0.25. Hand/edge false positives remain. Not manual pixel-motion ground truth.
*_conf010 / *_conf050: sensitivity at confidence 0.1 and 0.5.
board_speed_p95_m_s: P95 board-centre translational speed over approximately
0.5s windows, m/s. This is not the left-camera translational velocity.
angular_speed_p95_deg_s: P95 board rotation-rate magnitude, degrees/s.
Image descriptors except full-sequence mean brightness use 5 Hz samples:
14,876 stereo pairs / 29,752 images. WebP preview derivatives do not feed metrics.
Preview images: fixed temporal 25/50/75% positions in the sampled frame order,
640x400 display derivatives, without gain/enhancement. Not outcome selected.

POSE REFERENCE
Current board solver: 3x3 tag36h11 IDs0–8, 80mm tags, 20mm gaps, central tag4
origin; board dimensions still require physical author confirmation.
Require >=2 detected tags. No pose filling or temporal filtering.
T_world_left_rectified = T_world_board @ T_board_left_rectified.
The latter is historical orb_combined, fit using P008/P009; both recordings are
flagged reference_fit_source. It is NOT an independently validated physical
extrinsic. The processor applies SVD orthogonal rotation projection before use.
Approximately 0.8m below the board centre is an observed mechanical relation,
not a full 6-DoF calibration. Low ATE does not establish independent GT accuracy.
TUM trajectory convention: timestamp[s] tx ty tz[m] qx qy qz qw.
Rectified-image intrinsics and raw camera intrinsics are distinct.

BASELINE
ORB-SLAM3 stereo, fixed core; no IMU. SE3 fixed-scale alignment, association
tolerance strictly <40ms, time offset 0. ate_rmse_cm is ATE RMSE in centimetres
against the candidate left-camera reference, on valid matched trajectories.
completeness_pct = 100*Nv/NI, Nv longest continuous valid matched segment,
NI input image pair count. Not all saved poses / all inputs.
tracking_ok_pct: algorithm frame tracking OK fraction; not completeness.
Original first run: 55 numeric ATE, 56 numeric completeness.
Current v008: 60 numeric ATE, 64 numeric completeness.
Selection: 56 unchanged first runs plus exactly one fixed export-safe rerun for
each of the original 8 exceptions. All reruns are reported, not best-of trials.
The tracking library, image inputs, GT, calibration and parameters are unchanged.
P006/P039/P040 remain genuinely uninitialized, C=0 and ATE missing.
P032/P045 original NaN aborts did not recur; no permanent numerical fix claimed.
Original trajectories/logs are preserved and 8 new run IDs are separately indexed. P021 has one pose, no ATE, completeness
0.1358695652%. Missing is never silently zero-filled or removed from inventory.
P006/P039/P040: no initialization / empty-map export error.
P032/P045: numerical abort.
P007/P053/P054: canonical trajectory saved, secondary export error; evaluation
unavailable. These 8 historical first-run statuses are distinct from dataset quality; current outcomes are in repair-summary.json.
All 64 preprocessing receipts PASS and original source hash checks unchanged.

COMPARISONS
Do not interpret a pooled 64-sequence correlation as a single-factor effect.
v008 preserves every original v006/v007 pairing. Primary factor matches stratify by date and use brightness ratio <=1.25.
Texture/dynamic comparisons additionally use board speed ratio <=1.25 and
rotation-rate ratio <=1.30. Motion comparisons do not match away motion.
Maximum-cardinality, minimum-covariate-distance matching without replacement
within date/comparison; no SLAM outcomes or status in pair selection. Missing
outcomes are not rematched. These are observational comparisons, not randomized
causal effects. sequence8 combined conditions are described separately.
Ambient lighting and later water changes are not separately measured. There
is no dedicated overexposure group, physical turbidity reading, or frame-level
PWM record. P019 is low texture, not an overexposure treatment.

PUBLICATION STATUS
No new 64-recording DOI/licence/citation is assigned by this preview.
The related 16-sequence York-Tank publication and DOI refer to earlier work.
Contacts: Chengdong Zhu (chengdong.zhu@york.ac.uk), Mark Post
(mark.post@york.ac.uk), University of York.
