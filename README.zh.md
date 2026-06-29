# Proto-me

Proto-me 是一款面向 Codex 的产品原型探索工具——帮你把一个想法推进到可执行实现。它在当前项目上下文中完成探索、规划、可选视觉设计、Agent 生成与执行交接，让从想法到实现的每一步都可见、可改、可交接。

English README: [README.md](README.md)

## 产品理念

Proto-me 解决的核心问题是：一个想法到底该怎么变成可执行的原型？

- 把模糊想法拆成目标用户、核心流程、功能边界、关键决定和完成标准。
- 在互动中沉淀产品 brief，让它成为后续设计、Agent 和执行的唯一事实源。
- 让视觉设计成为可选阶段。用户可以先生成概念图、UI/UX 界面、原型图、矢量风插画、海报或信息图，也可以跳过 Design，直接从 Plan 进入 Agent。
- 让生成图片服务于原型沟通。视觉稿是风格、层级、体验和交互意图的参考；如果图片和 brief 冲突，产品 brief 优先。
- 当需要视觉协作时，使用互动工作区作为共享工作面——用户可以直接修改文字节点、标注图片或调整视觉参考。
- 让执行前的交接更稳。`proto-plan` 会把已确认的 brief 和可选设计参考写成 durable prototype agent file，再进入 Refine 和 Execute。

主流程是：

```text
Explore → Plan → optional Design → Agent → Refine → Execute
```

进度线会保留 `Design` 阶段，但 Design 可以是 `○`。这表示用户已完成 Plan，并选择直接进入 Agent。

## 核心能力

| 能力 | 说明 |
|---|---|
| 结构化产品探索 | 围绕 `Explore / Plan / optional Design / Agent / Refine / Execute` 组织原型发现流程 |
| 产品 brief 沉淀 | 在产品 Q&A 后生成或刷新可编辑的 mind-map + flowchart brief |
| 用户意图追踪 | 在下一轮规划前读取互动工作区中的文字，把用户直接改过的内容当作最新意图 |
| 可选视觉设计 | 用 `proto-image-gen` 生成原型视觉稿；用 `proto-image-edit` 根据标注截图修订 |
| Agent 生成与执行 | 用 `proto-plan` 将 brief 和可选视觉参考转换成可执行 Agent 文件 |
| 互动工作区 | 需要时打开本地工作区，用来编辑 brief、查看视觉稿、做标注和保留中间产物 |
| 前端设计执行 | 用 `proto-frontend-design` 生成高品质、有辨识度的前端界面代码 |
| 文件化任务管理 | 用 `proto-planning-with-files` 在执行阶段追踪任务计划、发现和进度 |

## 典型工作流

### 1. Explore

用户给出产品、功能、页面、流程或原型想法。Codex 会先理解当前项目，找到已有产品形态、约束和可能的用户路径。

### 2. Plan

Codex 会让用户选择思考模式：

- **Fast**：Codex 可以推断低风险默认答案，只在关键选择上提问。
- **Slow**：Codex 只提问，不替用户做产品判断。

Q&A 会产出一个简洁产品 brief。互动工作区可用时，Codex 会把 brief 刷新成中心节点和分支节点：目标用户、目标结果、用户流程、核心 features、关键决定、剩余未知和完成标准。用户可以直接在这些节点上改文字，下一轮规划会读取这些改动。

### 3. Design（可选）

Plan 完成后，用户有两个选择：

- 调用 `proto-image-gen` 生成视觉设计。
- 跳过 Design，直接调用 `proto-plan` 进入 Agent。

`proto-image-gen` 适合生成：概念图、UI/UX 界面设计图、产品原型图、矢量风插画、平面海报、信息图表。

生成后，用户可以继续用 `proto-image-edit` 做标注修订，也可以调用 `proto-plan` 进入 Agent。

### 4. Agent

`proto-plan` 会把产品 brief 和可选 Design 参考写成可执行 Agent 文件：

```text
proto-agents/<slug>/agent-<slug>.md
```

如果用户跳过 Design，进度线显示：

```text
✓ Explore  ✓ Plan  ○ Design  ● Agent  ○ Refine  ○ Execute
```

如果先完成了 Design，则显示：

```text
✓ Explore  ✓ Plan  ✓ Design  ● Agent  ○ Refine  ○ Execute
```

### 5. Refine

用户可以继续要求 Codex 修改生成的 Agent 文件。这个阶段只改 Agent 文件，不开始实现。

### 6. Execute

用户确认后，Codex 会创建执行目标，按 Agent 文件实现原型。执行阶段会使用项目内的计划文件跟踪任务、发现和进度。

## 使用方式

### 开始产品原型探索

在 Codex 中说：

```text
Use $proto-me to help me prototype a new onboarding flow.
```

Codex 会探索项目、选择 Fast/Slow、进行 Q&A，并在互动工作区可用时生成可编辑产品 brief。

### 生成原型视觉设计

Plan 完成后可以说：

```text
Use $proto-image-gen to generate a mobile UI concept for this prototype.
```

也可以给出更具体的视觉方向：

```text
Use $proto-image-gen to create an infographic that explains the core workflow from the current brief.
```

Codex 会根据 brief 生成图片，并把图片放在当前文字 brief 右侧的空白区域。如果互动工作区中选中了 AI image holder，则按 holder 的尺寸和比例生成并填入。

![使用 Proto-me 生成并插入新图](assets/generate-image.png)

### 根据标注截图修订视觉稿

1. 在互动工作区中对图片做标注。
2. 截图并把标注截图发给 Codex。
3. 使用提示：

