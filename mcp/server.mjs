import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import readline from "node:readline";
import { generateKeyBetween } from "fractional-indexing";
import { createTLStore, toRichText } from "tldraw";

const SERVER_NAME = "Proto-me MCP";
const SERVER_VERSION = "0.1.3";
const TOOL_GET_SELECTION = "get_proto_me_selection";
const TOOL_INSERT_IMAGE = "insert_proto_me_image";
const TOOL_UPSERT_BRIEF_WHITEBOARD = "upsert_proto_me_brief_whiteboard";
const TOOL_GET_CANVAS_TEXT = "get_proto_me_canvas_text";
const PAGE_ID_PREFIX = "page:";
const PAGE_ASSETS_ROUTE = "/page-assets/";
const CANVAS_FILE_NAME = "proto-me-canvas.json";
const RUNTIME_FILE_NAME = "proto-me-runtime.json";
const DEFAULT_PAGE_ID = "page:page";
const DOCUMENT_ID = "document:document";
const BRIEF_WHITEBOARD_META_KEY = "protoMeBriefWhiteboard";
const BRIEF_WHITEBOARD_VERSION = 1;

const JsonRpcError = {
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
};

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function finiteNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeCanvasSlug(value) {
  const raw = nonEmptyString(value);
  if (!raw) return null;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return slug || null;
}

function resolveCanvasSlug(args = {}) {
  return sanitizeCanvasSlug(args.canvasSlug) ?? sanitizeCanvasSlug(process.env.PROTO_ME_CANVAS_SLUG);
}

function resolveCanvasDir(args = {}) {
  const explicitCanvasDir = nonEmptyString(args.canvasDir);
  if (explicitCanvasDir) return pathResolve(explicitCanvasDir);

  const canvasSlug = resolveCanvasSlug(args);
  const explicitProjectDir = nonEmptyString(args.projectDir);
  if (explicitProjectDir) {
    return canvasSlug
      ? join(pathResolve(explicitProjectDir), "canvas", canvasSlug)
      : join(pathResolve(explicitProjectDir), "canvas");
  }

  const envCanvasDir = nonEmptyString(process.env.PROTO_ME_CANVAS_DIR);
  if (envCanvasDir) return pathResolve(envCanvasDir);

  const envProjectDir = nonEmptyString(process.env.PROTO_ME_PROJECT_DIR);
  if (envProjectDir) {
    return canvasSlug ? join(pathResolve(envProjectDir), "canvas", canvasSlug) : join(pathResolve(envProjectDir), "canvas");
  }

  return canvasSlug ? join(process.cwd(), "canvas", canvasSlug) : join(process.cwd(), "canvas");
}

function pathResolve(value) {
  return resolve(String(value));
}

function resolveSelectionFile(args = {}) {
  return join(resolveCanvasDir(args), "proto-me-selection.json");
}

function resolveViewStateFile(args = {}) {
  return join(resolveCanvasDir(args), "proto-me-view-state.json");
}

function resolveRuntimeFile(args = {}) {
  return join(resolveCanvasDir(args), RUNTIME_FILE_NAME);
}

function pageDirName(pageId) {
  return encodeURIComponent(pageId.replace(PAGE_ID_PREFIX, ""));
}

function pageAssetUrl(pageId, fileName) {
  return `${PAGE_ASSETS_ROUTE}${pageDirName(pageId)}/${encodeURIComponent(fileName)}`;
}

function isSafeChildPath(parent, child) {
  const pathToChild = relative(parent, child);
  return pathToChild && !pathToChild.startsWith("..") && !pathToChild.includes(`..${sep}`);
}

function sanitizeFileName(name, fallbackName = "image.png") {
  const rawName = basename(String(name || fallbackName));
  const extension = extname(rawName) || extname(fallbackName) || ".png";
  const baseName = rawName
    .slice(0, rawName.length - extname(rawName).length)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${baseName || "image"}${extension}`;
}

function sanitizeIdPart(value, fallback = "image") {
  return String(value || fallback)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}

function mimeTypeForFile(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case ".apng":
      return "image/apng";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function uniqueFilePath(dir, requestedName) {
  const safeName = sanitizeFileName(requestedName);
  const ext = extname(safeName);
  const base = safeName.slice(0, safeName.length - ext.length);
  let candidate = safeName;
  let counter = 2;
  while (true) {
    const candidatePath = join(dir, candidate);
    try {
      await stat(candidatePath);
      candidate = `${base}-v${counter}${ext}`;
      counter += 1;
    } catch (error) {
      if (error?.code === "ENOENT") return { fileName: candidate, filePath: candidatePath };
      throw error;
    }
  }
}

function uniqueRecordId(store, prefix, seed) {
  const cleanSeed = sanitizeIdPart(seed);
  let candidate = `${prefix}:${cleanSeed}`;
  let counter = 2;
  while (store[candidate]) {
    candidate = `${prefix}:${cleanSeed}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function readSelectionState(args) {
  const selectionFile = resolveSelectionFile(args);
  try {
    const selection = JSON.parse(await readFile(selectionFile, "utf8"));
    if (!selection || typeof selection !== "object" || !Array.isArray(selection.selectedShapes)) {
      throw new Error(`Invalid selection state in ${selectionFile}`);
    }
    return { selection, selectionFile };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        selection: { selectedShapes: [], updatedAt: null },
        selectionFile,
      };
    }
    throw error;
  }
}

