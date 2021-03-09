import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { AddonInstallState } from "../../models/wowup/addon-install-state";
import { AddonSearchResult } from "../../models/wowup/addon-search-result";
import { AddonService } from "../../services/addons/addon.service";
import { SessionService } from "../../services/session/session.service";

@Component({
  selector: "app-addon-install-button",
  templateUrl: "./addon-install-button.component.html",
  styleUrls: ["./addon-install-button.component.scss"],
})
export class AddonInstallButtonComponent implements OnInit, OnDestroy {
  @Input() public addonSearchResult: AddonSearchResult;

  @Output() public onViewUpdated: EventEmitter<boolean> = new EventEmitter();

  private _subscriptions: Subscription[] = [];

  public disableButton = false;
  public showProgress = false;
  public progressValue = 0;
  public buttonText = "";

  public constructor(
    private _addonService: AddonService,
    private _sessionService: SessionService,
    private _translate: TranslateService
  ) {}

  public ngOnInit(): void {
    const isInstalled = this._addonService.isInstalled(
      this.addonSearchResult.externalId,
      this._sessionService.getSelectedWowInstallation()
    );
    this.disableButton = isInstalled;
    this.buttonText = this.getButtonText(isInstalled ? AddonInstallState.Complete : AddonInstallState.Unknown);
  }

  public ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
    this._subscriptions = [];
  }

  public getIsButtonActive(installState: AddonInstallState): boolean {
    return installState !== AddonInstallState.Unknown && installState !== AddonInstallState.Complete;
  }

  public getIsButtonDisabled(installState: AddonInstallState): boolean {
    return installState !== AddonInstallState.Unknown;
  }

  public getInstallStateText(installState: AddonInstallState): string {
    switch (installState) {
      case AddonInstallState.BackingUp:
        return this._translate.instant("COMMON.ADDON_STATUS.BACKINGUP");
      case AddonInstallState.Complete:
        return this._translate.instant("COMMON.ADDON_STATUS.COMPLETE");
      case AddonInstallState.Downloading:
        return this._translate.instant("COMMON.ADDON_STATUS.DOWNLOADING");
      case AddonInstallState.Installing:
        return this._translate.instant("COMMON.ADDON_STATUS.INSTALLING");
      case AddonInstallState.Pending:
        return this._translate.instant("COMMON.ADDON_STATUS.PENDING");
      default:
        return "";
    }
  }

  public getButtonText(installState: AddonInstallState): string {
    if (installState !== AddonInstallState.Unknown) {
      return this.getInstallStateText(installState);
    }

    return this._translate.instant("COMMON.ADDON_STATE.INSTALL");
  }

  public async onInstallUpdateClick(): Promise<void> {
    this.disableButton = true;
    try {
      await this._addonService.installPotentialAddon(
        this.addonSearchResult,
        this._sessionService.getSelectedWowInstallation(),
        this.onInstallUpdate
      );
    } catch (e) {
      console.error("onInstallUpdateClick failed", e);
      this.disableButton = false;
    }
  }

  private onInstallUpdate = (installState: AddonInstallState, progress: number): void => {
    this.showProgress = this.getIsButtonActive(installState);
    this.disableButton = this.getIsButtonDisabled(installState);
    this.progressValue = progress;
    this.buttonText = this.getButtonText(installState);
    this.onViewUpdated.emit(true);
  };
}
