---
name: proto-image-gen
description: Generate AI bitmap visual designs for Proto prototype/product ideas in the Proto-me workspace, including concept images, UI/UX interface screens, prototype mockups, vector-style illustrations, flat posters, and infographics with requested in-image text. Use after proto-me Q&A or whenever the user asks to visualize a prototype/product direction. If an AI image holder is selected, fill it; otherwise insert the generated visual to the right of the current text/brief area without covering it.
---

# Proto-me Image Gen

Use this skill when the user wants an AI-generated visual design placed into the Proto-me workspace. It is specialized for making product prototype ideas visible: concept images, UI/UX interface screens, prototype mockups, vector-style illustrations, flat posters, and infographics.

A selected AI image holder gives a precise size and placement target, but it is not required. Without a holder, generate the visual anyway and insert it to the right of the current text or product-brief whiteboard so the image extends the planning area without covering it.

## Preconditions

The Proto-me service should be running for the user's active project, usually at:

```text
http://127.0.0.1:43217
```

New holders are tldraw `frame` shapes with:

```json
{
  "type": "frame",
  "meta": {
    "protoMeAiImageHolder": true
  }
}
```

Older canvases may still contain legacy `geo` rectangle holders with the same
meta flag. Support both shapes.

## Workflow

1. Read the selected shape from Proto-me:

   ```bash
   curl -s http://127.0.0.1:43217/api/selection
   ```

   You can also use the Proto-me MCP `get_proto_me_selection` tool if it is available.

   For standalone visual-design generation, also inspect the current page/canvas state enough to identify the active text area. Prefer current product-brief whiteboard text, selected text/note shapes, or the rightmost text shape on the current page as the placement anchor.

2. Check whether exactly one selected shape is an AI image holder. A holder is any selected shape with either:

   ```text
   isAiImageHolder: true
   ```

   or:

   ```text
   meta.protoMeAiImageHolder: true
   ```

   If yes, use the holder workflow below. If not, do not ask the user to select a holder; use the standalone workflow below and insert the generated image into the current Proto-me page.