async function readViewState(args) {
  const viewStateFile = resolveViewStateFile(args);
  try {
    const payload = JSON.parse(await readFile(viewStateFile, "utf8"));
    return payload?.viewState ?? payload;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function normalizeUrl(value) {
  return nonEmptyString(value)?.replace(/\/+$/, "") ?? null;
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

async function readRuntimeProtoMeUrl(args = {}) {
  try {
    const payload = JSON.parse(await readFile(resolveRuntimeFile(args), "utf8"));
    if (Number.isInteger(payload?.pid) && !isProcessAlive(payload.pid)) return null;
    return normalizeUrl(payload?.url || payload?.protoMeUrl);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    return null;
  }
}

async function protoMeUrlCandidates(args = {}) {
  const explicitUrl = normalizeUrl(args.protoMeUrl);
  if (explicitUrl) return [explicitUrl];

  const envUrl = normalizeUrl(process.env.PROTO_ME_URL);
  const runtimeUrl = await readRuntimeProtoMeUrl(args);
  return [...new Set([envUrl, runtimeUrl, "http://127.0.0.1:43217"].filter(Boolean))];
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

function createDefaultCanvasSnapshot() {
  const { schema } = createTLStore().getStoreSnapshot();
  return {
    schema,
    store: {
      [DOCUMENT_ID]: {
        typeName: "document",
        id: DOCUMENT_ID,
        gridSize: 10,
        name: "",
        meta: {},
      },
      [DEFAULT_PAGE_ID]: {
        typeName: "page",
        id: DEFAULT_PAGE_ID,
        name: "Page 1",
        index: "a1",
        meta: {},
      },
    },
  };
}

function ensureUsableCanvasSnapshot(snapshot) {
  const nextSnapshot =
    snapshot && typeof snapshot === "object" && snapshot.schema && snapshot.store
      ? structuredClone(snapshot)
      : createDefaultCanvasSnapshot();

  if (!nextSnapshot.store[DOCUMENT_ID]) {
    nextSnapshot.store[DOCUMENT_ID] = {
      typeName: "document",
      id: DOCUMENT_ID,
      gridSize: 10,
      name: "",
      meta: {},
    };
  }

  if (!Object.values(nextSnapshot.store).some((record) => record?.typeName === "page")) {
    nextSnapshot.store[DEFAULT_PAGE_ID] = {
      typeName: "page",
      id: DEFAULT_PAGE_ID,
      name: "Page 1",
      index: "a1",
      meta: {},
    };
  }

  return nextSnapshot;
}

async function loadCanvasSnapshot(args, { allowEmpty = false } = {}) {
  const candidates = await protoMeUrlCandidates(args);
  const expectedCanvasDir = resolveCanvasDir(args);
  let lastError = null;
  let protoMeUrl = null;
  let payload = null;
  for (const candidate of candidates) {
    try {
      const candidatePayload = await fetchJson(`${candidate}/api/canvas`);
      const servedCanvasDir = nonEmptyString(candidatePayload?.canvasDir);
      if (servedCanvasDir && pathResolve(servedCanvasDir) !== expectedCanvasDir) {
        lastError = new Error(`service uses ${servedCanvasDir}, expected ${expectedCanvasDir}`);
        continue;
      }
      if (!servedCanvasDir && resolveCanvasSlug(args)) {
        lastError = new Error(`service did not report canvasDir; expected ${expectedCanvasDir}`);
        continue;
      }
      payload = candidatePayload;
      protoMeUrl = candidate;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!payload || !protoMeUrl) {
    const runtimeFile = resolveRuntimeFile(args);
    throw new Error(
      `Could not connect to Proto-me canvas at ${candidates.join(" or ")}: ${lastError?.message ?? "unknown error"}. ` +
        `Start the Proto-me canvas service for this project and wait for ${runtimeFile} to contain the active Local URL, then retry.`
    );
  }
  const snapshot = Object.hasOwn(payload ?? {}, "snapshot") ? payload.snapshot : payload;
  if ((!snapshot || snapshot === null) && allowEmpty) {
    return { protoMeUrl, snapshot: createDefaultCanvasSnapshot(), payload };
  }
  if (!snapshot || typeof snapshot !== "object" || !snapshot.schema || !snapshot.store) {
    throw new Error(`Expected Proto-me canvas snapshot from ${protoMeUrl}/api/canvas`);
  }
  return { protoMeUrl, snapshot, payload };
}

async function saveCanvasSnapshot(protoMeUrl, snapshot) {
  return fetchJson(`${protoMeUrl}/api/canvas`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(snapshot),
  });
}

function getRecord(store, id, label) {
  const record = store[id];
  if (!record) throw new Error(`Missing ${label}: ${id}`);
  return record;
}

function findPageIdForShape(store, shapeId) {
  let record = getRecord(store, shapeId, "shape");
  const visited = new Set();
  while (record && !visited.has(record.id)) {
    visited.add(record.id);
    if (record.typeName === "page") return record.id;
    const parentId = record.parentId;
    if (!parentId) break;
    const parent = store[parentId];
    if (parent?.typeName === "page") return parent.id;
    record = parent;
  }
  return null;
}

function getPageShapes(store, pageId) {
  const shapes = [];
  const byParent = new Map();
  for (const record of Object.values(store)) {
    if (record?.typeName !== "shape") continue;
    const siblings = byParent.get(record.parentId) ?? [];
    siblings.push(record);
    byParent.set(record.parentId, siblings);
  }
  const queue = [...(byParent.get(pageId) ?? [])];
  while (queue.length > 0) {
    const shape = queue.shift();
    shapes.push(shape);
    queue.push(...(byParent.get(shape.id) ?? []));
  }
  return shapes;
}

function getPageRecords(store) {
  return Object.values(store)
    .filter((record) => record?.typeName === "page")
    .sort((a, b) => String(a.index ?? "").localeCompare(String(b.index ?? "")));
}

function shapeBelongsToPage(store, shape, pageId) {
  return findPageIdForShape(store, shape.id) === pageId;
}

function localBoundsForShape(shape) {
  if (!shape || shape.typeName !== "shape") return null;
  if (shape.type === "arrow") {
    const start = shape.props?.start ?? { x: 0, y: 0 };
    const end = shape.props?.end ?? { x: 0, y: 0 };
    const minX = Math.min(start.x ?? 0, end.x ?? 0);
    const minY = Math.min(start.y ?? 0, end.y ?? 0);
    const maxX = Math.max(start.x ?? 0, end.x ?? 0);
    const maxY = Math.max(start.y ?? 0, end.y ?? 0);
    return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  }
  const w = finiteNumber(shape.props?.w, shape.type === "text" ? 160 : 1);
  const h = finiteNumber(shape.props?.h, shape.type === "text" ? 40 : 1);
  return { x: 0, y: 0, w, h };
}

function pageBoundsForShape(store, shape) {
  const local = localBoundsForShape(shape);
  if (!local) return null;
  let x = finiteNumber(shape.x, 0) + local.x;
  let y = finiteNumber(shape.y, 0) + local.y;
  let parent = store[shape.parentId];
  const visited = new Set([shape.id]);
  while (parent?.typeName === "shape" && !visited.has(parent.id)) {
    visited.add(parent.id);
    x += finiteNumber(parent.x, 0);
    y += finiteNumber(parent.y, 0);
    parent = store[parent.parentId];
  }
  return { x, y, w: local.w, h: local.h };
}

function rectsOverlap(a, b, padding = 0) {
  return !(
    a.x + a.w + padding <= b.x ||
    b.x + b.w + padding <= a.x ||
    a.y + a.h + padding <= b.y ||
    b.y + b.h + padding <= a.y
  );
}

function chooseIndex(store, parentId) {
  const siblingIndexes = Object.values(store)
    .filter((record) => record?.typeName === "shape" && record.parentId === parentId && typeof record.index === "string")
    .map((record) => record.index)
    .sort();
  return generateKeyBetween(siblingIndexes.at(-1) ?? null, null);
}

function firstSelectedShapeId(selection) {
  return selection?.selectedShapes?.length === 1 ? selection.selectedShapes[0]?.id : null;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function resolveTargetPageId(store, args = {}, viewState = null) {
  const explicitPageId = nonEmptyString(args.pageId);
  if (explicitPageId && store[explicitPageId]?.typeName === "page") return explicitPageId;

  const viewStatePageId = nonEmptyString(viewState?.currentPageId);
  if (viewStatePageId && store[viewStatePageId]?.typeName === "page") return viewStatePageId;

  return getPageRecords(store)[0]?.id ?? null;
}

function choosePlacement({ store, pageId, parentId, anchorShape, width, height, margin, placement }) {
  const anchorBounds = anchorShape ? pageBoundsForShape(store, anchorShape) : null;
  let x = anchorBounds ? anchorBounds.x + anchorBounds.w + margin : 0;
  let y = anchorBounds ? anchorBounds.y : 0;

  if (placement === "left" && anchorBounds) x = anchorBounds.x - width - margin;
  if (placement === "below" && anchorBounds) {
    x = anchorBounds.x;
    y = anchorBounds.y + anchorBounds.h + margin;
  }

  const pageShapes = getPageShapes(store, pageId);
  const obstacles = pageShapes
    .filter((shape) => shape.parentId === parentId && shape.id !== anchorShape?.id)
    .map((shape) => pageBoundsForShape(store, shape))
    .filter(Boolean);

  const stepX = Math.max(width + margin, 1);
  const stepY = Math.max(height + margin, 1);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = { x, y, w: width, h: height };
    if (!obstacles.some((bounds) => rectsOverlap(candidate, bounds, margin / 2))) return candidate;
    if (placement === "below") y += stepY;
    else if (placement === "left") x -= stepX;
    else x += stepX;
  }

  return { x, y, w: width, h: height };
}

function connectorArrowRecords({ store, parentId, fromShape, toShape, seed, meta }) {
  const fromBounds = pageBoundsForShape(store, fromShape);
  const toBounds = pageBoundsForShape(store, toShape);
  if (!fromBounds || !toBounds) throw new Error("Could not determine connector arrow bounds.");

  const start = { x: fromBounds.x + fromBounds.w, y: fromBounds.y + fromBounds.h / 2 };
  const end = { x: toBounds.x, y: toBounds.y + toBounds.h / 2 };
  const arrowId = uniqueRecordId(store, "shape", `${seed}-connector`);
  const arrow = arrowShape({
    id: arrowId,
    parentId,
    index: chooseIndex(store, parentId),
    x: start.x,
    y: start.y,
    endX: end.x - start.x,
    endY: end.y - start.y,
    bend: 0,
    meta,
  });
  const bindings = [
    arrowBinding({
      id: uniqueRecordId(store, "binding", `${seed}-connector-start`),
      arrowId,
      targetId: fromShape.id,
      terminal: "start",
      normalizedAnchor: { x: 1, y: 0.5 },
      meta,
    }),
    arrowBinding({
      id: uniqueRecordId(store, "binding", `${seed}-connector-end`),
      arrowId,
      targetId: toShape.id,
      terminal: "end",
      normalizedAnchor: { x: 0, y: 0.5 },
      meta,
    }),
  ];
  return { arrow, bindings };
}

async function getImageDimensions(filePath) {
  const buffer = await readFile(filePath);
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 10 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + size;
    }
  }
  if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
  }
  throw new Error(`Could not read image dimensions for ${filePath}. Pass displayWidth/displayHeight and use a PNG/JPEG/WebP source.`);
}

async function insertProtoMeImage(args = {}) {
  const imagePath = nonEmptyString(args.imagePath);
  if (!imagePath) throw new Error("imagePath is required.");

  const sourceImagePath = pathResolve(imagePath);
  const sourceStat = await stat(sourceImagePath);
  if (!sourceStat.isFile()) throw new Error(`imagePath is not a file: ${sourceImagePath}`);

  const { protoMeUrl, snapshot } = await loadCanvasSnapshot(args);
  const store = snapshot.store;
  const { selection } = await readSelectionState(args);
  const viewState = await readViewState(args);

  const anchorShapeId = nonEmptyString(args.anchorShapeId) || nonEmptyString(args.sourceShapeId) || firstSelectedShapeId(selection);
  const anchorShape = anchorShapeId ? getRecord(store, anchorShapeId, "anchor shape") : null;
  const pageId =
    nonEmptyString(args.pageId) ||
    (anchorShape ? findPageIdForShape(store, anchorShape.id) : null) ||
    nonEmptyString(viewState?.currentPageId) ||
    Object.values(store).find((record) => record?.typeName === "page")?.id;
  if (!pageId || !store[pageId]) throw new Error("Could not determine target pageId.");

  const parentId = anchorShape?.parentId && store[anchorShape.parentId]?.typeName === "page" ? anchorShape.parentId : pageId;
  const imageSize = await getImageDimensions(sourceImagePath);
  const anchorBounds = anchorShape ? pageBoundsForShape(store, anchorShape) : null;
  const matchAnchor = args.matchAnchor !== false && anchorBounds;
  const width = finiteNumber(args.displayWidth, matchAnchor ? anchorBounds.w : Math.min(imageSize.width, 512));
  const height = finiteNumber(
    args.displayHeight,
    matchAnchor ? anchorBounds.h : Math.round(width * (imageSize.height / imageSize.width))
  );
  const margin = Math.max(0, finiteNumber(args.margin, 40));
  const placement = ["right", "left", "below"].includes(args.placement) ? args.placement : "right";
  const bounds = choosePlacement({ store, pageId, parentId, anchorShape, width, height, margin, placement });

  const canvasDir = resolveCanvasDir(args);
  const assetsDir = join(canvasDir, "pages", pageDirName(pageId), "assets");
  if (!isSafeChildPath(resolveCanvasDir(args), assetsDir)) {
    throw new Error(`Unsafe page assets directory: ${assetsDir}`);
  }
  const { fileName, filePath } = await uniqueFilePath(assetsDir, args.fileName || basename(sourceImagePath));
  const recordSeed = sanitizeIdPart(fileName);
  const assetId = uniqueRecordId(store, "asset", recordSeed);
  const shapeId = uniqueRecordId(store, "shape", recordSeed);
  const index = chooseIndex(store, parentId);
  const mimeType = mimeTypeForFile(fileName);

  const assetRecord = {
    id: assetId,
    typeName: "asset",
    type: "image",
    props: {
      name: fileName,
      src: pageAssetUrl(pageId, fileName),
      w: imageSize.width,
      h: imageSize.height,
      fileSize: sourceStat.size,
      mimeType,
      isAnimated: false,
    },
    meta: args.assetMeta && typeof args.assetMeta === "object" ? args.assetMeta : {},
  };

  const shapeMeta = args.shapeMeta && typeof args.shapeMeta === "object" ? { ...args.shapeMeta } : {};
  if (anchorShapeId && !shapeMeta.protoMeAnnotationSourceShapeId) {
    shapeMeta.protoMeAnnotationSourceShapeId = anchorShapeId;
  }
  if (nonEmptyString(args.annotationScreenshot) && !shapeMeta.protoMeAnnotationScreenshot) {
    shapeMeta.protoMeAnnotationScreenshot = nonEmptyString(args.annotationScreenshot);
  }

  const shapeRecord = {
    x: bounds.x,
    y: bounds.y,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    meta: shapeMeta,
    id: shapeId,
    type: "image",
    props: {
      w: width,
      h: height,
      assetId,
      playing: true,
      url: "",
      crop: null,
      flipX: false,
      flipY: false,
      altText: nonEmptyString(args.altText) || "Proto-me inserted image",
    },
    parentId,
    index,
    typeName: "shape",
  };

  const connectorAnchorShapeIds = uniqueStrings([
    ...(args.connectToAnchor === true && anchorShapeId ? [anchorShapeId] : []),
    ...(Array.isArray(args.connectorAnchorShapeIds) ? args.connectorAnchorShapeIds.map(nonEmptyString) : []),
  ]);
  if (connectorAnchorShapeIds.length > 0 && !shapeRecord.meta.protoMeFeatureVisualAnchorShapeIds) {
    shapeRecord.meta.protoMeFeatureVisualAnchorShapeIds = connectorAnchorShapeIds;
  }
  const connectorMetaBase = args.connectorMeta && typeof args.connectorMeta === "object" ? args.connectorMeta : {};
  const connectorRecords = [];
  const temporaryConnectorShapeIds = [];
  if (connectorAnchorShapeIds.length > 0) {
    store[shapeId] = shapeRecord;
    try {
      connectorAnchorShapeIds.forEach((connectorAnchorShapeId, connectorIndex) => {
        const connectorAnchorShape = getRecord(store, connectorAnchorShapeId, "connector anchor shape");
        const connectorMeta = {
          ...connectorMetaBase,
          protoMeFeatureVisualConnector: true,
          protoMeFeatureAnchorShapeId: connectorAnchorShape.id,
          protoMeFeatureVisualShapeId: shapeRecord.id,
          protoMeConnectorIndex: connectorIndex + 1,
        };
        const connector = connectorArrowRecords({
          store,
          parentId,
          fromShape: connectorAnchorShape,
          toShape: shapeRecord,
          seed: `${recordSeed}-${sanitizeIdPart(connectorAnchorShape.id, "anchor")}`,
          meta: connectorMeta,
        });
        connectorRecords.push(connector);
        store[connector.arrow.id] = connector.arrow;
        temporaryConnectorShapeIds.push(connector.arrow.id);
      });
    } finally {
      delete store[shapeId];
      for (const temporaryShapeId of temporaryConnectorShapeIds) delete store[temporaryShapeId];
    }
  }

  if (!args.dryRun) {
    await mkdir(assetsDir, { recursive: true });
    await copyFile(sourceImagePath, filePath);
    store[assetId] = assetRecord;
    store[shapeId] = shapeRecord;
    for (const connector of connectorRecords) {
      store[connector.arrow.id] = connector.arrow;
      for (const binding of connector.bindings) store[binding.id] = binding;
    }
    await saveCanvasSnapshot(protoMeUrl, snapshot);
  }

  const connectorShapeIds = connectorRecords.map((connector) => connector.arrow.id);
  const connectorBindingIds = connectorRecords.flatMap((connector) => connector.bindings.map((binding) => binding.id));

  return {
    protoMeUrl,
    pageId,
    parentId,
    anchorShapeId,
    assetId,
    shapeId,
    index,
    sourceImagePath,
    assetFile: filePath,
    assetUrl: assetRecord.props.src,
    imageSize,
    bounds,
    connectorShapeId: connectorShapeIds[0] ?? null,
    connectorShapeIds,
    connectorBindingIds,
    dryRun: Boolean(args.dryRun),
  };
}

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }
  const text = normalizeText(value);
  return text ? [text] : [];
}

