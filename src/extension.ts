import * as vscode from 'vscode';

const isWindows = process.platform === 'win32';
const lineDelimiter = isWindows ? '\r\n' : '\n';

enum CopyPathType {
	FULL_PATH,
	RELATIVE_PATH
}

function copyPathsToClipboardUnixStyle(copyPathType: CopyPathType, arg1: any, arg2: any) {
	let resources: vscode.Uri[] | undefined;
	if (Array.isArray(arg2)) {
		resources = arg2;
	} else if (arg1) {
		resources = [arg1];
	} else {
		if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri) {
			resources = [vscode.window.activeTextEditor.document.uri];
		}
	}

	if (resources) {
		const paths: string[] = [];
		for (const resource of resources) {
			let path = "";
			if (copyPathType == CopyPathType.FULL_PATH) {
				path = resource.path;
			} else if (copyPathType == CopyPathType.RELATIVE_PATH) {
				path = vscode.workspace.asRelativePath(resource, false);
			}
			if (path) {
				paths.push(isWindows ? path.replace(/\\/g, '/').replace(/^(\/[A-Za-z]):\//, '$1/') : path);
			}
		}

		if (paths.length > 0) {
			vscode.env.clipboard.writeText(paths.join(lineDelimiter));
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('copy-path-unixstyle.copyPath', (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('copy-path-unixstyle.copyRelativePath', (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.RELATIVE_PATH, arg1, arg2);
	}));
}

export function deactivate() { }
