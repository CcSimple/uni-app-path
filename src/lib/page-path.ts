import * as nodePath from "path";
import * as vscode from "vscode";
import { Location, TextDocument, Position, CancellationToken } from "vscode";
import { getProjectPath } from "./util";
import fs from "node:fs";
import * as parser from "jsonc-parser";
import type { Location as JLocation } from "jsonc-parser";

const getJumpPath = (
  document: TextDocument,
  position: Position,
  token: CancellationToken
): string => {
  const fileName = document.fileName;
  const workDir = nodePath.dirname(fileName);
  // 匹配 pages.json
  if (/pages.json$/.test(fileName)) {
    // 解析 json
    const jsonTxt = fs.readFileSync(fileName, "utf-8");
    // pages.json json对象
    const json = parser.parse(jsonTxt);
    // 当前位置 节点 信息
    const location: JLocation = parser.getLocation(
      jsonTxt,
      document.offsetAt(position)
    );
    console.log(location);
    const { previousNode, path, isAtPropertyKey } = location;
    // 有节点信息, path 包含 page 并且 不是 json key
    if (
      previousNode &&
      previousNode.type === "string" &&
      (path.at(-1) === "path" || path.at(-1) === "root") && // root 跳转子包目录
      !isAtPropertyKey
    ) {
      let pagePath = previousNode.value as string;
      console.log("pagePath", pagePath);
      const rootKey = path[0];
      const isSub = rootKey === "subPackages";
      const isSubRoot = path.at(-1) === "root"; // 子包目录
      let root = "pages"; // 主包/子包 入口
      let jumpPath = nodePath.join(workDir, pagePath) + ".vue";
      if (isSub) {
        root = json[rootKey][path[1]].root;
        if (isSubRoot) {
          // 跳子包目录
          jumpPath = nodePath.join(workDir, root);
        } else {
          jumpPath = nodePath.join(workDir, root, pagePath) + ".vue";
        }
      } else {
        // 主包路径 还包含有 pages, 处理一下
        pagePath.replace("pages/", "/");
      }
      console.log("root", root);
      console.log("jumpPath", jumpPath);
      return jumpPath;
    }
  }
  return "";
};

const provideDefinition = (
  document: TextDocument,
  position: Position,
  token: CancellationToken
): Location | Location[] => {
  // const fileName = document.fileName;
  // const workDir = nodePath.dirname(fileName);
  // const word = document.getText(document.getWordRangeAtPosition(position));
  // const line = document.lineAt(position);
  // const curPath = getProjectPath(document);
  // console.log("fileName  --> ", fileName);
  // console.log("workDir  --> ", workDir);
  // console.log("word  --> ", word);
  // console.log("line  --> ", line);
  // console.log("line.text", line.text);
  // console.log("curPath  --> ", curPath);
  const jumpPath = getJumpPath(document, position, token);
  if (jumpPath) {
    if (fs.existsSync(jumpPath)) {
      return new vscode.Location(
        vscode.Uri.file(jumpPath),
        new vscode.Position(0, 0)
      );
    } else {
      console.log(`路径:【${jumpPath}】不存在~`);
      return [];
    }
  } else {
    return [];
  }
};

const provideHover = (
  document: TextDocument,
  position: Position,
  token: CancellationToken
) => {
  const jumpPath = getJumpPath(document, position, token);
  if (jumpPath) {
    return new vscode.Hover(`[${jumpPath}](${vscode.Uri.file(jumpPath).path})`);
  }
};

const selector = [
  { language: "json", pattern: "**/pages.json" },
  { language: "jsonc", pattern: "**/pages.json" },
  { language: "jsonl", pattern: "**/pages.json" },
];

export const setUpPagePath = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    // 注册如何实现跳转到定义，第一个参数表示仅对json文件生效
    vscode.languages.registerDefinitionProvider(selector, {
      provideDefinition,
    })
  );
  // hover 显示路径
  vscode.languages.registerHoverProvider(selector, {
    provideHover,
  });
  console.log("uni-app-path 插件已启用!!");
};
