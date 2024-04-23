import * as vscode from 'vscode';
import { setUpPagePath } from './lib/page-path';

export function activate(context: vscode.ExtensionContext) {
	console.log('ohh~, 插件 "uni-app-path" 已启用!!!');
	setUpPagePath(context);
}

export function deactivate() {
	console.log('shit~, 插件 "uni-app-path" 已停用...');
}
