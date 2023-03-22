import * as vscode from 'vscode';
import { Configuration, OpenAIApi} from 'openai';

function getOpenAIConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('openai');
}

// Initialize OpenAI API client
const configuration = new Configuration({
	apiKey: getOpenAIConfiguration().get('apiKey')
});
const openai = new OpenAIApi(configuration);

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		'extension.explainCode',
		async () => {
			const editor = vscode.window.activeTextEditor;

			if (editor) {
				const document = editor.document;
				const selection = editor.selection;

				if (!selection.isEmpty) {
					const code = document.getText(selection);
					try {
						const explanation = await getExplanation(code);
						vscode.window.showInformationMessage(explanation);
					} catch (error) {
						vscode.window.showErrorMessage('Failed to get an explanation.');
						console.error(error);
					}
				} else {
					vscode.window.showWarningMessage('No code is selected.');
				}
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() { }

async function getExplanation(code: string): Promise<string> {
	try {
		const response = await openai.createChatCompletion({
			model: "gpt-3.5-turbo",
			messages: [
				{ role: "system", content: "You are an AI that can explain code in simple terms." },
				{ role: "user", content: `Explain the following code in simple terms: ${code}` },
			]
		});

		if (response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
			return response.data.choices[0].message.content.trim();
		} else {
			throw new Error('No explanation found.');
		}
	} catch (err) {
		console.error(err);
		throw err;
	}
}
