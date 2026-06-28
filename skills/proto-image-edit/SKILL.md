---
name: proto-image-edit
description: Revise Proto prototype/product visualization images from user-supplied Proto-me annotation screenshots. Use after proto-image-gen or whenever the user provides screenshots of concept images, UI/UX screens, prototype mockups, vector-style illustrations, posters, or infographics marked with annotation notes/arrows and wants Codex to generate clean revised bitmap images beside the originals without replacing, moving, hiding, or deleting the originals or annotations.
---

# Proto-me Image Edit

Use this Design-stage skill to turn user-provided Proto-me annotation screenshots into revised AI-generated product/prototype visualization bitmaps placed next to the corresponding original images.

It is specialized for refining visuals created for Proto prototype work: concept images, UI/UX interface screens, prototype mockups, vector-style illustrations, flat posters, and infographics. Preserve the product intent and improve the visual according to the annotations.

## Preconditions

The Proto-me service should be running for the active project, usually at:

```text
http://127.0.0.1:43217
```

The user is responsible for providing the relevant screenshot(s). Do not auto-capture the current canvas and do not scan the whole canvas to infer edit requests; a canvas may contain many images with different annotations.

## Workflow

1. Read the user-provided screenshot(s).

   Treat each screenshot as the authoritative edit brief for one output image unless the user says multiple screenshots belong to the same image.

   If the user provides multiple screenshots, process them independently and keep their generated outputs separate. Do not merge annotations across screenshots unless explicitly requested.

2. Extract the edit requirements from each screenshot.

   Read visible annotation labels, arrows, and nearby edit notes from the screenshot itself. Use the arrow tip or marked region to understand where each note applies.

   Ignore editor chrome such as toolbars, blue selection outlines, resize handles, cursor icons, and unrelated neighboring images.

3. Choose the source image for generation.

   Use the clean underlying image content visible in the provided screenshot as the visual base whenever possible.

   If the screenshot is too cropped, obstructed, or low-resolution to serve as a good image base, ask the user for the original image export or a cleaner screenshot of that specific image.

   Do not read the current Proto-me workspace to discover edit intent. Use the screenshot for the requested changes. Proto-me state may be read later only to place the generated result without covering existing content.

4. Prepare image-generation input.

   Use the provided screenshot, plus a cleaner source image if the user supplied one.

   The generation prompt should:

   - apply the annotation text as edit instructions
   - preserve the original image's product intent, subject, composition, aspect ratio, and style unless an annotation asks otherwise
   - preserve UI/UX hierarchy, product semantics, poster messaging, illustration language, or infographic structure when those are part of the source visual
   - remove all annotation artifacts from the output, including red arrows, labels, blue selection outlines, handles, and tool UI
   - output only the revised clean image

5. Generate a new bitmap.

   Use the built-in image generation flow available in the current environment. Do not overwrite the source image file. Save the new bitmap with a timestamped filename, for example:

   ```text
   annotation-edit-20260620-153012.png
   ```

   Resolve the actual local output image carefully before inserting it into Proto-me. Do not assume the built-in image generation flow always writes a fresh file under `$CODEX_HOME/generated_images`.

   Preferred resolution order:

   - Use the exact local image path returned by the current image generation tool call when one is available.
   - If no new file path is returned, inspect the current Codex session JSONL for the current request and extract the PNG/base64 payload from the latest `image_generation_call.result`, then write it to the timestamped output filename.
   - Use `$CODEX_HOME/generated_images` only when you can prove the file was created by the current request, for example by matching its timestamp after this generation step. Never pick an older image merely because it is the newest file in a stale generated_images directory.

   Before inserting the resolved file into Proto-me, visually inspect the local bitmap and confirm it is the newly generated revised image for this screenshot, not a stale generated asset.

