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

class MindMapSettingTab extends PluginSettingTab {
    plugin: CanvasMindMap;

    updateSettings(key: any, value: any): void {
        this.plugin.settings = {
            ...this.plugin.settings,
            [key.split('.')[0]]: {
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

        // let rowText: HTMLDivElement;
        // new Setting(containerEl)
        //     .setName('Navigate')
        //     .setDesc('The number of rows in the table')
        //     .addSlider((slider) =>
        //         slider
        //             .setLimits(2, 12, 1)
        //             .setValue(this.plugin.settings.rowCount)
        //             .onChange(async (value) => {
        //                 rowText.innerText = ` ${value.toString()}`;
        //                 this.plugin.settings.rowCount = value;
        //             }),
        //     )
        //     .settingEl.createDiv("", (el) => {
        //     rowText = el;
        //     el.className = "table-generator-setting-text";
        //     el.innerText = ` ${this.plugin.settings.rowCount.toString()}`;
        // });
        //
        // let columnText: HTMLDivElement;
        // new Setting(containerEl)
        //     .setName('Columns Count')
        //     .setDesc('The number of columns in the table')
        //     .addSlider((slider) =>
        //         slider
        //             .setLimits(2, 12, 1)
        //             .setValue(this.plugin.settings.columnCount)
        //             .onChange(async (value) => {
        //                 columnText.innerText = ` ${value.toString()}`;
        //                 this.plugin.settings.columnCount = value;
        //             }),
        //     )
        //     .settingEl.createDiv("", (el) => {
        //     columnText = el;
        //     el.className = "table-generator-setting-text";
        //     el.innerText = ` ${this.plugin.settings.columnCount.toString()}`;
        // });

        this.containerEl.createEl('h2', {text: 'Say Thank You'});

        new Setting(containerEl)
            .setName('Donate')
            .setDesc('If you like this plugin, consider donating to support continued development:')
            .addButton((bt) => {
                bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/boninall"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=boninall&button_colour=6495ED&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
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

        if (setting.navigate.useNavigate) {
            new Setting(containerEl)
                .setName('Modifier Key')
                .setDesc('The modifier key to use with the hotkey')
                .addDropdown((dropdown) => {
                    const mods = supportModifierKey();
                    dropdown.addOption('None', 'None');
                    dropdown.setValue(setting.navigate.modifierKey[0]);
                    dropdown.onChange((value) => {
                        this.updateSettings('navigate.modifierKey.0', value);
                    });
                });
        }

    }
}
