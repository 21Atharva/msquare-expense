import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-image-preview-dialog',
  template: `
    <div class="image-dialog">
      <img [src]="data.imageUrl" alt="Receipt Preview" />
    </div>
  `,
  styles: [`
    .image-dialog {
      text-align: center;
      padding: 10px;
    }
    .image-dialog img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: 8px;
    }
  `]
})
export class ImagePreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { imageUrl: string }) {}
}
