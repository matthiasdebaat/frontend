import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/ha-alert";
import "../../../../components/ha-button";
import "../../../../components/ha-card";
import "../../../../components/ha-md-list";
import "../../../../components/ha-md-list-item";
import "../../../../components/ha-switch";
import "../../../../components/ha-tip";

import { formatDate } from "../../../../common/datetime/format_date";
import type { HaSwitch } from "../../../../components/ha-switch";
import type { CloudStatusLoggedIn } from "../../../../data/cloud";
import {
  connectCloudRemote,
  disconnectCloudRemote,
  updateCloudPref,
} from "../../../../data/cloud";
import type { HomeAssistant } from "../../../../types";
import { showToast } from "../../../../util/toast";
import { showCloudCertificateDialog } from "../dialog-cloud-certificate/show-dialog-cloud-certificate";
import { obfuscateUrl } from "../../../../util/url";
import "../../../../components/ha-copy-textfield";
import "../../../../layouts/hass-subpage";
import { haStyle } from "../../../../resources/styles";

@customElement("cloud-remote-pref")
export class CloudRemotePref extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public cloudStatus?: CloudStatusLoggedIn;

  @property({ type: Boolean }) public narrow = false;

  protected render() {
    if (!this.cloudStatus) {
      return nothing;
    }

    const { remote_enabled, remote_allow_remote_enable, strict_connection } =
      this.cloudStatus.prefs;

    const {
      remote_connected,
      remote_domain,
      remote_certificate,
      remote_certificate_status,
    } = this.cloudStatus;

    return html`
      <hass-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        .header=${this.hass.localize(
          "ui.panel.config.cloud.account.remote.title"
        )}
        back-path="/config/cloud/account"
      >
        <div class="content">
          ${!remote_certificate || remote_certificate_status !== "ready"
            ? html`
                <ha-card outlined>
                  <div class="preparing">
                    ${remote_certificate_status === "error"
                      ? this.hass.localize(
                          "ui.panel.config.cloud.account.remote.cerificate_error"
                        )
                      : remote_certificate_status === "loading"
                        ? this.hass.localize(
                            "ui.panel.config.cloud.account.remote.cerificate_loading"
                          )
                        : remote_certificate_status === "loaded"
                          ? this.hass.localize(
                              "ui.panel.config.cloud.account.remote.cerificate_loaded"
                            )
                          : this.hass.localize(
                              "ui.panel.config.cloud.account.remote.access_is_being_prepared"
                            )}
                  </div>
                </ha-card>
              `
            : html`
                <ha-card
                  outlined
                  header=${this.hass.localize(
                    "ui.panel.config.cloud.account.remote.card_title"
                  )}
                >
                  <div class="header-actions">
                    <ha-switch
                      .checked=${remote_enabled}
                      @change=${this._toggleChanged}
                    ></ha-switch>
                  </div>

                  <div class="card-content">
                    ${!remote_connected && remote_enabled
                      ? html`
                          <ha-alert
                            .title=${this.hass.localize(
                              `ui.panel.config.cloud.account.remote.reconnecting`
                            )}
                          ></ha-alert>
                        `
                      : strict_connection === "drop_connection"
                        ? html`<ha-alert
                            alert-type="warning"
                            .title=${this.hass.localize(
                              `ui.panel.config.cloud.account.remote.drop_connection_warning_title`
                            )}
                            >${this.hass.localize(
                              `ui.panel.config.cloud.account.remote.drop_connection_warning`
                            )}</ha-alert
                          >`
                        : nothing}
                    <p>
                      ${this.hass.localize(
                        "ui.panel.config.cloud.account.remote.info"
                      )}
                    </p>
                    ${remote_connected
                      ? nothing
                      : html`
                          <p>
                            ${this.hass.localize(
                              "ui.panel.config.cloud.account.remote.info_instance_will_be_available"
                            )}
                          </p>
                        `}

                    <ha-copy-textfield
                      .hass=${this.hass}
                      .value=${`https://${remote_domain}`}
                      .maskedValue=${obfuscateUrl(`https://${remote_domain}`)}
                      .label=${this.hass!.localize(
                        "ui.panel.config.common.copy_link"
                      )}
                    ></ha-copy-textfield>
                  </div>
                  <div class="card-actions">
                    <ha-button
                      appearance="plain"
                      href="https://www.nabucasa.com/config/remote/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ${this.hass.localize(
                        "ui.panel.config.cloud.account.remote.link_learn_how_it_works"
                      )}
                    </ha-button>
                  </div>
                </ha-card>

                <ha-card
                  outlined
                  .header=${this.hass.localize(
                    "ui.panel.config.cloud.account.remote.security_options"
                  )}
                >
                  <div class="card-content">
                    <ha-md-list>
                      <ha-md-list-item>
                        <span slot="headline"
                          >${this.hass.localize(
                            "ui.panel.config.cloud.account.remote.external_activation"
                          )}</span
                        >
                        <span slot="supporting-text"
                          >${this.hass.localize(
                            "ui.panel.config.cloud.account.remote.external_activation_secondary"
                          )}</span
                        >
                        <ha-switch
                          slot="end"
                          .checked=${remote_allow_remote_enable}
                          @change=${this._toggleAllowRemoteEnabledChanged}
                        ></ha-switch>
                      </ha-md-list-item>
                      <ha-md-list-item>
                        <span slot="headline"
                          >${this.hass.localize(
                            "ui.panel.config.cloud.account.remote.certificate_info"
                          )}</span
                        >
                        <span slot="supporting-text"
                          >${this.cloudStatus!.remote_certificate
                            ? this.hass.localize(
                                "ui.panel.config.cloud.account.remote.certificate_expire",
                                {
                                  date: formatDate(
                                    new Date(
                                      this.cloudStatus.remote_certificate
                                        .expire_date
                                    ),
                                    this.hass.locale,
                                    this.hass.config
                                  ),
                                }
                              )
                            : nothing}</span
                        >
                        <ha-button
                          slot="end"
                          appearance="plain"
                          size="small"
                          @click=${this._openCertInfo}
                        >
                          ${this.hass.localize(
                            "ui.panel.config.cloud.account.remote.more_info"
                          )}
                        </ha-button>
                      </ha-md-list-item>
                    </ha-md-list>
                  </div>
                </ha-card>
                <ha-tip .hass=${this.hass}>
                  ${this.hass.localize(
                    "ui.panel.config.cloud.account.remote.tip_custom_domain"
                  )}
                  <a
                    href="https://support.nabucasa.com/hc/en-us/articles/26497540527517"
                    target="_blank"
                    rel="noreferrer"
                    >${this.hass.localize(
                      "ui.panel.config.cloud.account.remote.tip_custom_domain_link"
                    )}</a
                  >
                </ha-tip>
              `}
        </div>
      </hass-subpage>
    `;
  }

  private _openCertInfo() {
    showCloudCertificateDialog(this, {
      certificateInfo: this.cloudStatus!.remote_certificate!,
    });
  }

  private async _toggleChanged(ev) {
    const toggle = ev.target as HaSwitch;

    try {
      if (toggle.checked) {
        await connectCloudRemote(this.hass);
      } else {
        await disconnectCloudRemote(this.hass);
      }
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err: any) {
      showToast(this, { message: err.message });
      toggle.checked = !toggle.checked;
    }
  }

  private async _toggleAllowRemoteEnabledChanged(ev) {
    const toggle = ev.target as HaSwitch;

    try {
      await updateCloudPref(this.hass, {
        remote_allow_remote_enable: toggle.checked,
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err: any) {
      showToast(this, { message: err.message });
      toggle.checked = !toggle.checked;
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
      .preparing {
        padding: 0 var(--ha-space-4) var(--ha-space-4);
      }
      a {
        color: var(--primary-color);
      }
      .card-content p {
        color: var(--secondary-text-color);
      }
      .header-actions {
        position: absolute;
        right: var(--ha-space-4);
        inset-inline-end: var(--ha-space-4);
        inset-inline-start: initial;
        top: var(--ha-space-6);
        display: flex;
        flex-direction: row;
      }
      .warning {
        font-weight: var(--ha-font-weight-bold);
        margin-bottom: 1em;
      }
      .break-word {
        overflow-wrap: break-word;
      }
      .connection-status {
        position: absolute;
        right: var(--ha-space-6);
        top: var(--ha-space-6);
        inset-inline-end: var(--ha-space-6);
        inset-inline-start: initial;
      }
      .card-actions {
        display: flex;
        justify-content: flex-end;
      }
      ha-md-list {
        background: none;
        --md-list-item-leading-space: 0;
        --md-list-item-trailing-space: 0;
      }
      ha-md-list-item {
        --md-item-overflow: visible;
      }
      ha-tip {
        max-width: 600px;
        margin: 0 auto;
      }
      ha-alert {
        display: block;
        margin-bottom: var(--ha-space-4);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-remote-pref": CloudRemotePref;
  }
}