function normalizeFeatureGroups(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((group) => {
      if (typeof group === "string") {
        return { title: normalizeText(group), items: [] };
      }
      if (!group || typeof group !== "object") return null;
      return {
        title: normalizeText(group.title ?? group.name),
        items: normalizeStringList(group.items ?? group.features),
      };
    })
    .filter((group) => group && (group.title || group.items.length > 0));
}

function normalizeCoreItems(args = {}) {
  const features = normalizeStringList(args.features);
  const sections = uniqueStrings([...normalizeStringList(args.sections), ...normalizeStringList(args.columns)]);
  const menus = uniqueStrings([
    ...normalizeStringList(args.menus),
    ...normalizeStringList(args.menuItems),
    ...normalizeStringList(args.navigationItems),
  ]);
  return {
    features,
    sections,
    menus,
    coreItems: [
      ...features.map((title) => ({ title, kind: "feature" })),
      ...sections.map((title) => ({ title, kind: "section" })),
      ...menus.map((title) => ({ title, kind: "menu" })),
    ],
  };
}

function normalizeFeatureDetails(value, coreItems) {
  const orderedDetails = [];
  const detailsByTitle = new Map();

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      let title = "";
      let items = [];
      if (typeof entry === "string") {
        title = coreItems[index]?.title ?? "";
        items = normalizeStringList(entry);
      } else if (entry && typeof entry === "object") {
        title =
          normalizeText(entry.title ?? entry.feature ?? entry.section ?? entry.column ?? entry.menu ?? entry.name) ||
          coreItems[index]?.title ||
          "";
        items = [
          ...normalizeStringList(entry.detail ?? entry.description ?? entry.summary),
          ...normalizeStringList(entry.items ?? entry.details),
        ];
      }
      if (!title && items.length === 0) return;
      const detail = { title, items };
      orderedDetails[index] = detail;
      if (title) detailsByTitle.set(title, detail);
    });
  }

  return coreItems.map((item, index) => {
    const explicit = detailsByTitle.get(item.title) ?? orderedDetails[index];
    return {
      ...item,
      items: explicit?.items ?? [],
    };
  });
}

