/* ==================================================================================
   REFERENCE_DERIVED_VISUAL — the site, read off the published civil plan.

   EVERYTHING IN THIS FILE IS VISUAL GEOMETRY. It is NOT survey-certified and nothing
   here may be quoted as a dimension, an area or a capacity. It exists so the compound
   sits in a place rather than on a bare plate, and that is the whole of its warrant.

   How it was derived, so the next person can check it rather than trust it:

   The civil plan render in the Luxe Corsa Figma file (node 1091:984, 1296 x 712) shows
   the parcel, the drive network, the roundabout, the retention basin and the planted
   areas. Eleven building badges appear on BOTH that render and in `compound.json`,
   which the extractor measured independently — so the two share five known point
   correspondences and a single similarity transform maps one into the other:

       data_x = 1.1521 * px - 189.18
       data_y = 1.1577 * py - 162.76

   Fitted across five badges, that transform reproduces every one of them to within
   about one unit (~1.3 feet), which is well inside the thickness of the lines on the
   source render. Features below were read off that render in pixels and pushed through
   it. The transform is the evidence; the coordinates are its output.

   WHAT THIS IS NOT: it is not a survey, the basin outline is traced from a rendered
   curve rather than from a contour, and the planting is placed by composition inside
   areas the plan shows as landscape. Where `compound.json` and this file disagree,
   `compound.json` wins — it is measured and this is read.
   ================================================================================== */

export const PROVENANCE = 'REFERENCE_DERIVED_VISUAL'

/* THE ROUNDABOUT. The drive's one geometric event, and the reason the two halves of
   the compound read as one circulation system rather than two clusters. Drawn on the
   plan as two concentric circles: the carriageway and a planted central island. */
export const roundabout = {
  provenance: PROVENANCE,
  cx: 593.1,
  cy: 236.6,
  outer: 59.9,
  island: 32.3,
}

/* THE TURNING HEAD at the dealership end, where the drive terminates. Smaller, and it
   anchors the composition's bottom-left corner — which is exactly the region the last
   pass left empty. */
export const culDeSac = {
  provenance: PROVENANCE,
  cx: 104.6,
  cy: 471.6,
  outer: 30.0,
  island: 14.0,
}

/* THE RETENTION BASIN, north-east of building 07. On the plan it is a closed organic
   form and it sits PARTLY OUTSIDE the measured parcel envelope — which is useful as
   well as true: it carries the ground past the hard edge of the plate and gives the
   compound somewhere to sit rather than something to stop at. */
export const pond = {
  provenance: PROVENANCE,
  outline: [
    [847.7, -23.8], [882.3, -75.9], [945.6, -104.9], [1003.3, -91.0],
    [1015.9, -33.1], [997.5, 24.8], [961.8, 86.1], [916.8, 132.4],
    [870.8, 145.2], [839.7, 103.5], [829.3, 41.0],
  ],
}

/* LANDSCAPED ZONES. Areas the plan shows as planted rather than paved, as simple
   convex forms — they are ground treatment, not objects, and they exist to give the
   site a second material and to hold the planting masses that frame the architecture.
   Radii are generous and deliberately soft-edged. */
export const landscape = [
  { provenance: PROVENANCE, cx: 470, cy: 150, r: 92 },   /* between the club and 04/05 */
  { provenance: PROVENANCE, cx: 355, cy: 300, r: 74 },   /* the island inside the loop */
  { provenance: PROVENANCE, cx: 690, cy: 330, r: 88 },   /* south of the roundabout */
  { provenance: PROVENANCE, cx: 175, cy: 175, r: 96 },   /* the western verge */
  { provenance: PROVENANCE, cx: 120, cy: 330, r: 72 },   /* dealership frontage */
  { provenance: PROVENANCE, cx: 620, cy: 470, r: 104 },  /* the southern edge */
  { provenance: PROVENANCE, cx: 980, cy: 400, r: 86 },   /* east of 09/11 */
]
