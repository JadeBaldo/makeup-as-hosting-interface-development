// Timing is measured in active drawing time; lifting freezes the deformation.
export const DEFORMATION_CONFIG=Object.freeze({
 durationSeconds:360,
 brushMultiplier:1.5,
 minimumRadius:2.2,
 maximumRadius:12,
 // Original peak dose rate is .28 + 1.8; growth reaches full size at dose 8.
 doseRate:8/(2.08*360),
});