function hasCjkText(text) {
  return /[\u3400-\u9fff]/.test(text);
}

function whiteboardLabels(language, textSample) {
  const useChinese = language === "zh" || (!language && hasCjkText(textSample));
  if (useChinese) {
    return {
      brief: "产品 Brief",
      targetUsers: "目标用户",
      outcomes: "目标结果",
      flow: "用户流程",
      features: "核心 Features",
      featuresShort: "Features",
      sections: "栏目",
      menus: "菜单",
      coreSections: "核心栏目",
      coreMenus: "核心菜单",
      sectionsMenus: "核心栏目 / 菜单",
      featuresSectionsMenus: "核心 Feature / 栏目 / 菜单",
      decisions: "关键决定",
      engineering: "工程约束与验证",
      behavior: "行为",
      implementationScope: "实现范围",
      verification: "验证/测试",
      boundaries: "边界",
      systemImpact: "系统影响",
      done: "完成标准",
      unknowns: "重要未知",
      pending: "待补充",
    };
  }
  return {
    brief: "Product Brief",
    targetUsers: "Target Users",
    outcomes: "Desired Outcomes",
    flow: "User Flow",
    features: "Core Features",
    featuresShort: "Features",
    sections: "Sections",
    menus: "Menus",
    coreSections: "Core Sections",
    coreMenus: "Core Menus",
    sectionsMenus: "Core Sections / Menus",
    featuresSectionsMenus: "Core Features / Sections / Menus",
    decisions: "Key Decisions",
    engineering: "Engineering Constraints and Verification",
    behavior: "Behavior",
    implementationScope: "Implementation Scope",
    verification: "Verification/Tests",
    boundaries: "Boundaries",
    systemImpact: "System Impact",
    done: "Done Standard",
    unknowns: "Important Unknowns",
    pending: "To clarify",
  };
}

