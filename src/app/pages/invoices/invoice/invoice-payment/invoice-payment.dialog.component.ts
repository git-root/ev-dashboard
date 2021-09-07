import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogParams } from 'types/Authorization';
import { BillingInvoice } from 'types/Billing';

import { Utils } from '../../../../utils/Utils';
import { InvoicePaymentComponent } from './invoice-payment.component';

@Component({
  template: '<app-invoice-payment #appRef [currentInvoiceID]="invoiceID" [currentUserID]="userID" [inDialog]="true" [dialogRef]="dialogRef" [amountWithCurrency]="amountWithCurrency"></app-invoice-payment>',
})
export class InvoicePaymentDialogComponent implements AfterViewInit {
  @ViewChild('appRef') public appRef!: InvoicePaymentComponent;
  public invoiceID!: string;
  public inDialog!: boolean;
  public userID!: string;
  public amountWithCurrency!: string;

  public constructor(
    public dialogRef: MatDialogRef<InvoicePaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: DialogParams<BillingInvoice>) {
    this.invoiceID = data.dialogData?.id;
    this.userID = data.dialogData?.currentUserID;
    this.amountWithCurrency = data.dialogData?.amountWithCurrency;
  }

  public ngAfterViewInit() {
    // Register key event
    this.dialogRef.keydownEvents().subscribe(async (keydownEvents) => {
      if (keydownEvents?.code === 'Escape') {
        this.appRef.close();
      }
      if (keydownEvents?.code === 'Enter') {
        if (this.appRef.isCardNumberValid && this.appRef.isExpirationDateValid && this.appRef.isCvcValid && !this.appRef.isPayClicked) {
          await this.appRef.pay();
        }
      }
    });
  }
}
