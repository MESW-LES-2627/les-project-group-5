# AI Log - Iteration 1

## Tools used
Figma AI / Code Layer Generation Tool: Used text prompts combined with reference sketches to generate and iteratively update the UI/UX prototype screens for a webcam-powered music instrument web app (covering instrument pages with layout variations, settings, and melody-game flows). Used natural language commands to modify specific UI elements, rename components, change layouts (e.g., adjusting piano key alignment, removing pad layouts, separating overlapping indicators).

Claude: During the integration phase, Claude was used to map and match the code exported from Figma to our existing project structure.

## One place the model was wrong
Figma: Piano Key Alignment & Scaling: The model initially misplaced the black keys on the Piano layout because the scale sequence included the last 'C', which disrupted the standard octave scaling and spacing compared to a regular octave from C to B.

Claude: Unwanted File Modifications and Variable Renaming. These unauthorized alterations disrupted existing dependencies, leading to unexpected bugs and requiring substantial additional time and effort from the development team to troubleshoot, debug, and revert the unintended changes.

