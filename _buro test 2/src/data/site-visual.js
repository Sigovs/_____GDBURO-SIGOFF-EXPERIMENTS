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
  /* POLYGONS, NOT CIRCLES.

     A first pass used discs, and they read exactly as what they were: compass marks on
     a plan. Planted ground on a real site is bounded by the things around it — the kerb
     line on one side, a building's setback on another, the parcel edge on a third — so
     these are irregular closed forms traced against the road network, the building
     footprints and the parcel line on the civil render. Still visual, still derived,
     but now the SHAPE carries information instead of contradicting it. */
  {
    provenance: PROVENANCE,
    note: 'the wedge between the clubhouse and the 04/05 pair, bounded by the drive',
    outline: [[400, 96], [498, 78], [556, 118], [548, 186], [470, 214], [408, 176], [386, 132]],
  },
  {
    provenance: PROVENANCE,
    note: 'the island inside the western loop',
    outline: [[300, 268], [372, 250], [416, 286], [400, 340], [332, 352], [292, 318]],
  },
  {
    provenance: PROVENANCE,
    note: 'south of the roundabout, between the drive and building 06',
    outline: [[612, 296], [706, 282], [770, 322], [762, 388], [676, 404], [610, 366]],
  },
  {
    provenance: PROVENANCE,
    note: 'the western verge along the parcel line',
    outline: [[86, 118], [190, 92], [258, 130], [250, 208], [162, 238], [92, 206], [66, 160]],
  },
  {
    provenance: PROVENANCE,
    note: 'dealership frontage, between the turning head and the boundary',
    outline: [[52, 292], [140, 276], [186, 312], [176, 372], [104, 390], [46, 352]],
  },
  {
    provenance: PROVENANCE,
    note: 'the southern edge below buildings 01 and 06',
    outline: [[452, 448], [590, 424], [724, 448], [746, 508], [640, 542], [498, 528], [438, 492]],
  },
  {
    provenance: PROVENANCE,
    note: 'east of 09 and 11, running down to the parcel edge',
    outline: [[906, 356], [1006, 340], [1062, 386], [1046, 452], [960, 470], [898, 424]],
  },
  {
    provenance: PROVENANCE,
    note: 'the north verge behind 07 and 08, tying the basin into the site',
    outline: [[736, 46], [812, 20], [878, 54], [872, 118], [796, 142], [730, 108]],
  },
]