function numberedList(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function bulletList(items) {
  return items.map((item) => `• ${item}`).join("\n");
}

function sectionText(title, items, fallback) {
  const content = items.length > 0 ? numberedList(items) : fallback;
  return `${title}\n${content}`;
}

function coreItemsHeading(labels, coreItems, explicitLabel) {
  const customLabel = normalizeText(explicitLabel);
  if (customLabel) return customLabel;
  const kinds = new Set(coreItems.map((item) => item.kind));
  if (kinds.has("feature") && (kinds.has("section") || kinds.has("menu"))) return labels.featuresSectionsMenus;
  if (kinds.has("section") && kinds.has("menu")) return labels.sectionsMenus;
  if (kinds.has("section")) return labels.coreSections;
  if (kinds.has("menu")) return labels.coreMenus;
  return labels.features;
}

function featureSectionText(title, brief, fallback) {
  const lines = [];
  const hasTypedNavigation = brief.sections.length > 0 || brief.menus.length > 0;
  if (brief.features.length > 0) {
    if (hasTypedNavigation) lines.push(brief.labels.featuresShort);
    lines.push(numberedList(brief.features));
  }
  if (brief.sections.length > 0) {
    lines.push(brief.labels.sections);
    lines.push(numberedList(brief.sections));
  }
  if (brief.menus.length > 0) {
    lines.push(brief.labels.menus);
    lines.push(numberedList(brief.menus));
  }
  for (const group of brief.featureGroups) {
    if (group.title) lines.push(group.title);
    if (group.items.length > 0) lines.push(bulletList(group.items));
  }
  return `${title}\n${lines.length > 0 ? lines.join("\n") : fallback}`;
}

function coreItemKindLabel(kind, labels) {
  if (kind === "section") return labels.sections;
  if (kind === "menu") return labels.menus;
  return labels.featuresShort;
}

function featureDetailText(detail, labels, fallback) {
  const title = detail.kind === "feature" ? detail.title : `${coreItemKindLabel(detail.kind, labels)}: ${detail.title}`;
  return `${title}\n${detail.items.length > 0 ? bulletList(detail.items) : fallback}`;
}

function labeledItems(label, items) {
  return normalizeStringList(items).map((item) => `${label}: ${item}`);
}

function normalizeEngineeringConstraints(args, labels) {
  return [
    ...normalizeStringList(args.engineeringConstraints),
    ...labeledItems(labels.behavior, args.behavior),
    ...labeledItems(labels.implementationScope, args.implementationScope),
    ...labeledItems(labels.verification, args.verification ?? args.tests),
    ...labeledItems(labels.boundaries, args.boundaries),
    ...labeledItems(labels.systemImpact, args.systemImpact),
  ];
}

function normalizeBriefInput(args = {}) {
  const title = normalizeText(args.title || args.name || "Product Brief");
  const summary = normalizeText(args.summary || args.description);
  const { features, sections, menus, coreItems } = normalizeCoreItems(args);
  const sample = [
    title,
    summary,
    ...normalizeStringList(args.targetUsers),
    ...normalizeStringList(args.outcomes),
    ...normalizeStringList(args.flow),
    ...features,
    ...sections,
    ...menus,
    ...normalizeStringList(args.decisions),
    ...normalizeStringList(args.engineeringConstraints),
    ...normalizeStringList(args.behavior),
    ...normalizeStringList(args.implementationScope),
    ...normalizeStringList(args.verification ?? args.tests),
    ...normalizeStringList(args.boundaries),
    ...normalizeStringList(args.systemImpact),
    ...normalizeStringList(args.done),
  ].join("\n");
  const labels = whiteboardLabels(args.language, sample);
  labels.features = coreItemsHeading(labels, coreItems, args.coreItemsLabel ?? args.featuresLabel);

  return {
    title,
    summary,
    labels,
    targetUsers: normalizeStringList(args.targetUsers),
    outcomes: normalizeStringList(args.outcomes),
    flow: normalizeStringList(args.flow),
    features,
    sections,
    menus,
    coreItems,
    featureDetails: normalizeFeatureDetails(args.featureDetails, coreItems),
    featureGroups: normalizeFeatureGroups(args.featureGroups),
    decisions: normalizeStringList(args.decisions),
    engineeringConstraints: normalizeEngineeringConstraints(args, labels),
    done: normalizeStringList(args.done),
    unknowns: normalizeStringList(args.unknowns),
  };
}

function baseShapeRecord({ id, parentId, index, x, y, type, props, meta }) {
  return {
    id,
    typeName: "shape",
    type,
    parentId,
    index,
    x,
    y,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    meta,
    props,
  };
}

function textShape({ id, parentId, index, x, y, w, text, size = "m", meta }) {
  return baseShapeRecord({
    id,
    parentId,
    index,
    x,
    y,
    type: "text",
    meta,
    props: {
      color: "black",
      size,
      w,
      richText: toRichText(text),
      font: "draw",
      textAlign: "start",
      autoSize: false,
      scale: 1,
    },
  });
}

function arrowShape({ id, parentId, index, x, y, endX, endY, bend = 0, meta }) {
  return baseShapeRecord({
    id,
    parentId,
    index,
    x,
    y,
    type: "arrow",
    meta,
    props: {
      kind: "arc",
      color: "black",
      labelColor: "black",
      fill: "none",
      dash: "draw",
      size: "m",
      arrowheadStart: "none",
      arrowheadEnd: "arrow",
      font: "draw",
      start: { x: 0, y: 0 },
      end: { x: endX, y: endY },
      bend,
      richText: toRichText(""),
      labelPosition: 0.5,
      scale: 1,
      elbowMidPoint: 0.5,
    },
  });
}

function arrowBinding({ id, arrowId, targetId, terminal, normalizedAnchor, meta }) {
  return {
    id,
    typeName: "binding",
    type: "arrow",
    fromId: arrowId,
    toId: targetId,
    meta,
    props: {
      terminal,
      snap: "none",
      normalizedAnchor,
      isExact: false,
      isPrecise: true,
    },
  };
}

function buildBriefWhiteboardShapes({ store, parentId, brief, whiteboardId, originX, originY }) {
  const metaBase = {
    [BRIEF_WHITEBOARD_META_KEY]: true,
    protoMeBriefWhiteboardVersion: BRIEF_WHITEBOARD_VERSION,
    protoMeBriefWhiteboardId: whiteboardId,
  };
  const seedPrefix = sanitizeIdPart(`brief-whiteboard-${whiteboardId}`, "brief-whiteboard");
  const shapes = [];
  const bindings = [];

  function nextIndex() {
    for (const shape of shapes) store[shape.id] = shape;
    const index = chooseIndex(store, parentId);
    for (const shape of shapes) delete store[shape.id];
    return index;
  }

  function addText(key, position, width, text, size = "s", id = null, extraMeta = {}) {
    const shape = textShape({
      id: id ?? uniqueRecordId(store, "shape", `${seedPrefix}-${key}`),
      parentId,
      index: nextIndex(),
      x: originX + position.x,
      y: originY + position.y,
      w: width,
      text,
      size,
      meta: { ...metaBase, protoMeBriefWhiteboardRole: key, ...extraMeta },
    });
    shapes.push(shape);
    return shape;
  }

  function addArrow(key, from, to, fromShapeId, toShapeId, startAnchor, endAnchor, bend = 0) {
    const meta = { ...metaBase, protoMeBriefWhiteboardRole: key };
    const shape = arrowShape({
      id: uniqueRecordId(store, "shape", `${seedPrefix}-${key}`),
      parentId,
      index: nextIndex(),
      x: originX + from.x,
      y: originY + from.y,
      endX: to.x - from.x,
      endY: to.y - from.y,
      bend,
      meta,
    });
    shapes.push(shape);
    bindings.push(
      arrowBinding({
        id: uniqueRecordId(store, "binding", `${seedPrefix}-${key}-start`),
        arrowId: shape.id,
        targetId: fromShapeId,
        terminal: "start",
        normalizedAnchor: startAnchor,
        meta,
      }),
      arrowBinding({
        id: uniqueRecordId(store, "binding", `${seedPrefix}-${key}-end`),
        arrowId: shape.id,
        targetId: toShapeId,
        terminal: "end",
        normalizedAnchor: endAnchor,
        meta,
      })
    );
    return shape;
  }

  const { labels } = brief;
  const fallback = labels.pending;
  const sectionShapes = new Map();
  const center = addText(
    "brief",
    { x: -190, y: -70 },
    390,
    `${labels.brief}\n${brief.title}${brief.summary ? `\n${brief.summary}` : ""}`,
    "m"
  );

  const sectionSpecs = [
    {
      key: "target-users",
      position: { x: -500, y: -220 },
      anchor: { x: -170, y: -10 },
      startAnchor: { x: 0.05, y: 0.35 },
      endAnchor: { x: 0.95, y: 0.65 },
      text: sectionText(labels.targetUsers, brief.targetUsers, fallback),
      bend: 35,
    },
    {
      key: "outcomes",
      position: { x: 260, y: -220 },
      anchor: { x: 175, y: -10 },
      startAnchor: { x: 0.95, y: 0.35 },
      endAnchor: { x: 0.05, y: 0.65 },
      text: sectionText(labels.outcomes, brief.outcomes, fallback),
      bend: -35,
    },
    {
      key: "flow",
      position: { x: -520, y: 90 },
      anchor: { x: -170, y: 80 },
      startAnchor: { x: 0.05, y: 0.75 },
      endAnchor: { x: 0.95, y: 0.25 },
      text: sectionText(labels.flow, brief.flow, fallback),
      bend: -25,
    },
    {
      key: "features",
      position: { x: 310, y: 80 },
      anchor: { x: 180, y: 80 },
      startAnchor: { x: 0.95, y: 0.75 },
      endAnchor: { x: 0.05, y: 0.25 },
      text: featureSectionText(labels.features, brief, fallback),
      bend: 25,
    },
    {
      key: "decisions",
      position: { x: -360, y: 315 },
      anchor: { x: -100, y: 110 },
      startAnchor: { x: 0.25, y: 1 },
      endAnchor: { x: 0.85, y: 0.1 },
      text: sectionText(labels.decisions, brief.decisions, fallback),
      bend: -45,
    },
    {
      key: "done",
      position: { x: 180, y: 315 },
      anchor: { x: 100, y: 110 },
      startAnchor: { x: 0.75, y: 1 },
      endAnchor: { x: 0.1, y: 0.1 },
      text: sectionText(labels.done, brief.done, fallback),
      bend: 45,
    },
    {
      key: "engineering",
      position: { x: -120, y: 560 },
      anchor: { x: 0, y: 130 },
      startAnchor: { x: 0.5, y: 1 },
      endAnchor: { x: 0.5, y: 0.05 },
      text: sectionText(labels.engineering, brief.engineeringConstraints, fallback),
      bend: 0,
      width: 440,
    },
  ];

  if (brief.unknowns.length > 0) {
    sectionSpecs.push({
      key: "unknowns",
      position: { x: 10, y: -350 },
      anchor: { x: 0, y: -45 },
      startAnchor: { x: 0.5, y: 0 },
      endAnchor: { x: 0.5, y: 1 },
      text: sectionText(labels.unknowns, brief.unknowns, fallback),
      bend: 20,
    });
  }

  for (const spec of sectionSpecs) {
    const sectionShapeId = uniqueRecordId(store, "shape", `${seedPrefix}-${spec.key}`);
    addArrow(
      `${spec.key}-arrow`,
      spec.anchor,
      { x: spec.position.x + 20, y: spec.position.y + 20 },
      center.id,
      sectionShapeId,
      spec.startAnchor,
      spec.endAnchor,
      spec.bend
    );
    const sectionShape = addText(spec.key, spec.position, spec.width ?? (spec.key === "features" ? 350 : 320), spec.text, "s", sectionShapeId);
    sectionShapes.set(spec.key, sectionShape);
  }

  const featuresShape = sectionShapes.get("features");
  if (featuresShape && brief.featureDetails.length > 0) {
    const detailX = 730;
    const detailStartY = -10;
    const detailGapY = 118;
    brief.featureDetails.forEach((detail, index) => {
      const key = `feature-detail-${index + 1}`;
      const position = { x: detailX, y: detailStartY + index * detailGapY };
      const detailShapeId = uniqueRecordId(store, "shape", `${seedPrefix}-${key}`);
      const startAnchorY = Math.max(0.18, Math.min(0.9, 0.18 + index * 0.12));
      addArrow(
        `${key}-arrow`,
        { x: 650, y: 112 + index * 22 },
        { x: position.x + 12, y: position.y + 28 },
        featuresShape.id,
        detailShapeId,
        { x: 1, y: startAnchorY },
        { x: 0, y: 0.45 },
        index % 2 === 0 ? 18 : -18
      );
      addText(key, position, 320, featureDetailText(detail, labels, fallback), "s", detailShapeId, {
        protoMeCoreItemKind: detail.kind,
        protoMeCoreItemTitle: detail.title,
        protoMeCoreItemIndex: index + 1,
      });
    });
  }

  return { shapes, bindings, centerShapeId: center.id };
}

function matchesBriefWhiteboardMeta(record, whiteboardId = null) {
  if (record?.meta?.[BRIEF_WHITEBOARD_META_KEY] !== true) return false;
  return !whiteboardId || record.meta?.protoMeBriefWhiteboardId === whiteboardId;
}

function removeExistingBriefWhiteboardRecords(store, pageId, whiteboardId = null) {
  const removedShapeIds = [];
  const removedShapeIdSet = new Set();
  const removedBindingIds = [];
  const connectorArrowIdsToRemove = new Set();

  for (const [id, record] of Object.entries(store)) {
    if (record?.typeName !== "shape") continue;
    if (!matchesBriefWhiteboardMeta(record, whiteboardId)) continue;
    if (!shapeBelongsToPage(store, record, pageId)) continue;
    delete store[id];
    removedShapeIds.push(id);
    removedShapeIdSet.add(id);
  }

  for (const record of Object.values(store)) {
    if (record?.typeName !== "binding") continue;
    const touchesRemovedShape = removedShapeIdSet.has(record.fromId) || removedShapeIdSet.has(record.toId);
    if (!touchesRemovedShape) continue;
    const fromShape = store[record.fromId];
    if (fromShape?.typeName === "shape" && fromShape.meta?.protoMeFeatureVisualConnector === true) {
      connectorArrowIdsToRemove.add(fromShape.id);
    }
  }

  for (const connectorArrowId of connectorArrowIdsToRemove) {
    const connectorArrow = store[connectorArrowId];
    if (connectorArrow?.typeName !== "shape") continue;
    delete store[connectorArrowId];
    removedShapeIds.push(connectorArrowId);
    removedShapeIdSet.add(connectorArrowId);
  }

  for (const [id, record] of Object.entries(store)) {
    if (record?.typeName !== "binding") continue;
    const isBriefBinding = matchesBriefWhiteboardMeta(record, whiteboardId);
    const touchesRemovedShape = removedShapeIdSet.has(record.fromId) || removedShapeIdSet.has(record.toId);
    const belongsToRemovedConnector = connectorArrowIdsToRemove.has(record.fromId);
    if (!isBriefBinding && !touchesRemovedShape && !belongsToRemovedConnector) continue;
    delete store[id];
    removedBindingIds.push(id);
  }

  return { removedShapeIds, removedBindingIds };
}

async function upsertProtoMeBriefWhiteboard(args = {}) {
  const { protoMeUrl, snapshot } = await loadCanvasSnapshot(args, { allowEmpty: true });
  const viewState = await readViewState(args);
  const nextSnapshot = ensureUsableCanvasSnapshot(snapshot);
  const store = nextSnapshot.store;
  const pageId = resolveTargetPageId(store, args, viewState);
  if (!pageId || !store[pageId]) throw new Error("Could not determine target pageId.");

  const whiteboardId = sanitizeIdPart(args.whiteboardId || "product-brief", "product-brief");
  const parentId = pageId;
  const originX = args.x === undefined ? 540 : finiteNumber(args.x, 540);
  const originY = args.y === undefined ? 260 : finiteNumber(args.y, 260);
  const brief = normalizeBriefInput(args);
  const shouldReplace = args.replaceExisting !== false;
  const removedRecords = shouldReplace
    ? removeExistingBriefWhiteboardRecords(store, pageId, whiteboardId)
    : { removedShapeIds: [], removedBindingIds: [] };
  const { shapes, bindings, centerShapeId } = buildBriefWhiteboardShapes({
    store,
    parentId,
    brief,
    whiteboardId,
    originX,
    originY,
  });

  for (const shape of shapes) store[shape.id] = shape;
  for (const binding of bindings) store[binding.id] = binding;

  if (!args.dryRun) {
    await saveCanvasSnapshot(protoMeUrl, nextSnapshot);
  }

  return {
    protoMeUrl,
    pageId,
    whiteboardId,
    centerShapeId,
    shapeIds: shapes.map((shape) => shape.id),
    bindingIds: bindings.map((binding) => binding.id),
    removedShapeIds: removedRecords.removedShapeIds,
    removedBindingIds: removedRecords.removedBindingIds,
    dryRun: Boolean(args.dryRun),
  };
}

function richTextToPlainText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(richTextToPlainText).filter(Boolean).join("\n");
  if (typeof node !== "object") return "";
  if (node.type === "text") return normalizeText(node.text);
  if (node.type === "hardBreak") return "\n";
  const children = Array.isArray(node.content) ? node.content.map(richTextToPlainText).filter(Boolean) : [];
  if (node.type === "doc") return children.join("\n");
  if (node.type === "paragraph" || node.type === "heading") return children.join("");
  if (node.type === "bulletList" || node.type === "orderedList") return children.join("\n");
  if (node.type === "listItem") return children.join(" ");
  return children.join("\n");
}

