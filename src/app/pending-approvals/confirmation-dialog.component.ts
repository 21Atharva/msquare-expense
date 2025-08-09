import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-btn">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onConfirm()"
          class="confirm-btn">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 350px;
      max-width: 500px;
      padding: 20px;
      max-height: none;
      overflow: visible;
    }
    
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
      padding: 0;
    }
    
    mat-dialog-content {
      padding: 0;
      margin: 0 0 20px 0;
      max-height: none;
      overflow: visible;
      
      p {
        font-size: 1rem;
        color: #555;
        line-height: 1.5;
        margin: 0;
        padding: 0;
      }
    }
    
    mat-dialog-actions {
      padding: 0;
      margin: 0;
      gap: 12px;
      min-height: auto;
    }
    
    .cancel-btn {
      color: #666;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
    
    .confirm-btn {
      background-color: #007bff;
      
      &:hover {
        background-color: #0056b3;
      }
    }

    // Remove any scrollbars
    :host ::ng-deep .mat-mdc-dialog-container {
      overflow: visible !important;
      max-height: none !important;
    }

    :host ::ng-deep .mat-mdc-dialog-content {
      overflow: visible !important;
      max-height: none !important;
      padding: 0 !important;
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
} 