6. Insert the revised image beside the original with Proto-me MCP.

   Prefer the Proto-me MCP `insert_proto_me_image` tool. Do not hand-write
   tldraw `asset` / `shape` records or fractional `index` keys unless the MCP
   tool is unavailable. The tool copies the bitmap into the page-local assets
   folder, creates the tldraw image asset and image shape, generates a valid
   tldraw fractional index, places the image beside the anchor while avoiding
   overlaps, and saves through the running Proto-me service.

   Add a new tldraw image asset and a new image shape. Do not update, remove, hide, reparent, or reorder the original image, the original AI image frame, or any annotation shapes.

   Prefer a clear placement anchor when one is already available:

   - If the user has selected the original image, use that image as the anchor.
   - If the user has selected the original AI image frame, use that frame as the anchor.
   - If the screenshot clearly shows the original image and there is a unique matching generated/original image or AI image frame on the current Proto-me page, use that as the anchor without asking the user to select it.
   - If there are multiple screenshots/outputs and the matching anchors are not uniquely identifiable, ask the user to select each corresponding anchor or provide an explicit placement order.
   - If no anchor is clear and the user has not required a specific side-by-side comparison, place the result in a nearby clear area on the current page where it does not cover, move, hide, or delete the original image or annotations.

   Placement rules:

   - If the source image is inside an AI image frame, use the frame's page-level bounds as the anchor and place the new image as a sibling of that frame.
   - Otherwise use the source image's own bounds and parent.
   - When the annotated source appears to have earlier revision images nearby, prefer placing the new revised image to the right of the currently annotated/source image, because older annotation outputs may already live on the left.
   - Place the new image to the right of the anchor with a margin of about `40` canvas units.
   - Match the displayed width and height of the anchor unless the user asks for a different size.
   - If that position would overlap existing content, keep moving right by `anchor width + 40` until the new image is clear.
   - If using a clear-area fallback with no anchor, keep the generated image near the annotated source page, match the likely source image size when known, and choose a position that does not overlap existing shapes.

   Recommended shape metadata:

   ```json
   {
     "protoMeGeneratedFromAnnotationEdit": true,
     "protoMeAnnotationSourceShapeId": "<selected source image or frame id>",
     "protoMeAnnotationScreenshot": "<source screenshot file name when available>"
   }
   ```

7. Save through Proto-me.

   Only do Proto-me state access after the bitmap is generated. Use this access only to insert the new image beside the anchor or in a nearby clear area, not to discover edit intent.

   Preferred MCP call shape:

   ```json
   {
     "imagePath": "/absolute/path/to/annotation-edit-20260620-153012.png",
     "projectDir": "/absolute/path/to/user/codex-project",
     "canvasSlug": "<current-product-or-feature-slug>",
     "protoMeUrl": "http://127.0.0.1:43217",
     "anchorShapeId": "<selected source image or frame id>",
     "placement": "right",
     "margin": 40,
     "matchAnchor": true,
     "fileName": "annotation-edit-20260620-153012.png",
     "annotationScreenshot": "<source screenshot file name when available>",
     "shapeMeta": {
       "protoMeGeneratedFromAnnotationEdit": true
     },
     "altText": "Revised image generated from Proto-me annotation screenshot"
   }
   ```

   If the running Proto-me service uses a Vite fallback port, pass the actual
   browser URL such as `http://127.0.0.1:43218` as `protoMeUrl`.

   The MCP tool must return the new `assetId`, `shapeId`, saved asset path,
   page id, bounds, and generated `index`. Confirm that the returned `index` is
   a valid tldraw fractional index and not a custom descriptive string.

   Fallback only when MCP is unavailable: update the required store snapshot and
   save through:

   ```bash
   curl -s -X PUT http://127.0.0.1:43217/api/canvas \
     -H 'content-type: application/json' \
     --data-binary @<updated-snapshot.json>
   ```

   In fallback mode, use page-local image asset URLs:

   ```text
   /page-assets/<page-dir>/<filename>
   ```

   The Proto-me server will preserve per-page snapshots under:

   ```text
   canvas/<slug>/pages/<page-id-without-page-prefix>/proto-me-canvas.json
   ```

8. Verify visually.

   Refresh the Proto-me tab or let Vite hot-reload, then confirm:

   - the original image is still in the same place
   - the original annotation arrows and labels are still visible
   - the new revised image appears beside the original
   - the new image does not include annotation arrows, labels, selections, or UI chrome

9. After the revised image is inserted, tell the user they can keep using `proto-image-edit` for more visual refinements, or call `proto-plan` to move into the Agent and Execute stages.

### Progress indicator

During this Design-stage skill, append this progress line at the end of user-facing messages when the broader Proto-me flow is active:

```text
✓ Explore  ✓ Plan  ● Design  ○ Agent  ○ Refine  ○ Execute
```

Use labels translated into the user's language when the user is not writing in English. Keep the same phase meaning as `Explore / Plan / Design / Agent / Refine / Execute`.

## Guardrails

- Never replace the original image unless the user explicitly asks for replacement.
- Never delete or move annotation shapes; they are the visible edit brief.
- Never put the revised image inside the original AI image frame, because that can cover the old image and make the before/after comparison harder.
- Never auto-capture or scan the current canvas for edit intent; use the screenshot(s) supplied by the user.
- If the annotations contradict each other, generate the most literal combined interpretation and mention the ambiguity.
- If a supplied screenshot shows selected-state outlines or toolbar UI, treat them as context only, not as content to generate.
- Keep revision output focused on the same prototype/product visualization type unless the annotation explicitly asks to change it.
