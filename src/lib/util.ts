import * as vscode from "vscode";

export const getProjectPath = (document: vscode.TextDocument) => {
    return vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
};