function plainTextForShape(shape) {
  const richText = shape?.props?.richText;
  if (!richText) return "";
  return normalizeText(richTextToPlainText(richText));
}

async function getProtoMeCanvasText(args = {}) {
  const { protoMeUrl, snapshot } = await loadCanvasSnapshot(args, { allowEmpty: true });
  const nextSnapshot = ensureUsableCanvasSnapshot(snapshot);
  const store = nextSnapshot.store;
  const viewState = await readViewState(args);
  const pageId = resolveTargetPageId(store, args, viewState);
  if (!pageId || !store[pageId]) throw new Error("Could not determine target pageId.");

  const includeAllText = args.includeAllText !== false;
  const shapes = getPageShapes(store, pageId)
    .map((shape) => {
      const text = plainTextForShape(shape);
      if (!text) return null;
      const bounds = pageBoundsForShape(store, shape) ?? { x: finiteNumber(shape.x, 0), y: finiteNumber(shape.y, 0), w: 1, h: 1 };
      return {
        id: shape.id,
        type: shape.type,
        text,
        x: bounds.x,
        y: bounds.y,
        isBriefWhiteboard: shape.meta?.[BRIEF_WHITEBOARD_META_KEY] === true,
        role: shape.meta?.protoMeBriefWhiteboardRole ?? null,
        whiteboardId: shape.meta?.protoMeBriefWhiteboardId ?? null,
        coreItemKind: shape.meta?.protoMeCoreItemKind ?? null,
        coreItemTitle: shape.meta?.protoMeCoreItemTitle ?? null,
        coreItemIndex: shape.meta?.protoMeCoreItemIndex ?? null,
      };
    })
    .filter(Boolean)
    .filter((shape) => includeAllText || shape.isBriefWhiteboard)
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

  const whiteboardShapes = shapes.filter((shape) => shape.isBriefWhiteboard);
  const lines = shapes.map((shape) => {
    const marker = shape.isBriefWhiteboard ? "brief" : shape.type;
    return `- ${shape.text.replace(/\n/g, " / ")} (${marker}, ${shape.id})`;
  });

  return {
    protoMeUrl,
    pageId,
    text: lines.join("\n"),
    shapes,
    whiteboardShapes,
  };
}

