import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import type { CloudStatusLoggedIn } from "../../../../data/cloud";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../components/voice-assistant-brand-icon";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";

@customElement("cloud-google-alexa-pref")
export class CloudGoogleAlexaPref extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property({ attribute: false }) public cloudStatus!: CloudStatusLoggedIn;

  protected render() {
    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${this.hass.localize(
          "ui.panel.config.cloud.account.google_alexa.title"
        )}
        back-path="/config/cloud/account"
      >
        <div class="content">
          <ha-card outlined>
            <div class="card-header">
              <voice-assistant-brand-icon
                .hass=${this.hass}
                .voiceAssistantId=${"cloud.alexa"}
              ></voice-assistant-brand-icon>
              ${this.hass.localize(
                "ui.panel.config.cloud.account.google_alexa.alexa.card_title"
              )}
            </div>
            <div class="card-content">
              <p>
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.google_alexa.alexa.description"
                )}
              </p>
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://support.nabucasa.com/hc/en-us/articles/25619363899677"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.google_alexa.alexa.link_learn_more"
                )}
              </ha-button>
              <ha-button
                appearance="filled"
                href="/config/voice-assistants/assistants"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.google_alexa.configure"
                )}
              </ha-button>
            </div>
          </ha-card>
          <ha-card outlined>
            <div class="card-header">
              <voice-assistant-brand-icon
                .hass=${this.hass}
                .voiceAssistantId=${"cloud.google_assistant"}
              ></voice-assistant-brand-icon>
              ${this.hass.localize(
                "ui.panel.config.cloud.account.google_alexa.google.card_title"
              )}
            </div>
            <div class="card-content">
              <p>
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.google_alexa.google.description"
                )}
              </p>
            </div>
            <div class="card-actions">
              <ha-button
                appearance="plain"
                href="https://support.nabucasa.com/hc/en-us/articles/25619376817053"
                target="_blank"
                rel="noreferrer"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.google_alexa.google.link_learn_more"
                )}
              </ha-button>
              <ha-button
                appearance="filled"
                href="/config/voice-assistants/assistants"
              >
                ${this.hass.localize(
                  "ui.panel.config.cloud.account.google_alexa.configure"
                )}
              </ha-button>
            </div>
          </ha-card>
        </div>
      </hass-subpage>
    `;
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
      .card-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
      }
      .card-content p {
        color: var(--secondary-text-color);
      }
      .card-actions {
        display: flex;
        justify-content: space-between;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-google-alexa-pref": CloudGoogleAlexaPref;
  }
}
