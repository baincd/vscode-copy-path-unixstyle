import * as vscode from 'vscode';

const isWindows = process.platform === 'win32';
const lineDelimiter = isWindows ? '\r\n' : '\n';

enum CopyPathType {
	FULL_PATH,
	RELATIVE_PATH
}

interface ConvertWindowUri {
	(winUri: string): string
}

const fullPathCopyGitBashFormat      = (winUri: string) => winUri.replace(/\\/g, '/').replace(/^\/([A-Za-z]):\//, '/$1/');

const fullPathCopyWslFormat          = (winUri: string) => winUri.replace(/\\/g, '/').replace(/^\/([A-Za-z]):\//, '/mnt/$1/');

const fullPathCopyCygwinFormat       = (winUri: string) => winUri.replace(/\\/g, '/').replace(/^\/([A-Za-z]):\//, '/cygdrive/$1/');

const fullPathCopyUniversalWinFormat = (winUri: string) => winUri.replace(/\\/g, '/').replace(/^\/([A-Za-z]):\//, (match, driveLetter: string) => driveLetter.toUpperCase() + ':/');

function defaultConvertWindowUri(): ConvertWindowUri {
	const defaultFormat = vscode.workspace.getConfiguration("copy-path-unixstyle").get<string>("defaultFormat");
	switch (defaultFormat) {
		case "GitBash": return fullPathCopyGitBashFormat;
		case "WSL": return fullPathCopyWslFormat;
		case "Cygwin": return fullPathCopyCygwinFormat;
		case "UniversalWindows": return fullPathCopyUniversalWinFormat;
		default: 
			vscode.window.showErrorMessage("Error in copy-path-unixstyle.defaultFormat setting - defaulting to GitBash");
			return fullPathCopyGitBashFormat;
	}
}

function copyPathsToClipboardUnixStyle(copyPathType: CopyPathType, convertMethod: ConvertWindowUri, arg1: any, arg2: any) {
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
			if (copyPathType === CopyPathType.FULL_PATH) {
				path = resource.path;
			} else if (copyPathType === CopyPathType.RELATIVE_PATH) {
				path = vscode.workspace.asRelativePath(resource, false);
			}
			if (path) {
				paths.push(isWindows ? convertMethod(path) : path);
			}
		}

		if (paths.length > 0) {
			vscode.env.clipboard.writeText(paths.join(lineDelimiter));
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPath", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, defaultConvertWindowUri(), arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathGitBashFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, fullPathCopyGitBashFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathWSLFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, fullPathCopyWslFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathCygwinFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, fullPathCopyCygwinFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathUniversalFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, fullPathCopyUniversalWinFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyRelativePath", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.RELATIVE_PATH, defaultConvertWindowUri(), arg1, arg2);
	}));
}

export function deactivate() { }