3. Choose the placement workflow.

   Holder workflow: use the selected holder's `props.w` and `props.h` as the size contract for both generation and placement. Before generating, derive and keep these values:

   - `targetWidth`: selected holder `props.w`
   - `targetHeight`: selected holder `props.h`
   - `targetAspectRatio`: the reduced `targetWidth:targetHeight` ratio when it maps cleanly, plus the decimal `targetWidth / targetHeight`

   If the selected holder matches a Proto-me ratio preset such as `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `16:9`, or `9:16`, use that preset label as the human-readable aspect ratio. The generated image should be composed for this target size and aspect ratio, and should not rely on later stretching or cropping to fit the holder.

   If the holder `type` is `frame`, insert the generated image as a child of the frame:

   - `parentId`: holder shape id
   - `x`: `0`
   - `y`: `0`
   - `rotation`: `0`
   - `props.w`, `props.h`: same as holder

   This makes the generated image move with the frame.

   If the holder is a legacy `geo` rectangle, keep using the legacy placement contract: same `x`, `y`, `rotation`, `parentId`, `props.w`, and `props.h` as the holder.

   Standalone workflow: when no AI holder is selected, generate the image anyway and insert it as a normal image shape on the current page. Place it to the right of the current canvas text area, not on top of the text.

   Choose the standalone placement anchor in this order:

   - selected text, note, product-brief, flow, feature, decision, or done-criteria node
   - the rightmost text/note shape in the current product-brief whiteboard
   - the rightmost text/note shape on the current page
   - a selected non-holder shape that is useful as context
   - a clear page area when no anchor is available

   Prefer the Proto-me MCP `insert_proto_me_image` tool for standalone insertion. Pass the chosen text/brief anchor as `anchorShapeId`, `placement: "right"`, `margin: 40`, and `matchAnchor: false`. If a specific display size or aspect ratio was requested, pass `displayWidth` and `displayHeight`; otherwise use the generated bitmap's natural aspect ratio and a practical display width such as 512-768 canvas units. The insertion result must not cover the text area; if a dry run or returned bounds show overlap, choose a farther-right text anchor or retry with a larger margin.

   For UI design, app prototype, page mockup, or screen mockup requests, the default standalone image must show the target product screen itself, not a design board. Do not add adjacent annotation panels, component notes, responsive previews, desktop companion panels, marketing copy blocks, or side-by-side device comparisons unless the user explicitly asks for a design board, presentation board, comparison, multiple responsive views, or explanatory annotations. If the brief says mobile-first or single-screen app, generate a single app screen in the appropriate device/frame or viewport.

   **Frontend Design Quality**: For any UI/UX screen, app prototype, page mockup, web interface, or frontend-related visual generation, apply the `proto-frontend-design` skill's aesthetic philosophies and guidelines. Before composing the image generation prompt:

   - Choose or honor a named aesthetic philosophy (Dieter Rams, Swiss, Japanese Minimalism, Scandinavian, Art Deco, Editorial, Brutalist, Neo-Memphis, or another fitting direction). State the choice in the prompt.
   - Apply the philosophy's typography, color, layout, spacing, and detail treatment to the image prompt description: specify font style, color palette mood, layout structure, and visual detail style rather than leaving these to the image model's defaults.
   - Follow the anti-pattern rules: never describe generic AI aesthetics (purple gradients on white, predictable card grids, Inter/Roboto typography look) in the image prompt. Describe distinctive, context-specific design choices.
   - For dark mode screens, describe warm or cool dark backgrounds matching the aesthetic philosophy, off-white text, and adjusted shadow treatment.
   - For mobile screens, ensure the prompt describes proper touch-friendly spacing, appropriate text hierarchy, and mobile navigation patterns.

   The visual design image should look like it was designed by a human with a clear aesthetic point of view, not generated by an AI with default settings.

4. Generate the bitmap with the built-in `imagegen` skill unless the user explicitly requests another image path. If the requested asset needs visible copy, labels, poster text, ad text, UI text, or typography, include that text directly in the image generation prompt and let the image model produce the final bitmap. Do not default to generating a text-free background and then adding text locally unless the user explicitly asks for local typography, deterministic text overlay, SVG/vector output, or another non-imagegen layout step.

   Product-visualization prompts must be concrete about the asset type and prototype intent. Include the target product, audience, use case, visual artifact type, screen/device or poster/infographic format, key user-facing content, desired tone, and any constraints from the product brief. For example, specify whether the output is a single mobile app screen, desktop web screen, concept image, clickable prototype mockup, vector-style hero illustration, flat event poster, or explanatory infographic.

   UI generation prompts must not invent extra product surface area outside the requested app screen. If a useful detail such as progress, categories, or next items belongs in the product, place it inside the app screen itself. Do not place it as a separate right-side explanation panel unless the user asked for that board layout.

   For the holder workflow, the image generation request must explicitly include the selected holder's target size and aspect ratio. Add this information to the model prompt, for example:

   ```text
   Target canvas slot: 512 x 683 canvas units.
   Target aspect ratio: 3:4 (0.75 width/height).
   Compose the final bitmap for this portrait ratio so it fits the slot without cropping or stretching.
   ```

   If the image generation tool or model accepts size or aspect-ratio parameters, pass the closest supported option in addition to the prompt text. If only prompt text is available, the prompt text must still include `targetWidth`, `targetHeight`, and `targetAspectRatio`.

   Resolve the actual local output image carefully before inserting it into Proto-me. Do not assume the built-in image generation flow always writes a fresh file under `$CODEX_HOME/generated_images`.

   Preferred resolution order:

   - Use the exact local image path returned by the current image generation tool call when one is available.
   - If no new file path is returned, inspect the current Codex session JSONL for the current request and extract the PNG/base64 payload from the latest `image_generation_call.result`, then write it to a timestamped output filename.
   - Use `$CODEX_HOME/generated_images` only when you can prove the file was created by the current request, for example by matching its timestamp after this generation step. Never pick an older image merely because it is the newest file in a stale generated_images directory.

   Before inserting the resolved file into Proto-me, visually inspect the local bitmap and confirm it is the newly generated image for this request, not a stale generated asset.

   For project-bound output, copy the resolved generated image into the selected page's asset folder:

   ```text
   canvas/<slug>/pages/<page-id-without-page-prefix>/assets/
   ```

   If the current session has a product or feature `canvasSlug`, pass that same `canvasSlug` to Proto-me MCP tools instead of relying on the shared project `canvas` root.

5. Insert the generated image as a new tldraw image shape.

   For the holder workflow, place it exactly over the holder:

   - `type`: `image`
   - `parentId`: holder id for frame holders, same as holder parent for legacy geo holders
   - `x`, `y`, `rotation`: `0`, `0`, `0` for frame holders, same as holder for legacy geo holders
   - `props.w`, `props.h`: same as holder
   - `props.assetId`: the new image asset id
   - `meta.protoMeGeneratedForAiImageHolder`: holder shape id

   For the standalone workflow, prefer `insert_proto_me_image`:

   ```json
   {
     "imagePath": "/absolute/path/to/prototype-visual.png",
     "projectDir": "/absolute/path/to/user/codex-project",
     "canvasSlug": "<current-product-or-feature-slug>",
     "protoMeUrl": "http://127.0.0.1:43217",
     "anchorShapeId": "<rightmost current text/brief shape id when available>",
     "placement": "right",
     "margin": 40,
     "matchAnchor": false,
     "shapeMeta": {
       "protoMeGeneratedStandalone": true,
       "protoMePrototypeVisualDesign": true,
       "protoMeVisualDesignType": "<concept|ui-ux|prototype|illustration|poster|infographic>"
     },
     "altText": "Prototype visual design generated for Proto-me"
   }
   ```

   The MCP tool copies the bitmap into the page-local assets folder, creates the tldraw image asset and shape, places it beside the anchor or a clear page area, avoids overlaps, and saves through the running Proto-me service. Fallback only when MCP is unavailable: insert a normal tldraw image shape on the current page with display size matching the generated bitmap aspect ratio, and compute `x`, `y` to the right of the current text area without covering text.

6. Do not delete the holder unless the user explicitly asks for replacement. Keeping the holder lets Codex identify the intended slot again later. In the standalone workflow, do not create a holder first unless the user explicitly asks for one.

7. Save through Proto-me's API or edit the page snapshot carefully:

   ```bash
   curl -s http://127.0.0.1:43217/api/canvas
   ```

   Prefer page-local asset URLs in the image asset:

   ```text
   /page-assets/<page-id-without-page-prefix>/<filename>
   ```

8. Refresh or let the browser hot-reload, then confirm the inserted shape id, final dimensions, target aspect ratio, and saved asset path. Include the holder id only when the holder workflow was used.

9. After generation, tell the user they can use `proto-image-edit` to revise the visual design, or call `proto-plan` to move into the Agent and Execute stages.

### Progress indicator

During this Design-stage skill, append this progress line at the end of user-facing messages when the broader Proto-me flow is active:

```text
✓ Explore  ✓ Plan  ● Design  ○ Agent  ○ Refine  ○ Execute
```

Use labels translated into the user's language when the user is not writing in English. Keep the same phase meaning as `Explore / Plan / Design / Agent / Refine / Execute`.

## Notes

- If the holder is a legacy rotated `geo` rectangle, preserve the same `rotation` on the image. For `frame` holders, the frame owns placement and the child image should stay unrotated inside it.
- If there is already a generated image for the same holder and the user asks to replace it, remove or update that generated image shape instead of piling another copy on top.
- Do not refuse generation solely because no AI image holder is selected. Generate the bitmap and insert it into the current Proto-me page.
- Never overwrite an existing asset file without an explicit replace request; use a timestamped filename.
- Do not place standalone visual designs on top of current text, product-brief whiteboard nodes, or Q&A planning notes. The default standalone placement is to the right of that text area.
