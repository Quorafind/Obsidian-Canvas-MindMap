import { App, debounce, Platform, PluginSettingTab, Setting } from "obsidian";
import CanvasMindMap from "./canvasMindMap";

type ModifierKey = 'Alt' | 'Mod' | 'Shift';

function supportModifierKey() {

	return ['Alt', 'Mod', 'Shift'];

}

export interface MindMapSettings {
	navigate: {
		useNavigate: boolean;
		modifierKey: string[];
	};
	create: {
		createFloat: boolean;
		childDirection: string;
		siblingWidth: number;
		siblingHeight: number;
	};
	layout: {
		direction: 'TB' | 'BT' | 'LR' | 'RL';
		autoHeight: boolean;
		autoLayout: boolean;
		autoLayoutDirection: 'TB' | 'BT' | 'LR' | 'RL';
	};
	advanced: {
		transferToCommands: boolean;
	};
}


export const DEFAULT_SETTINGS: MindMapSettings = {
	navigate: {
		useNavigate: true,
		modifierKey: ['Alt'],
	},
	create: {
		createFloat: true,
		childDirection: 'right',
		siblingWidth: 200,
		siblingHeight: 100,
	},
	layout: {
		direction: 'LR',
		autoLayout: true,
		autoLayoutDirection: 'LR',
		autoHeight: true,
	},
	advanced: {
		transferToCommands: false,
	}
};

export class MindMapSettingTab extends PluginSettingTab {
	plugin: CanvasMindMap;

	updateSettings(key: any, value: any): void {

		this.plugin.settings = {
			...this.plugin.settings,
			[key.split('.')[0]]: {
				// @ts-ignore
				...this.plugin.settings[key.split('.')[0]],
				[key.split('.')[1]]: value,
			},
		};
		this.applySettingsUpdate();
	}

	applySettingsUpdate = debounce(
		async () => {
			await this.plugin.saveSettings();
			console.log('debounce');
		},
		300,
		true,
	);

	constructor(app: App, plugin: CanvasMindMap) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Canvas MindMap'});

		this.useNavigateHotkeySetting(containerEl, this.plugin.settings);
		this.createHotkeySetting(containerEl, this.plugin.settings);
		this.autoLayoutSettings(containerEl, this.plugin.settings);

		new Setting(containerEl)
			.setName('Donate')
			.setDesc('If you like this plugin, consider donating to support continued development:')
			.addButton((bt) => {
				bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/boninall"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=boninall&button_colour=6495ED&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
			});
	}

	autoLayoutSettings(containerEl: HTMLElement, setting: MindMapSettings) {
		new Setting(containerEl)
			.setName('Delete Node to Auto Layout')
			.setDesc('Deleting MindMap nodes triggers automatic layout update')
			.addToggle((toggle) => {
				toggle.setValue(setting.layout.autoLayout);
				toggle.onChange((value) => {
					this.updateSettings('layout.autoLayout', value);

					setTimeout(() => {
						this.display();
					}, 700);
				});
			});
	}

	useNavigateHotkeySetting(containerEl: HTMLElement, setting: MindMapSettings) {
		new Setting(containerEl)
			.setName('Use Navigate Hotkey')
			.setDesc('Use the hotkey to navigate the mind map')
			.addToggle((toggle) => {
				toggle.setValue(setting.navigate.useNavigate);
				toggle.onChange((value) => {
					this.updateSettings('navigate.useNavigate', value);

					setTimeout(() => {
						this.display();
					}, 700);
				});
			});

		// if (setting.navigate.useNavigate) {
		// 	new Setting(containerEl)
		// 		.setName('Modifier Key')
		// 		.setDesc('The modifier key to use with the hotkey')
		// 		.addDropdown((dropdown) => {
		// 			const mods = supportModifierKey();
		// 			dropdown.addOption('None', 'None');
		// 			dropdown.setValue(setting.navigate.modifierKey[0]);
		// 			dropdown.onChange((value) => {
		// 				this.updateSettings('navigate.modifierKey.0', value);
		// 			});
		// 		});
		// }

	}

	private createHotkeySetting(containerEl: HTMLElement, setting: MindMapSettings) {
		new Setting(containerEl)
			.setName('Create Float')
			.setDesc('Create a float node')
			.addToggle((toggle) => {
				toggle.setValue(setting.create.createFloat);
				toggle.onChange((value) => {
					this.updateSettings('create.createFloat', value);
				});
			});
		//
		// new Setting(containerEl)
		// 	.setName('Child Direction')
		// 	.setDesc('The direction of the child node')
		// 	.addDropdown((dropdown) => {
		// 		dropdown.addOption('Right', 'right');
		// 		dropdown.addOption('Left', 'left');
		// 		dropdown.addOption('Up', 'up');
		// 		dropdown.addOption('Down', 'down');
		// 		dropdown.setValue(setting.create.childDirection);
		// 		dropdown.onChange((value) => {
		// 			this.updateSettings('create.childDirection', value);
		// 		});
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('Sibling Width')
		// 	.setDesc('The width of the sibling node')
		// 	.addSlider((slider) => {
		// 		slider.setLimits(100, 500, 10);
		// 		slider.setValue(setting.create.siblingWidth);
		// 		slider.onChange((value) => {
		// 			this.updateSettings('create.siblingWidth', value);
		// 		});
		// 	});
		//
		// new Setting(containerEl)
		// 	.setName('Sibling Height')
		// 	.setDesc('The height of the sibling node')
		// 	.addSlider((slider) => {
		// 		slider.setLimits(50, 300, 10);
		// 		slider.setValue(setting.create.siblingHeight);
		// 		slider.onChange((value) => {
		// 			this.updateSettings('create.siblingHeight', value);
		// 		});
		// 	});
	}
}