function toolDefinitions() {
  return [
    {
      name: TOOL_GET_SELECTION,
      title: "Get Proto-me Selection",
      description:
        "Return the currently selected Proto-me/tldraw shapes and image asset metadata from a project's canvas/<slug>/proto-me-selection.json state file.",
      inputSchema: {
        type: "object",
        properties: {
          projectDir: {
            type: "string",
            description: "Absolute Proto-me project directory. With canvasSlug, the tool reads <projectDir>/canvas/<canvasSlug>/proto-me-selection.json.",
          },
          canvasSlug: {
            type: "string",
            description: "Product or feature canvas slug. Sanitized to lowercase letters, numbers, and hyphens, max 50 chars.",
          },
          canvasDir: {
            type: "string",
            description: "Absolute canvas directory. If provided, this takes precedence over projectDir.",
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    {
      name: TOOL_INSERT_IMAGE,
      title: "Insert Proto-me Image",
      description:
        "Copy a local bitmap into a Proto-me page-local assets folder, create a tldraw image asset and shape, place it beside an anchor or clear page area, optionally connect source nodes to it with bound arrows, and save through the Proto-me canvas API.",
      inputSchema: {
        type: "object",
        properties: {
          imagePath: { type: "string", description: "Absolute local bitmap path to insert." },
          projectDir: { type: "string", description: "Absolute Proto-me project directory containing canvas/<slug>/." },
          canvasSlug: {
            type: "string",
            description: "Product or feature canvas slug. Sanitized to lowercase letters, numbers, and hyphens, max 50 chars.",
          },
          canvasDir: { type: "string", description: "Absolute canvas directory. Overrides projectDir." },
          protoMeUrl: { type: "string", description: "Running Proto-me URL, for example http://127.0.0.1:43218." },
          pageId: { type: "string", description: "Target tldraw page id. Optional when an anchor or view-state page is available." },
          anchorShapeId: { type: "string", description: "Existing shape id to place beside, usually the source image or AI frame." },
          sourceShapeId: { type: "string", description: "Alias for anchorShapeId." },
          fileName: { type: "string", description: "Optional destination filename under the page assets folder." },
          placement: { type: "string", enum: ["right", "left", "below"], description: "Placement direction from the anchor." },
          margin: { type: "number", description: "Canvas units between the new image and nearby shapes. Defaults to 40." },
          matchAnchor: { type: "boolean", description: "Use the anchor display size when possible. Defaults to true." },
          displayWidth: { type: "number", description: "Displayed shape width in canvas units." },
          displayHeight: { type: "number", description: "Displayed shape height in canvas units." },
          altText: { type: "string", description: "Image shape alt text." },
          annotationScreenshot: { type: "string", description: "Source annotation screenshot filename for metadata." },
          shapeMeta: { type: "object", description: "Additional tldraw shape metadata." },
          assetMeta: { type: "object", description: "Additional tldraw asset metadata." },
          connectToAnchor: {
            type: "boolean",
            description: "When true, create a bound arrow from anchorShapeId to the inserted image.",
          },
          connectorAnchorShapeIds: {
            type: "array",
            items: { type: "string" },
            description: "Additional shape ids to connect to the inserted image with bound arrows.",
          },
          connectorMeta: { type: "object", description: "Additional metadata for generated connector arrows and bindings." },
          dryRun: { type: "boolean", description: "Calculate insertion without copying or saving." },
        },
        required: ["imagePath"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    {
      name: TOOL_UPSERT_BRIEF_WHITEBOARD,
      title: "Upsert Proto-me Brief Whiteboard",
      description:
        "Create or refresh a minimal editable mind-map plus flowchart whiteboard for the current product brief on the Proto-me/tldraw canvas, with branch arrows bound to their text nodes.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Central product or feature title." },
          summary: { type: "string", description: "Short brief summary shown under the title." },
          targetUsers: { type: "array", items: { type: "string" }, description: "Who this product or feature is for." },
          outcomes: { type: "array", items: { type: "string" }, description: "Desired user-visible outcomes." },
          flow: { type: "array", items: { type: "string" }, description: "Main user or planning steps." },
          features: { type: "array", items: { type: "string" }, description: "Core feature bullets." },
          sections: {
            type: "array",
            items: { type: "string" },
            description: "Core product sections or content columns that should be explicit in the brief and whiteboard.",
          },
          columns: {
            type: "array",
            items: { type: "string" },
            description: "Alias for sections, useful when the product brief uses the term columns.",
          },
          menus: {
            type: "array",
            items: { type: "string" },
            description: "Core menu or navigation entries that should be explicit in the brief and whiteboard.",
          },
          menuItems: { type: "array", items: { type: "string" }, description: "Alias for menus." },
          navigationItems: { type: "array", items: { type: "string" }, description: "Alias for menus." },
          coreItemsLabel: {
            type: "string",
            description: "Optional override for the core features/sections/menus node label.",
          },
          featuresLabel: { type: "string", description: "Alias for coreItemsLabel." },
          featureDetails: {
            type: "array",
            description:
              "One detailed child text block per core feature, section, or menu. Order should match features, then sections, then menus when title/feature/section/menu is omitted.",
            items: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    feature: { type: "string" },
                    section: { type: "string" },
                    column: { type: "string" },
                    menu: { type: "string" },
                    name: { type: "string" },
                    detail: { type: "string" },
                    description: { type: "string" },
                    summary: { type: "string" },
                    items: { type: "array", items: { type: "string" } },
                    details: { type: "array", items: { type: "string" } },
                  },
                  additionalProperties: false,
                },
              ],
            },
          },
          featureGroups: {
            type: "array",
            description: "Optional grouped feature expansion.",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                items: { type: "array", items: { type: "string" } },
              },
              additionalProperties: false,
            },
          },
          decisions: { type: "array", items: { type: "string" }, description: "Resolved product decisions." },
          engineeringConstraints: {
            type: "array",
            items: { type: "string" },
            description: "Product-level engineering constraints and verification notes.",
          },
          behavior: {
            type: "array",
            items: { type: "string" },
            description: "Visible user actions and expected responses to record under engineering constraints.",
          },
          implementationScope: {
            type: "array",
            items: { type: "string" },
            description: "What the first version must cover and what can wait, at product level.",
          },
          verification: {
            type: "array",
            items: { type: "string" },
            description: "Core paths, states, or outcomes to verify.",
          },
          tests: {
            type: "array",
            items: { type: "string" },
            description: "Alias for verification.",
          },
          boundaries: {
            type: "array",
            items: { type: "string" },
            description: "Features, flows, integrations, or polish that should not be built.",
          },
          systemImpact: {
            type: "array",
            items: { type: "string" },
            description: "Existing pages, flows, data, habits, or interactions affected by the prototype.",
          },
          done: { type: "array", items: { type: "string" }, description: "Definition of done or acceptance standards." },
          unknowns: { type: "array", items: { type: "string" }, description: "Important remaining unknowns, if any." },
          language: { type: "string", enum: ["zh", "en"], description: "Label language. Defaults to auto-detect." },
          whiteboardId: { type: "string", description: "Stable brief whiteboard id. Defaults to product-brief." },
          replaceExisting: { type: "boolean", description: "Replace existing brief whiteboard shapes on the target page. Defaults to true." },
          projectDir: { type: "string", description: "Absolute Proto-me project directory containing canvas/<slug>/." },
          canvasSlug: {
            type: "string",
            description: "Product or feature canvas slug. Sanitized to lowercase letters, numbers, and hyphens, max 50 chars.",
          },
          canvasDir: { type: "string", description: "Absolute canvas directory. Overrides projectDir." },
          protoMeUrl: { type: "string", description: "Running Proto-me URL, for example http://127.0.0.1:43217." },
          pageId: { type: "string", description: "Target tldraw page id. Defaults to current view-state page or first page." },
          x: { type: "number", description: "Whiteboard origin x in canvas units. Defaults to 540." },
          y: { type: "number", description: "Whiteboard origin y in canvas units. Defaults to 260." },
          dryRun: { type: "boolean", description: "Calculate shape ids without saving." },
        },
        required: ["title"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    {
      name: TOOL_GET_CANVAS_TEXT,
      title: "Get Proto-me Canvas Text",
      description:
        "Read plain text from editable tldraw text, note, geo, and arrow-label shapes on a Proto-me canvas page so canvas edits can be treated as current planning intent.",
      inputSchema: {
        type: "object",
        properties: {
          projectDir: { type: "string", description: "Absolute Proto-me project directory containing canvas/<slug>/." },
          canvasSlug: {
            type: "string",
            description: "Product or feature canvas slug. Sanitized to lowercase letters, numbers, and hyphens, max 50 chars.",
          },
          canvasDir: { type: "string", description: "Absolute canvas directory. Overrides projectDir." },
          protoMeUrl: { type: "string", description: "Running Proto-me URL, for example http://127.0.0.1:43217." },
          pageId: { type: "string", description: "Target tldraw page id. Defaults to current view-state page or first page." },
          includeAllText: {
            type: "boolean",
            description: "Include all page text, not only brief whiteboard text. Defaults to true.",
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
  ];
}

async function handleToolCall(id, params) {
  if (params?.name === TOOL_GET_SELECTION) {
    const { selection, selectionFile } = await readSelectionState(params.arguments ?? {});
    const selectedShapes = selection.selectedShapes ?? [];
    const summary =
      selectedShapes.length === 0
        ? "No Proto-me shapes are currently selected."
        : selectedShapes
            .map((shape) => {
              const assetName = shape.asset?.name ? ` (${shape.asset.name})` : "";
              return `${shape.id} [${shape.type ?? "unknown"}]${assetName}`;
            })
            .join("\n");

    sendResult(id, {
      content: [{ type: "text", text: summary }],
      structuredContent: { selection, selectionFile },
    });
    return;
  }

  if (params?.name === TOOL_INSERT_IMAGE) {
    const result = await insertProtoMeImage(params.arguments ?? {});
    sendResult(id, {
      content: [
        {
          type: "text",
          text: `${result.dryRun ? "Planned" : "Inserted"} ${result.shapeId} on ${result.pageId} at (${result.bounds.x}, ${result.bounds.y}) using ${result.index}.`,
        },
      ],
      structuredContent: result,
    });
    return;
  }

  if (params?.name === TOOL_UPSERT_BRIEF_WHITEBOARD) {
    const result = await upsertProtoMeBriefWhiteboard(params.arguments ?? {});
    sendResult(id, {
      content: [
        {
          type: "text",
          text: `${result.dryRun ? "Planned" : "Upserted"} brief whiteboard ${result.whiteboardId} on ${result.pageId} with ${result.shapeIds.length} shapes and ${result.bindingIds.length} bindings.`,
        },
      ],
      structuredContent: result,
    });
    return;
  }

  if (params?.name === TOOL_GET_CANVAS_TEXT) {
    const result = await getProtoMeCanvasText(params.arguments ?? {});
    sendResult(id, {
      content: [
        {
          type: "text",
          text: result.text || `No editable text found on ${result.pageId}.`,
        },
      ],
      structuredContent: result,
    });
    return;
  }

  sendError(id, JsonRpcError.INVALID_PARAMS, `Unknown tool: ${params?.name ?? ""}`);
}

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    sendResult(id, {
      protocolVersion: params?.protocolVersion ?? "2025-11-25",
      capabilities: { tools: {} },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      instructions:
        "Read and update Proto-me canvas state. Use get_proto_me_selection for persisted browser selection, insert_proto_me_image to place local bitmap assets, upsert_proto_me_brief_whiteboard to create or refresh an editable planning whiteboard, and get_proto_me_canvas_text to read canvas edits as planning intent.",
    });
    return;
  }

  if (method === "ping") {
    sendResult(id, {});
    return;
  }

  if (method === "tools/list") {
    sendResult(id, { tools: toolDefinitions() });
    return;
  }

  if (method === "tools/call") {
    try {
      await handleToolCall(id, params);
    } catch (error) {
      sendError(id, JsonRpcError.INVALID_PARAMS, error instanceof Error ? error.message : String(error));
    }
    return;
  }

  if (id !== undefined) {
    sendError(id, JsonRpcError.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

const lines = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

lines.on("line", (line) => {
  if (line.trim().length === 0) return;

  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  handleRequest(message).catch((error) => {
    if (message.id !== undefined) {
      sendError(message.id, JsonRpcError.INVALID_PARAMS, error instanceof Error ? error.message : String(error));
    }
  });
});
