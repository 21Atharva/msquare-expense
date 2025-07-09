import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {
  @Output() categoryAdded = new EventEmitter<string[]>();
  keywords: string[] = [];
  CategoryLoad: boolean = true;
  isSaving: boolean = false;
  isEdit: boolean = false;

  constructor(public businesData: BusinessDataService) {}

  ngOnInit(): void {
    this.onGetCategory();
  }

  onGetCategory() {
    this.CategoryLoad = true;
    this.isSaving = false;
    this.businesData.onGetAllCategory().subscribe((res: any) => {
      if (res) {
        this.CategoryLoad = false;
        this.keywords = res.data;
      }
    });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.keywords.includes(value)) {
      this.keywords.push(value);
    }
    event.chipInput!.clear();
  }

  removeKeyword(keyword: string): void {
    const index = this.keywords.indexOf(keyword);
    if (index >= 0) {
      if (this.isEdit && index < 4) return; // Restrict first 4 during edit
      this.keywords.splice(index, 1);
    }
  }

  onSave(): void {
    this.isSaving = true;
    this.businesData.onCreateCategory(this.keywords).subscribe((res) => {
      if (res) {
        this.isSaving = false;
        this.categoryAdded.emit(this.keywords);
        this.onGetCategory();
      }
    });
  }

  onSaveEditCategories(): void {
    this.isSaving = true;
    this.businesData.onEditCategory(this.keywords).subscribe((res) => {
      if (res) {
        this.isSaving = false;
        this.isEdit = false;
        this.categoryAdded.emit(this.keywords);
        this.onGetCategory();
      }
    });
  }

  onReset(): void {
    this.onGetCategory(); // reload original categories
  }

  onEditCategories(): void {
    this.isEdit = !this.isEdit;
  }
}
