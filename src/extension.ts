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

function convertPath(winUri: string, driveLetterPart: (driveLetter: string) => string) {
	return winUri
		.replace(/\\/g, '/')
		.replace(/^\/?([A-Za-z]):\//, (match, driveLetter: string) => driveLetterPart(driveLetter) + '/');
}

const convertPathToGitBashFormat             = (winUri: string) => convertPath(winUri, (driveLetter) => '/'          + driveLetter.toLowerCase()      );

const convertPathToWslFormat                 = (winUri: string) => convertPath(winUri, (driveLetter) => '/mnt/'      + driveLetter.toLowerCase()      );

const convertPathToCygwinFormat              = (winUri: string) => convertPath(winUri, (driveLetter) => '/cygdrive/' + driveLetter.toLowerCase()      );

const convertPathToWindowsForwardSlashFormat = (winUri: string) => convertPath(winUri, (driveLetter) =>                driveLetter.toUpperCase() + ':');

const convertPathToWindowsDblBackslashFormat = (winUri: string) => convertPathToWindowsForwardSlashFormat(winUri).replace(/\//g, '\\\\');

function defaultConvertWindowUri(): ConvertWindowUri {
	const defaultFormat = vscode.workspace.getConfiguration("copy-path-unixstyle").get<string>("defaultFormat");
	switch (defaultFormat) {
		case "GitBash": return convertPathToGitBashFormat;
		case "WSL": return convertPathToWslFormat;
		case "Cygwin": return convertPathToCygwinFormat;
		case "WindowsForwardSlash": return convertPathToWindowsForwardSlashFormat;
		case "WindowsDblBackslash": return convertPathToWindowsDblBackslashFormat;
		default: 
			vscode.window.showErrorMessage("Error in copy-path-unixstyle.defaultFormat setting - defaulting to GitBash");
			return convertPathToGitBashFormat;
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
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, convertPathToGitBashFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathWSLFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, convertPathToWslFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathCygwinFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, convertPathToCygwinFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathWindowsForwardSlashFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, convertPathToWindowsForwardSlashFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyPathWindowsDblBackslashFormat", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.FULL_PATH, convertPathToWindowsDblBackslashFormat, arg1, arg2);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("copy-path-unixstyle.copyRelativePath", (arg1, arg2) => {
		copyPathsToClipboardUnixStyle(CopyPathType.RELATIVE_PATH, defaultConvertWindowUri(), arg1, arg2);
	}));
}

export function deactivate() { }