```text
Use $proto-image-edit to revise this Proto-me visual design from my annotation screenshot.
```

Codex 会读取截图里的标注和箭头，生成去掉标注痕迹的新图，并把结果放在原图旁边。原图和标注不会被删除或移动。

![根据 Proto-me 标注截图生成修订图](assets/annotation-edit.png)

### 直接进入 Agent

Design 是可选阶段。Plan 完成后可以直接说：

```text
Use $proto-plan to generate the prototype agent from the current brief.
```

如果此前生成过视觉设计，`proto-plan` 会把它当作可选风格和体验参考。如果没有视觉设计，`proto-plan` 会直接从产品 brief 生成 Agent。

### 打开互动工作区

当需要查看或直接编辑 brief、视觉稿、标注和中间产物时：

```text
Open the Proto-me canvas for this project.
```

Proto-me 会启动本地服务，默认地址是 `http://127.0.0.1:43217/`。如果默认端口被占用，Vite 会选择 fallback 端口，实际 URL 会写入 `canvas/<slug>/proto-me-runtime.json`。Codex 桌面应用会自动用内置浏览器打开工作区。

![在 Codex 中打开 Proto-me 互动工作区](assets/open-canvas.png)

## 技能

### 核心探索流程

| 技能 | 说明 |
|---|---|
| `proto-me` | 启动产品原型探索，完成 Explore 和 Plan，并提示可选 Design 或直接 Agent |
| `proto-plan` | 把产品 brief 和可选设计参考生成 durable prototype agent file |
| `proto-brainstorming` | 在创建功能、组件或修改行为前，通过协作对话探索意图、需求和设计 |

### 视觉设计

| 技能 | 说明 |
|---|---|
| `proto-image-gen` | 生成原型视觉设计，并插入当前文字 brief 右侧空白区域或选中的 AI image holder |
| `proto-image-edit` | 根据用户提供的标注截图修订原型视觉图，并把结果放在原图旁边 |
| `proto-frontend-design` | 生成有辨识度的高品质前端界面代码，避免千篇一律的 AI 风格 |

### 工作区与执行

| 技能 | 说明 |
|---|---|
| `proto-open-canvas` | 打开 Proto-me 本地互动工作区，用于编辑 brief、查看视觉稿和做标注 |
| `proto-planning-with-files` | 在执行复杂任务时用文件记录任务计划、发现和进度 |

## 安装

### 让 Codex 自动安装

把下面这段发给 Codex：

```text
请从 https://github.com/protome-dev/protome-skills.git 安装 Proto-me Codex 插件。
请 clone 仓库到 ~/marketplace/plugins/proto-me，确认 .codex-plugin/plugin.json 存在，
把插件加入 personal marketplace，先运行 codex plugin marketplace add ~/marketplace，
再运行 codex plugin add proto-me@personal。
安装后请校验插件，并告诉我是否需要开启一个新对话来加载新技能和 MCP 工具。
```

### 手动安装

推荐把插件 clone 到 Codex personal marketplace root 下的位置：

```bash
mkdir -p ~/marketplace/plugins
git clone https://github.com/protome-dev/protome-skills.git ~/marketplace/plugins/proto-me
cd ~/marketplace/plugins/proto-me
npm install
npm run build
```

确保 `~/marketplace/.agents/plugins/marketplace.json` 中有 Proto-me 条目：

```json
{
  "name": "personal",
  "interface": {
    "displayName": "Personal"
  },
  "plugins": [
    {
      "name": "proto-me",
      "source": {
        "source": "local",
        "path": "./plugins/proto-me"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

然后先注册 personal marketplace，再安装插件：

```bash
codex plugin marketplace add ~/marketplace
codex plugin add proto-me@personal
```

安装后建议开启一个新的 Codex 对话，让新的 skill 和 MCP 工具完整加载。

## 数据目录

Proto-me 将工作区数据写入用户当前项目，而不是插件仓库：

```text
canvas/<slug>/
  proto-me-runtime.json
  proto-me-selection.json
  proto-me-view-state.json
  pages/
    <page-id>/
      proto-me-canvas.json
      assets/
```

`<slug>` 来自产品或功能名：2-5 个词的 kebab-case，只包含小写字母、数字和连字符，无首尾连字符，最多 50 个字符。

Agent 文件会写入：

```text
proto-agents/<slug>/agent-<slug>.md
```

执行阶段的任务记录通常放在：

```text
.plan/<slug>/
```

## 本地开发

```bash
npm install
npm run dev
npm run build
```

也可以直接启动工作区服务，并指定用户项目目录：

```bash
./scripts/start-canvas.sh /path/to/user/project <slug>
```

常用环境变量：

| 变量 | 说明 |
|---|---|
| `PROTO_ME_PORT` | 本地服务端口，默认 `43217`。端口被占用时 Vite 会使用 fallback 端口，实际 URL 写入 `proto-me-runtime.json` |
| `PROTO_ME_PROJECT_DIR` | 工作区数据所属的用户项目目录 |
| `PROTO_ME_CANVAS_SLUG` | 产品或功能 slug；设置后默认数据目录是 `$PROTO_ME_PROJECT_DIR/canvas/$PROTO_ME_CANVAS_SLUG` |
| `PROTO_ME_CANVAS_DIR` | 数据目录；如果设置，会覆盖 `PROTO_ME_CANVAS_SLUG` 推导出的目录 |

## 开发者

Lena Doll  
lenadoll@protome.dev
https://www.protome.dev

## 致谢

Proto-me 的互动工作区基于 [tldraw/tldraw](https://github.com/tldraw/tldraw) 实现。
