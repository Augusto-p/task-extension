import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as Database from './database'


export async function activate(context: vscode.ExtensionContext) {
	const provider = new TasksViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.commands.registerCommand('StartTaskDB', async () => {
		let [DBPath, newFile] = CreateDBFile(vscode.workspace);
		if (DBPath != "") {
			const _DB = new Database.LocalDatabase(DBPath);
			if (newFile) {
				_DB.CreateDBStruct()
			}
			let Tareas = await _DB._GetAllTask()
			let view = provider.getView()
			if (view !== undefined) {
				view.webview.postMessage({ type: 'GetAll', Tareas: Tareas });
				let id = await _DB._GetNextId();
				view.webview.postMessage({ type: 'GetNextID', ID: id });
			}

		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('AddTaskToDB', async (id: number, Text: string, estado: boolean) => {
		const _DB = new Database.LocalDatabase(getDBFilePath(vscode.workspace));
		await _DB._CrearTarea(id, Text, estado);
		let Nid = await _DB._GetNextId();
		let view = provider.getView()
		if (view !== undefined) {
			view.webview.postMessage({ type: 'GetNextID', ID: Nid });
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('UpdateTextTaskToDB', async (id: number, Text: string) => {
		const _DB = new Database.LocalDatabase(getDBFilePath(vscode.workspace));
		await _DB._UpdateText(id, Text)

	}));

	context.subscriptions.push(vscode.commands.registerCommand('UpdateStatusTaskToDB', async (id: number, estado: boolean) => {
		const _DB = new Database.LocalDatabase(getDBFilePath(vscode.workspace));
		await _DB._NewEstado(id, estado)

	}));

	context.subscriptions.push(vscode.commands.registerCommand('DeleteTaskToDB', async (id: number) => {
		const _DB = new Database.LocalDatabase(getDBFilePath(vscode.workspace));
		await _DB._deleteTask(id)

	}));

	context.subscriptions.push(vscode.commands.registerCommand('GetNextIDTaskOfDB', async () => {
		const _DB = new Database.LocalDatabase(getDBFilePath(vscode.workspace));
		let id = await _DB._GetNextId();
		let view = provider.getView()
		if (view !== undefined) {
			view.webview.postMessage({ type: 'GetNextID', ID: id });
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('GetAllTasksOfDB', async () => {
		const _DB = new Database.LocalDatabase(getDBFilePath(vscode.workspace));
		let Tareas = await _DB._GetAllTask()
		let view = provider.getView()
		if (view !== undefined) {
			view.webview.postMessage({ type: 'GetAll', Tareas: Tareas });
		}
	}));

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TasksViewProvider.viewType, provider));


}

class TasksViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'MyTasksView';

	private _view?: vscode.WebviewView;


	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};




		webviewView.webview.html = this._getHtmlForWebview("sidebar.html", "style.css", "main.js");



		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case "StartTaskDB":
					vscode.commands.executeCommand(data.type);
					break;
				case "AddTaskToDB":
					vscode.commands.executeCommand(data.type, data.ID, data.Text, data.Status);
					break;

				case "UpdateTextTaskToDB":
					vscode.commands.executeCommand(data.type, data.ID, data.Text);
					break;
				case "UpdateStatusTaskToDB":
					vscode.commands.executeCommand(data.type, data.ID, data.Status);
					break;
				case "DeleteTaskToDB":
					vscode.commands.executeCommand(data.type, data.ID);
					break;
				case "GetNextIDTaskOfDB":
					vscode.commands.executeCommand(data.type, data.ID);
					break;
				case "GetAllTasksOfDB":
					vscode.commands.executeCommand(data.type);
					break;
				default:
					break;
			}

		});
	}


	private _getHtmlForWebview(HTMLFileName: string, CSSFileName: string, JSFileName: string) {
		const CSSFilePath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', CSSFileName);
		const htmlFilePath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'templates', HTMLFileName);
		const JSFilePath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', JSFileName);
		const JS_Code = fs.readFileSync(JSFilePath.fsPath, 'utf8');
		const HTML_Code = fs.readFileSync(htmlFilePath.fsPath, 'utf8');
		const CSS_Code = fs.readFileSync(CSSFilePath.fsPath, 'utf8');
		return `
		<style>${CSS_Code}</style>

		${HTML_Code}

		<script>${JS_Code}</script>
		`
	}

	public getView(): vscode.WebviewView | undefined {
		return this._view;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function CreateDBFile(Workspace: any): [string, boolean] {
	let newFile = false;
	const workspaceFolders = Workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return ["", false];
	}
	const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
	const WorkspaceVscodeFolderPath = path.join(workspaceFolderPath, ".vscode");
	if (!ExistAndFolder(WorkspaceVscodeFolderPath)) {
		fs.mkdirSync(WorkspaceVscodeFolderPath);
	}
	const workspaceDBFilePath = path.join(workspaceFolderPath, ".vscode", "Task.sqlite3");
	if (!fs.existsSync(workspaceDBFilePath)) {
		fs.closeSync(fs.openSync(workspaceDBFilePath, 'w'))
		newFile = true;
	}
	return [workspaceDBFilePath, newFile];
}

function getDBFilePath(Workspace: any): string {
	let newFile = false;
	const workspaceFolders = Workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return "";
	}
	const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
	return path.join(workspaceFolderPath, ".vscode", "Task.sqlite3");
}

function ExistAndFolder(path: string) {
	try {
		return fs.lstatSync(path).isDirectory();
	} catch (error) {
		return false;
	}
}


