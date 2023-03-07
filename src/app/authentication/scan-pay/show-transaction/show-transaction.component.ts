import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorizationService } from 'services/authorization.service';
import { TransactionHeaderComponent } from 'shared/dialogs/transaction/header/transaction-header.component';
import { User } from 'types/User';

import { CentralServerService } from '../../../services/central-server.service';
import { ConfigService } from '../../../services/config.service';
import { MessageService } from '../../../services/message.service';
import { SpinnerService } from '../../../services/spinner.service';
import { Transaction } from '../../../types/Transaction';
import { Utils } from '../../../utils/Utils';

@Component({
  selector: 'app-show-transaction',
  templateUrl: 'show-transaction.component.html',
  // styleUrls: ['transaction.component.scss']
})
export class ShowTransactionComponent implements OnInit, OnDestroy {
  // @ViewChild('chartConsumption') public chartComponent!: ConsumptionChartComponent;
  @ViewChild('transactionHeader') public transactionHeader!: TransactionHeaderComponent;

  @Input() public transactionID!: number;

  public currentTransactionID!: number;
  public transaction: Transaction;
  public isClicked: boolean;
  public token: string;
  public user: Partial<User>;
  public email: string;

  private refreshInterval;
  public constructor(
    private spinnerService: SpinnerService,
    private messageService: MessageService,
    private router: Router,
    private centralServerService: CentralServerService,
    private configService: ConfigService,
    private authorizationService: AuthorizationService,
    private activatedRoute: ActivatedRoute) {
    this.currentTransactionID = this.activatedRoute?.snapshot?.params['transactionID'];
    this.email = this.activatedRoute?.snapshot?.params['email'];
    this.token = this.activatedRoute?.snapshot?.params['token'];
    this.user = { email: this.email, verificationToken: this.token, password: this.token, acceptEula: true } as Partial<User>;
  }

  public ngOnInit(): void {
    this.login(this.user);
    // Load
    this.loadData();
  }

  public ngOnDestroy(): void {
    // Destroy transaction refresh
    this.destroyTransactionRefresh();
  }

  public loadData() {
    this.spinnerService.show();
    const user = { email: this.email, password: this.token, acceptEula: true } as Partial<User>;
    // clear User and UserAuthorization
    this.authorizationService.cleanUserAndUserAuthorization();
    this.centralServerService.login(user).subscribe({
      next: (result) => {
        this.centralServerService.loginSucceeded(result.token);
        this.centralServerService.getTransaction(this.currentTransactionID).subscribe({
          next: (transaction: Transaction) => {
            this.spinnerService.hide();
            this.transaction = transaction;
          },
          error: (error) => {
            this.spinnerService.hide();
            Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'transactions.load_transaction_error');
          }
        });
      },
      error: (error) => {
        this.spinnerService.hide();
        Utils.handleHttpError(error, this.router, this.messageService,
          this.centralServerService, 'general.unexpected_error_backend');
      }
    });
  }

  public scanPayStopTransaction() {
    this.isClicked = true;
    const data = {};
    this.spinnerService.show();
    //TODO: ajuster les params avec l'url hash
    data['email'] = this.transaction?.user?.email;
    // Show
    data['transactionId'] = this.currentTransactionID;
    data['token'] = this.token;
    // launch capture and stop transaction
    this.centralServerService.chargingStationStopTransaction(this.transaction.chargeBoxID, this.currentTransactionID).subscribe({
      next: (response) => {
        this.spinnerService.hide();
        this.messageService.showSuccessMessage('settings.billing.scan_pay_stop_success');
        // void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.spinnerService.hide();
        this.messageService.showErrorMessage('settings.billing.scan_pay_stop_error');
        // void this.router.navigate(['/auth/login']);
      }
    });
  }

  private login(user: Partial<User>): void {
    this.spinnerService.show();
    // clear User and UserAuthorization
    this.authorizationService.cleanUserAndUserAuthorization();
    // Login
    this.centralServerService.login(user).subscribe({
      next: (result) => {
        this.spinnerService.hide();
        this.centralServerService.loginSucceeded(result.token);

      },
      error: (error) => {
        this.spinnerService.hide();
        switch (error.status) {
          default:
            Utils.handleHttpError(error, this.router, this.messageService,
              this.centralServerService, 'general.unexpected_error_backend');
        }
      }
    });
  }

  private destroyTransactionRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}