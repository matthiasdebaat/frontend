import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../components/ha-language-picker";
import "../../../../components/ha-md-list";
import "../../../../components/ha-md-list-item";
import "../../../../components/ha-select";
import "../../../../components/ha-tip";
import "../../../../components/voice-assistant-brand-icon";
import type { HaSelectSelectEvent } from "../../../../components/ha-select";
import type { CloudStatusLoggedIn } from "../../../../data/cloud";
import { updateCloudPref } from "../../../../data/cloud";
import type { CloudTTSInfo } from "../../../../data/cloud/tts";
import {
  getCloudTTSInfo,
  getCloudTtsLanguages,
} from "../../../../data/cloud/tts";
import { showAlertDialog } from "../../../../dialogs/generic/show-dialog-box";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";
import { showTryTtsDialog } from "./show-dialog-cloud-tts-try";

export const getCloudTtsSupportedVoices = (
  language: string,
  info: CloudTTSInfo | undefined
) => {
  const voices: { voiceId: string; voiceName: string }[] = [];

  if (!info) {
    return voices;
  }

  for (const [curLang, voiceId, voiceName] of info.languages) {
    if (curLang === language) {
      voices.push({ voiceId, voiceName });
    }
  }

  return voices;
};

@customElement("cloud-tts-pref")
export class CloudTTSPref extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public cloudStatus?: CloudStatusLoggedIn;

  @property({ type: Boolean, reflect: true }) public narrow = false;

  @state() private savingPreferences = false;

  @state() private ttsInfo?: CloudTTSInfo;

  protected render() {
    if (!this.cloudStatus || !this.ttsInfo) {
      return nothing;
    }

    const languages = this.getLanguages(this.ttsInfo);
    const defaultVoice = this.cloudStatus.prefs.tts_default_voice;
    const voices = this.getSupportedVoices(defaultVoice[0], this.ttsInfo);

    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${this.hass.localize("ui.panel.config.cloud.account.tts.title")}
        back-path="/config/cloud/account"
      >
        <div class="content">
          <ha-card outlined>
            <div class="card-header">
              <voice-assistant-brand-icon
                .hass=${this.hass}
                .voiceAssistantId=${"conversation"}
              ></voice-assistant-brand-icon>
              ${this.hass.localize(
                "ui.panel.config.cloud.account.assist.card_title"
              )}
            </div>
            <div class="card-content">
              <p>
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.assist.description"
                )}
              </p>
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://www.home-assistant.io/voice_control/"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.assist.link_learn_more"
                )}
              </ha-button>
              <ha-button
                appearance="filled"
                href="/config/voice-assistants/assistants"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.assist.configure"
                )}
              </ha-button>
            </div>
          </ha-card>
          <ha-card
            outlined
            header=${this.hass.localize(
              "ui.panel.config.cloud.account.tts.card_title"
            )}
          >
            <div class="card-content">
              <ha-md-list>
                <ha-md-list-item>
                  <span slot="headline">
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.default_language"
                    )}
                  </span>
                  <span slot="supporting-text">
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.default_language_description"
                    )}
                  </span>
                  <ha-language-picker
                    slot="end"
                    .hass=${this.hass}
                    .label=${""}
                    .disabled=${this.savingPreferences}
                    .value=${defaultVoice[0]}
                    .languages=${languages}
                    noClearButton
                    @value-changed=${this._handleLanguageChange}
                  >
                  </ha-language-picker>
                </ha-md-list-item>
                <ha-md-list-item>
                  <span slot="headline">
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.default_voice"
                    )}
                  </span>
                  <span slot="supporting-text">
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.default_voice_description"
                    )}
                  </span>
                  <ha-select
                    slot="end"
                    .disabled=${this.savingPreferences}
                    .value=${defaultVoice[1]}
                    @selected=${this._handleVoiceChange}
                    .options=${voices.map((voice) => ({
                      value: voice.voiceId,
                      label: voice.voiceName,
                    }))}
                  >
                  </ha-select>
                </ha-md-list-item>
                <ha-md-list-item>
                  <span slot="headline">
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.try"
                    )}
                  </span>
                  <span slot="supporting-text">
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.try_description"
                    )}
                  </span>
                  <ha-button
                    slot="end"
                    appearance="filled"
                    @click=${this._openTryDialog}
                  >
                    ${this.hass.localize(
                      "ui.panel.config.cloud.account.tts.try"
                    )}
                  </ha-button>
                </ha-md-list-item>
              </ha-md-list>
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://support.nabucasa.com/hc/en-us/articles/25619386304541"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.tts.link_learn_more"
                )}
              </ha-button>
            </div>
          </ha-card>
          <ha-card
            outlined
            header=${this.hass.localize(
              "ui.panel.config.cloud.account.stt.card_title"
            )}
          >
            <div class="card-content">
              <p>
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.stt.description"
                )}
              </p>
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://support.nabucasa.com/hc/en-us/articles/29718084245149"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.stt.link_learn_more"
                )}
              </ha-button>
            </div>
          </ha-card>
          <ha-tip .hass=${this.hass}>
            ${this.hass.localize("ui.panel.config.cloud.account.tts.tip")}
          </ha-tip>
        </div>
      </hass-subpage>
    `;
  }

  protected willUpdate(changedProps) {
    super.willUpdate(changedProps);
    if (!this.hasUpdated) {
      getCloudTTSInfo(this.hass).then((info) => {
        this.ttsInfo = info;
      });
    }
    if (changedProps.has("cloudStatus")) {
      this.savingPreferences = false;
    }
  }

  private getLanguages = memoizeOne(getCloudTtsLanguages);

  private getSupportedVoices = memoizeOne(getCloudTtsSupportedVoices);

  private _openTryDialog() {
    showTryTtsDialog(this, {
      defaultVoice: this.cloudStatus!.prefs.tts_default_voice,
    });
  }

  private async _handleLanguageChange(ev) {
    if (ev.detail.value === this.cloudStatus!.prefs.tts_default_voice[0]) {
      return;
    }
    this.savingPreferences = true;
    const language = ev.detail.value;

    const curVoice = this.cloudStatus!.prefs.tts_default_voice[1];
    const voices = this.getSupportedVoices(language, this.ttsInfo);
    const newVoice = voices.find((item) => item.voiceId === curVoice)
      ? curVoice
      : voices[0].voiceId;

    try {
      await updateCloudPref(this.hass, {
        tts_default_voice: [language, newVoice],
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err: any) {
      this.savingPreferences = false;
      // eslint-disable-next-line no-console
      console.error(err);
      showAlertDialog(this, {
        text: `Unable to save default language. ${err}`,
        warning: true,
      });
    }
  }

  private async _handleVoiceChange(ev: HaSelectSelectEvent) {
    const voice = ev.detail.value;
    if (!voice || voice === this.cloudStatus!.prefs.tts_default_voice[1]) {
      return;
    }
    this.savingPreferences = true;
    const language = this.cloudStatus!.prefs.tts_default_voice[0];

    try {
      await updateCloudPref(this.hass, {
        tts_default_voice: [language, voice],
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err: any) {
      this.savingPreferences = false;
      // eslint-disable-next-line no-console
      console.error(err);
      showAlertDialog(this, {
        text: `Unable to save default voice. ${err}`,
        warning: true,
      });
    }
  }

  static styles = [
    haStyle,
    css`
      .content {
        padding: 28px 20px 0;
        max-width: 1040px;
        margin: 0 auto;
      }
      ha-card {
        display: block;
        max-width: 600px;
        margin: 0 auto;
        margin-bottom: var(--ha-space-6);
      }
      a {
        color: var(--primary-color);
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
      }
      .card-content {
        padding-left: 0;
        padding-right: 0;
      }
      .card-content p {
        color: var(--secondary-text-color);
        padding-inline: var(--ha-space-4);
        margin: 0;
      }
      ha-md-list {
        background: none;
        --md-list-item-leading-space: var(--ha-space-4);
        --md-list-item-trailing-space: var(--ha-space-4);
      }
      ha-md-list-item {
        --md-item-overflow: visible;
      }
      ha-language-picker,
      ha-select {
        min-width: 210px;
      }
      @media all and (max-width: 450px) {
        ha-language-picker,
        ha-select {
          min-width: 160px;
          width: 160px;
        }
      }
      .card-actions {
        display: flex;
        justify-content: space-between;
      }
      ha-tip {
        max-width: 600px;
        margin: 0 auto;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-tts-pref": CloudTTSPref;
  }
}
